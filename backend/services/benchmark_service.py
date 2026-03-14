# Benchmark Service — Static JSON lookup + deviation calculation + scoring

import json
import os

# Load benchmark data at module level
DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")

with open(os.path.join(DATA_DIR, "benchmark_cpt.json")) as f:
    CPT_BENCHMARKS = json.load(f)

with open(os.path.join(DATA_DIR, "benchmark_hcpcs.json")) as f:
    HCPCS_BENCHMARKS = json.load(f)


def lookup_benchmark(code: str, code_type: str) -> dict | None:
    """Look up benchmark data for a billing code."""
    if code_type == "CPT":
        return CPT_BENCHMARKS.get(code)
    elif code_type == "HCPCS":
        return HCPCS_BENCHMARKS.get(code)
    return None


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


async def run_benchmarks(line_items: list) -> list:
    """Run benchmark comparison for all line items with recognized codes."""
    results = []
    for item in line_items:
        code = item.get("code")
        code_type = item.get("code_type")
        if not code or not code_type:
            continue

        benchmark = lookup_benchmark(code, code_type)
        if not benchmark:
            continue

        billed = item.get("billed_amount", 0)
        deviation_pct = calculate_deviation(billed, benchmark["typical_median"])
        score = calculate_deviation_score(deviation_pct)
        risk = get_risk_level(score)

        results.append({
            "line_item_id": item.get("_id"),
            "bill_id": item.get("bill_id"),
            "code": code,
            "benchmark_source": "static_lookup",
            "medicare_rate": benchmark["medicare_rate"],
            "typical_low": benchmark["typical_low"],
            "typical_median": benchmark["typical_median"],
            "typical_high": benchmark["typical_high"],
            "billed_amount": billed,
            "deviation_percentage": round(deviation_pct, 1),
            "deviation_score": score,
            "risk_level": risk,
        })

    return results
