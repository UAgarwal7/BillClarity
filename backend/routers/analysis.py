# Analysis Router — /api/bills/:bill_id/explanation, errors, benchmarks, insurance-insights

from fastapi import APIRouter, HTTPException

from db.repositories import bills_repo, line_items_repo, benchmark_results_repo
from services.gemini_service import generate_explanation, detect_errors_ai, match_insurance_rules
from services.insurance_service import get_insurance_insights

router = APIRouter()


@router.get("/{bill_id}/explanation")
async def get_explanation(bill_id: str):
    """Get Gemini-generated plain-language bill explanation."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    # Return stored explanation if available
    if bill.get("plain_language_summary"):
        return {"explanation": bill["plain_language_summary"]}

    # Generate on demand if not yet available
    items = await line_items_repo.get_by_bill(bill_id)
    if not items:
        return {"explanation": "No line items have been extracted yet. Please wait for parsing to complete."}

    explanation = await generate_explanation(bill, items)

    # Store for future requests
    await bills_repo.update(bill_id, {"plain_language_summary": explanation})

    return {"explanation": explanation}


@router.get("/{bill_id}/errors")
async def get_errors(bill_id: str):
    """Get all detected billing errors and flags."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    items = await line_items_repo.get_by_bill(bill_id)

    # Aggregate flags from all line items
    all_errors = []
    for item in items:
        for flag in item.get("flags", []):
            all_errors.append({
                **flag,
                "line_item_id": item.get("_id"),
                "description": item.get("description", "Unknown"),
                "code": item.get("code"),
                "billed_amount": item.get("billed_amount"),
            })

    # Count by severity
    severity_counts = {"critical": 0, "warning": 0, "info": 0}
    for err in all_errors:
        sev = err.get("severity", "info")
        severity_counts[sev] = severity_counts.get(sev, 0) + 1

    # Cross-document issues (placeholder for EOB matching)
    cross_doc_issues = []

    return {
        "error_summary": {
            "total": len(all_errors),
            **severity_counts,
        },
        "errors": all_errors,
        "cross_document_issues": cross_doc_issues,
    }


@router.get("/{bill_id}/benchmarks")
async def get_benchmarks(bill_id: str):
    """Get benchmark comparison results for each line item."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    benchmarks = await benchmark_results_repo.get_by_bill(bill_id)

    # Calculate summary
    items_above = [b for b in benchmarks if b.get("deviation_percentage", 0) > 0]
    total_items = len(benchmarks)

    # Estimated savings: difference between billed and typical_high for extreme items
    estimated_savings_low = sum(
        max(0, b.get("billed_amount", 0) - b.get("typical_high", 0))
        for b in benchmarks
        if b.get("risk_level") in ("elevated", "extreme")
    )
    estimated_savings_high = sum(
        max(0, b.get("billed_amount", 0) - b.get("typical_median", 0))
        for b in benchmarks
        if b.get("risk_level") in ("elevated", "extreme")
    )

    return {
        "summary": {
            "total_compared": total_items,
            "items_above_typical": len(items_above),
            "estimated_savings_low": round(estimated_savings_low, 2),
            "estimated_savings_high": round(estimated_savings_high, 2),
        },
        "benchmarks": benchmarks,
    }


@router.get("/{bill_id}/insurance-insights")
async def get_insurance_insights_endpoint(bill_id: str):
    """Get insurance rule matching results and appeal strategies."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    # Return stored insights if available
    if bill.get("insurance_insights"):
        return {"insights": bill["insurance_insights"]}

    # Generate on demand
    items = await line_items_repo.get_by_bill(bill_id)
    if not items:
        return {"insights": {"insights": [], "appeal_triggers": []}}

    # Collect errors from items
    errors = []
    for item in items:
        errors.extend(item.get("flags", []))

    insights = await get_insurance_insights(bill, items, errors)

    # Store for future requests
    await bills_repo.update(bill_id, {"insurance_insights": insights})

    return {"insights": insights}
