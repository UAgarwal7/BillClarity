# Appeal Service — Packet section generation + assembly

import json
from services.gemini_service import (
    generate_appeal_letter,
    generate_negotiation_script,
    generate_explanation,
    call_gemini,
    load_prompt,
)
from db.repositories import appeal_packets_repo


# Section generators map section name → generation function
async def _generate_bill_explanation(bill_metadata, line_items, **_):
    return await generate_explanation(bill_metadata, line_items)


async def _generate_flagged_issues(errors, **_):
    """Format flagged issues into structured markdown."""
    md = "## Flagged Billing Issues\n\n"
    severity_order = {"critical": 0, "warning": 1, "info": 2}
    sorted_errors = sorted(errors, key=lambda e: severity_order.get(e.get("severity", "info"), 3))

    for i, error in enumerate(sorted_errors, 1):
        severity = error.get("severity", "info").upper()
        md += f"### {i}. [{severity}] {error.get('type', 'Issue').replace('_', ' ').title()}\n\n"
        md += f"**Affected Item:** {error.get('description', 'Unknown')}\n\n"
        md += f"{error.get('message', '')}\n\n"
        if error.get("suggested_action"):
            md += f"**Suggested Action:** {error['suggested_action']}\n\n"
        if error.get("affected_amount"):
            md += f"**Amount in Question:** ${error['affected_amount']:,.2f}\n\n"
        md += "---\n\n"

    return md


async def _generate_benchmark_analysis(benchmarks, **_):
    """Format benchmark results into structured markdown."""
    md = "## Benchmark Price Comparison\n\n"
    md += "| Code | Description | Billed | Medicare Rate | Typical Median | Deviation |\n"
    md += "|------|-------------|--------|--------------|----------------|----------|\n"

    for b in benchmarks:
        dev = b.get("deviation_percentage", 0)
        dev_str = f"+{dev:.0f}%" if dev > 0 else f"{dev:.0f}%"
        md += (
            f"| {b.get('code', '')} "
            f"| {b.get('description', '')} "
            f"| ${b.get('billed_amount', 0):,.2f} "
            f"| ${b.get('medicare_rate', 0):,.2f} "
            f"| ${b.get('typical_median', 0):,.2f} "
            f"| {dev_str} |\n"
        )

    extreme = [b for b in benchmarks if b.get("risk_level") == "extreme"]
    if extreme:
        md += f"\n**{len(extreme)} charge(s) are extremely above typical pricing** and should be prioritized in your dispute.\n"

    return md


async def _generate_insurance_insights_section(insights, **_):
    """Format insurance insights into structured markdown."""
    md = "## Insurance Rule Insights\n\n"

    if isinstance(insights, dict):
        for insight in insights.get("insights", []):
            strength = insight.get("strength", "unknown").upper()
            md += f"### {insight.get('rule', 'Unknown Rule')} (Applicability: {strength})\n\n"
            md += f"{insight.get('description', '')}\n\n"
            md += f"**How it applies:** {insight.get('applicability', '')}\n\n"
            if insight.get("appeal_strategy"):
                md += f"**Appeal Strategy:** {insight['appeal_strategy']}\n\n"
            md += "---\n\n"

        for trigger in insights.get("appeal_triggers", []):
            md += f"**Appeal Trigger:** {trigger.get('trigger', '')}\n\n"
            md += f"- Success Likelihood: {trigger.get('success_likelihood', 'unknown')}\n"
            md += f"- Reasoning: {trigger.get('reasoning', '')}\n\n"

    return md


async def _generate_coding_review_request(bill_metadata, errors, **_):
    """Generate a formal coding review request letter via Gemini."""
    prompt = f"""You are a medical billing analyst AI.

Generate a formal coding review request letter for the following billing issues:

Provider: {bill_metadata.get('provider', '[Provider]')}
Facility: {bill_metadata.get('facility', '[Facility]')}

Issues found:
{json.dumps(errors, indent=2)}

Write a concise, professional letter requesting an itemized coding review. Include:
- Specific codes under dispute
- Reason for the review request
- Request for written response within 30 days

Format as markdown. Use [brackets] for placeholders the patient must fill in."""

    return await call_gemini(prompt)


async def _generate_evidence_checklist(errors, benchmarks, **_):
    """Generate a list of evidence documents to gather."""
    checklist = [
        "Original itemized medical bill",
        "Insurance Explanation of Benefits (EOB)",
        "Insurance plan summary (Summary of Benefits and Coverage)",
        "This appeal packet (printed or digital)",
    ]

    has_duplicate = any(e.get("type") == "duplicate" for e in errors)
    has_overpriced = any(
        b.get("risk_level") == "extreme" for b in benchmarks
    )

    if has_duplicate:
        checklist.append("Medical records showing only one procedure was performed (if applicable)")
    if has_overpriced:
        checklist.append("Medicare fee schedule printout for overpriced items")
        checklist.append("Hospital price transparency data (if publicly available)")

    checklist.extend([
        "Any prior authorization documentation",
        "Notes from previous calls with billing department (dates, names, reference numbers)",
        "Photo ID and insurance card copies",
    ])

    return checklist


async def generate_packet(
    bill_id: str,
    bill_metadata: dict,
    line_items: list,
    errors: list,
    benchmarks: list,
    insights: dict | list,
    selected_sections: list[str],
) -> str:
    """Generate all selected appeal packet sections. Returns packet_id."""
    sections = {}
    kwargs = {
        "bill_metadata": bill_metadata,
        "line_items": line_items,
        "errors": errors,
        "benchmarks": benchmarks,
        "insights": insights,
    }

    generators = {
        "bill_explanation": _generate_bill_explanation,
        "flagged_issues": _generate_flagged_issues,
        "benchmark_analysis": _generate_benchmark_analysis,
        "insurance_insights": _generate_insurance_insights_section,
        "appeal_letter": lambda **kw: generate_appeal_letter(
            kw["bill_metadata"], kw["errors"], kw["benchmarks"], kw["insights"]
        ),
        "coding_review_request": _generate_coding_review_request,
        "negotiation_script": lambda **kw: generate_negotiation_script(
            kw["bill_metadata"], kw["errors"], kw["benchmarks"], kw["insights"]
        ),
        "evidence_checklist": _generate_evidence_checklist,
    }

    for section_name in selected_sections:
        gen = generators.get(section_name)
        if gen:
            sections[section_name] = await gen(**kwargs)

    # Determine appeal strategy summary
    strategy_parts = []
    if any(e.get("type") == "duplicate" for e in errors):
        strategy_parts.append("Remove duplicate charges")
    extreme_benchmarks = [b for b in benchmarks if b.get("risk_level") == "extreme"]
    if extreme_benchmarks:
        strategy_parts.append(f"Dispute {len(extreme_benchmarks)} overpriced item(s)")
    if isinstance(insights, dict) and insights.get("appeal_triggers"):
        strategy_parts.append("Leverage insurance rule protections")
    appeal_strategy = "; ".join(strategy_parts) if strategy_parts else "General billing review"

    # Store in MongoDB
    packet_id = await appeal_packets_repo.create({
        "bill_id": bill_id,
        "appeal_strategy": appeal_strategy,
        "sections": sections,
        "selected_sections": selected_sections,
        "status": "draft",
    })

    return packet_id
