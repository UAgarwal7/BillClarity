# Bills Router — /api/bills/*

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from typing import List, Optional

from services.upload_service import handle_upload
from services.parsing_pipeline import run_parsing_pipeline
from db.repositories import bills_repo, line_items_repo

router = APIRouter()


@router.post("/upload", status_code=201)
async def upload_bill(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = File(...),
    insurance_provider: Optional[str] = Form(None),
    visit_type: Optional[str] = Form(None),
    suspected_issue: Optional[str] = Form(None),
    notes: Optional[str] = Form(None),
):
    """Upload bill/EOB files → S3, create bill record, trigger parsing pipeline."""
    # TODO: Validate file types and sizes
    # TODO: Upload to S3 via upload_service
    # TODO: Create bill record in MongoDB
    # TODO: background_tasks.add_task(run_parsing_pipeline, bill_id)
    # TODO: Return { bill_id, status: "processing" }
    pass


@router.get("/{bill_id}")
async def get_bill(bill_id: str):
    """Get bill metadata and parsing status."""
    # TODO: Fetch from bills collection
    # TODO: 404 if not found
    pass


@router.get("/{bill_id}/line-items")
async def get_line_items(bill_id: str):
    """Get all extracted line items with flags and confidence scores."""
    # TODO: Fetch from line_items collection by bill_id
    pass


@router.post("/{bill_id}/confirm-fields")
async def confirm_fields(bill_id: str):
    """User confirms or corrects low-confidence fields."""
    # TODO: Parse field_corrections from body
    # TODO: Update MongoDB docs
    # TODO: Optionally re-trigger benchmark for corrected codes
    pass
