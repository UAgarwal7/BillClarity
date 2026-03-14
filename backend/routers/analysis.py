# Analysis Router — /api/bills/:bill_id/explanation, errors, benchmarks, insurance-insights

from fastapi import APIRouter, HTTPException

from db.repositories import bills_repo, line_items_repo, benchmark_results_repo

router = APIRouter()


@router.get("/{bill_id}/explanation")
async def get_explanation(bill_id: str):
    """Get Gemini-generated plain-language bill explanation."""
    # TODO: Fetch bill, return plain_language_summary + per-item explanations
    pass


@router.get("/{bill_id}/errors")
async def get_errors(bill_id: str):
    """Get all detected billing errors and flags."""
    # TODO: Aggregate flags from line_items collection
    # TODO: Return error_summary counts + errors array + cross_document_issues
    pass


@router.get("/{bill_id}/benchmarks")
async def get_benchmarks(bill_id: str):
    """Get benchmark comparison results for each line item."""
    # TODO: Fetch from benchmark_results collection
    # TODO: Calculate summary (items_above_typical, estimated_savings)
    pass


@router.get("/{bill_id}/insurance-insights")
async def get_insurance_insights(bill_id: str):
    """Get insurance rule matching results and appeal strategies."""
    # TODO: Fetch stored insights from bill record or generate on demand
    pass
