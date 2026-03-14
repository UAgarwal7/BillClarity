# Demo Router — /api/demo/seed

import json
import os
from fastapi import APIRouter, HTTPException
from db.repositories import bills_repo, line_items_repo, benchmark_results_repo
from services.benchmark_service import run_benchmarks
from services.error_detection_service import run_rule_based_checks

router = APIRouter()


@router.post("/seed", status_code=201)
async def seed_demo_data():
    """Load pre-built demo ER scenario into MongoDB. 
    Skips AWS S3, Textract, and Comprehend and instantly creates a parsed bill.
    """
    data_path = os.path.join(os.path.dirname(__file__), "..", "data", "demo_bill.json")
    try:
        with open(data_path, "r") as f:
            demo_data = json.load(f)
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail={
            "error": "DEMO_DATA_NOT_FOUND",
            "message": "Demo data file not found."
        })

    # Create bill record
    bill_data = demo_data.get("bill", {})
    bill_data.update({
        "session_id": "demo_session",
        "s3_keys": [],  # No real files in S3 for demo speed
        "parsing_status": "completed",
        "pipeline_mode": "local",
        "confidence_scores": {
            "overall": 0.95,
            "fields": {}
        },
        "plain_language_summary": (
            "This is a hospital statement from Metro General Hospital for an Emergency "
            "Department visit on February 15, 2026. The total billed amount was $14,365.00. "
            "Your insurance (BlueCross BlueShield) allowed $6,420.00 and paid $4,620.00. "
            "You are responsible for the remaining balance of $1,800.00."
        ),
        "insurance_insights": {
            "insights": [
                {
                    "rule": "No Surprises Act (Federal)",
                    "description": "Protects patients from surprise bills for emergency services at out-of-network facilities or from out-of-network providers at in-network facilities.",
                    "applicability": "Applies if Metro General Hospital or the ER physician is out-of-network.",
                    "strength": "strong",
                    "appeal_strategy": "Request documentation that the charges comply with NSA rules and challenge balance billing."
                }
            ],
            "appeal_triggers": [
                {
                    "trigger": "Duplicate Charges",
                    "success_likelihood": "high",
                    "reasoning": "Duplicate charges for the same imaging service (CT Scan) are clear errors that are typically reversed upon review."
                },
                {
                    "trigger": "Extreme Deviation from Typical Pricing",
                    "success_likelihood": "moderate",
                    "reasoning": "The facility fee is heavily inflated compared to regional typicals. While not technically illegal, it provides strong leverage for negotiation."
                }
            ]
        }
    })

    bill_id = await bills_repo.create(bill_data)

    # Insert line items
    line_items = demo_data.get("line_items", [])
    for item in line_items:
        item["bill_id"] = bill_id
        item["risk_level"] = "normal"
        item["flags"] = []

    # Calculate real risk/flags for demo items
    rule_flags = run_rule_based_checks(line_items, bill_data)
    for idx, flag in enumerate(rule_flags):
        item_idx = flag.get("line_item_index")
        if item_idx is not None and item_idx < len(line_items):
            line_items[item_idx]["flags"].append(flag)
            if flag.get("severity") == "critical":
                line_items[item_idx]["risk_level"] = "high_risk"
            elif flag.get("severity") == "warning" and line_items[item_idx]["risk_level"] != "high_risk":
                line_items[item_idx]["risk_level"] = "needs_review"

    # Insert items
    item_ids = await line_items_repo.bulk_create(line_items)

    # Re-attach IDs so benchmarks can reference them
    for item, iid in zip(line_items, item_ids):
        item["_id"] = iid

    # Run benchmarks
    benchmarks = await run_benchmarks(line_items)
    if benchmarks:
        await benchmark_results_repo.bulk_create(benchmarks)

    return {"bill_id": bill_id, "message": "Demo data successfully seeded in MongoDB."}
