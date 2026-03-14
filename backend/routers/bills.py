# Bills Router — /api/bills/*

from fastapi import APIRouter, UploadFile, File, Form, BackgroundTasks, HTTPException
from typing import List, Optional

from services.upload_service import handle_upload
from services.parsing_pipeline import run_parsing_pipeline
from db.repositories import bills_repo, line_items_repo

router = APIRouter()

ALLOWED_TYPES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/heic",
}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


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
    # Validate files
    if not files:
        raise HTTPException(status_code=400, detail={
            "error": "NO_FILES", "message": "At least one file is required."
        })

    for f in files:
        # Validate type
        if f.content_type and f.content_type not in ALLOWED_TYPES:
            raise HTTPException(status_code=415, detail={
                "error": "INVALID_FILE_TYPE",
                "message": f"Unsupported file type: {f.content_type}. Accepted: PDF, PNG, JPG, HEIC.",
            })
        # Validate size (read + check + seek back)
        contents = await f.read()
        if len(contents) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail={
                "error": "UPLOAD_TOO_LARGE",
                "message": f"File {f.filename} exceeds 10 MB limit.",
            })
        await f.seek(0)  # Reset for actual upload

    # Upload to S3 and create bill record
    bill_id = await handle_upload(
        files=files,
        insurance_provider=insurance_provider,
        visit_type=visit_type,
        suspected_issue=suspected_issue,
        notes=notes,
    )

    # In local mode, trigger pipeline via BackgroundTasks
    from config import settings
    if settings.pipeline_mode == "local":
        background_tasks.add_task(run_parsing_pipeline, bill_id)

    return {"bill_id": bill_id, "status": "processing"}


@router.get("/{bill_id}")
async def get_bill(bill_id: str):
    """Get bill metadata and parsing status."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })
    return bill


@router.get("/{bill_id}/line-items")
async def get_line_items(bill_id: str):
    """Get all extracted line items with flags and confidence scores."""
    # Verify bill exists
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    items = await line_items_repo.get_by_bill(bill_id)
    return {"line_items": items, "total_count": len(items)}


@router.post("/{bill_id}/confirm-fields")
async def confirm_fields(bill_id: str, corrections: dict):
    """User confirms or corrects low-confidence fields.

    Body: { "corrections": { "<line_item_id>": { "field": "new_value", ... } } }
    """
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    field_corrections = corrections.get("corrections", {})
    updated_count = 0

    for item_id, fields in field_corrections.items():
        success = await line_items_repo.update(item_id, fields)
        if success:
            updated_count += 1

            # If code was corrected, re-run benchmark for that item
            if "code" in fields or "code_type" in fields:
                from services.benchmark_service import run_benchmarks
                item = await line_items_repo.get_by_id(item_id)
                if item:
                    new_benchmarks = await run_benchmarks([item])
                    if new_benchmarks:
                        from db.repositories import benchmark_results_repo
                        await benchmark_results_repo.bulk_create(new_benchmarks)

    return {"updated_count": updated_count, "message": f"Updated {updated_count} field(s)."}
