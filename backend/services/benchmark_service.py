# Benchmark Service — Static JSON lookup + Gemini fallback + deviation calculation

import json
import os

from services.gemini_service import call_gemini, parse_gemini_json

# Load benchmark data at module level
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(DATA_DIR, "benchmark_cpt.json")) as f:
    CPT_BENCHMARKS = json.load(f)

with open(os.path.join(DATA_DIR, "benchmark_hcpcs.json")) as f:
    HCPCS_BENCHMARKS = json.load(f)


def lookup_benchmark(code: str, code_type: str) -> dict | None:
    """Look up benchmark data for a billing code from static JSON."""
    if code_type == "CPT":
        return CPT_BENCHMARKS.get(code)
    elif code_type == "HCPCS":
        return HCPCS_BENCHMARKS.get(code)
    return None


async def gemini_benchmark(codes_with_descriptions: list[dict]) -> dict:
    """Use Gemini to estimate benchmark pricing for codes not in the static database.

    Input: [{"code": "99213", "code_type": "CPT", "description": "Office Visit..."}]
    Returns: { "99213": { "description": ..., "medicare_rate": ..., "typical_low": ..., etc. } }
    """
    if not codes_with_descriptions:
        return {}

    codes_text = "\n".join(
        f"- {c['code']} ({c['code_type']}): {c.get('description', 'Unknown')}, billed ${c.get('billed_amount', 0):,.2f}"
        for c in codes_with_descriptions
    )

    prompt = f"""You are a medical billing pricing expert. For each billing code below, provide realistic benchmark pricing data based on your knowledge of US healthcare pricing.

CODES TO BENCHMARK:
{codes_text}

For each code, provide:
- description: What this code covers
- medicare_rate: Approximate Medicare reimbursement rate (USD)
- typical_low: Low end of what commercial insurance typically pays (USD)
- typical_median: Median of what commercial insurance typically pays (USD)
- typical_high: High end of what commercial insurance typically pays (USD)

Use realistic US healthcare pricing. Medicare rates should be based on the CMS fee schedule. Typical ranges should reflect commercial insurance and self-pay prices across US hospitals and clinics.

Output as JSON object where keys are the billing codes:
{{
  "99213": {{
    "description": "Office Visit - Established Patient, Low Complexity",
    "medicare_rate": 92.00,
    "typical_low": 100,
    "typical_median": 160,
    "typical_high": 250
  }}
}}

RULES:
- Be as accurate as possible based on real CMS data and healthcare pricing
- If you are unsure about a specific code, provide your best reasonable estimate
- Medicare rates should be realistic — do not guess wildly
- typical_low should be around 1-2x Medicare, typical_median around 2-4x, typical_high around 3-6x
- Return ONLY the JSON object, no extra text"""

    try:
        result = await call_gemini(prompt)
        parsed = parse_gemini_json(result)
        return parsed if isinstance(parsed, dict) else {}
    except Exception as e:
        print(f"[Benchmark] Gemini fallback failed: {e}")
        return {}


def calculate_deviation(billed_amount: float, typical_median: float) -> float:
    """Calculate deviation percentage from typical median."""
    if typical_median == 0:
        return 0.0
    return (billed_amount - typical_median) / typical_median * 100


def calculate_deviation_score(deviation_pct: float) -> int:
    """Map deviation percentage to 0-10 severity score."""
    if deviation_pct <= 0:
        return 0
    elif deviation_pct <= 50:
        return 2
    elif deviation_pct <= 100:
        return 4
    elif deviation_pct <= 200:
        return 6
    elif deviation_pct <= 500:
        return 8
    else:
        return 10


def get_risk_level(score: int) -> str:
    """Map deviation score to risk level."""
    if score <= 3:
        return "normal"
    elif score <= 6:
        return "elevated"
    else:
        return "extreme"


def _build_benchmark_result(item: dict, benchmark: dict, source: str) -> dict:
    """Build a benchmark result dict from an item and benchmark data."""
    billed = item.get("billed_amount", 0)
    deviation_pct = calculate_deviation(billed, benchmark["typical_median"])
    score = calculate_deviation_score(deviation_pct)
    risk = get_risk_level(score)

    return {
        "line_item_id": item.get("_id"),
        "bill_id": item.get("bill_id"),
        "code": item.get("code"),
        "description": benchmark.get("description", item.get("description", "")),
        "benchmark_source": source,
        "medicare_rate": benchmark["medicare_rate"],
        "typical_low": benchmark["typical_low"],
        "typical_median": benchmark["typical_median"],
        "typical_high": benchmark["typical_high"],
        "billed_amount": billed,
        "deviation_percentage": round(deviation_pct, 1),
        "deviation_score": score,
        "risk_level": risk,
    }


async def run_benchmarks(line_items: list) -> list:
    """Run benchmark comparison for all line items.

    Uses static JSON first, then falls back to Gemini for unknown codes.
    """
    results = []
    needs_gemini = []

    for item in line_items:
        code = item.get("code")
        code_type = item.get("code_type")
        if not code:
            continue

        # Try static lookup first
        benchmark = lookup_benchmark(code, code_type or "CPT")
        if benchmark:
            results.append(_build_benchmark_result(item, benchmark, "static_lookup"))
        else:
            needs_gemini.append(item)

    # Batch Gemini fallback for all unknown codes
    if needs_gemini:
        gemini_data = await gemini_benchmark([
            {
                "code": item.get("code"),
                "code_type": item.get("code_type", "CPT"),
                "description": item.get("description", ""),
                "billed_amount": item.get("billed_amount", 0),
            }
            for item in needs_gemini
        ])

        for item in needs_gemini:
            code = item.get("code", "")
            benchmark = gemini_data.get(code)
            if benchmark and benchmark.get("typical_median"):
                results.append(_build_benchmark_result(item, benchmark, "gemini_estimate"))
            else:
                # Last resort: create a minimal benchmark so the item still appears
                billed = item.get("billed_amount", 0)
                if billed > 0:
                    results.append({
                        "line_item_id": item.get("_id"),
                        "bill_id": item.get("bill_id"),
                        "code": code,
                        "description": item.get("description", ""),
                        "benchmark_source": "unavailable",
                        "medicare_rate": 0,
                        "typical_low": 0,
                        "typical_median": 0,
                        "typical_high": 0,
                        "billed_amount": billed,
                        "deviation_percentage": 0,
                        "deviation_score": 0,
                        "risk_level": "normal",
                    })

    return results
