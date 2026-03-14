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


async def generate_packet(
    bill_id: str,
    bill_metadata: dict,
    line_items: list,
    errors: list,
    benchmarks: list,
    insights: list,
    selected_sections: list[str],
) -> str:
    """Generate all selected appeal packet sections. Returns packet_id."""
    sections = {}

    # TODO: Generate each selected section via Gemini
    # Possible sections:
    #   bill_explanation, flagged_issues, benchmark_analysis,
    #   insurance_insights, appeal_letter, coding_review_request,
    #   negotiation_script, evidence_checklist

    if "appeal_letter" in selected_sections:
        sections["appeal_letter"] = await generate_appeal_letter(
            bill_metadata, errors, benchmarks, insights
        )

    if "negotiation_script" in selected_sections:
        sections["negotiation_script"] = await generate_negotiation_script(
            bill_metadata, errors, benchmarks, insights
        )

    # TODO: Generate remaining sections

    # Store in MongoDB
    packet_id = await appeal_packets_repo.create({
        "bill_id": bill_id,
        "sections": sections,
        "selected_sections": selected_sections,
        "status": "draft",
    })

    return packet_id
