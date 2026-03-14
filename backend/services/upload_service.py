# Upload Service — S3 upload + bill record creation
#
# Supports two pipeline modes:
# - AWS mode: Upload to S3 → S3 event triggers Lambda → Lambda orchestrates pipeline
# - Local mode: Upload to S3 → FastAPI BackgroundTasks runs pipeline directly

import uuid
from datetime import datetime, timezone
from fastapi import UploadFile
from typing import List, Optional

from config import settings
from utils.s3 import upload_file_to_s3
from db.repositories import bills_repo


async def handle_upload(
    files: List[UploadFile],
    insurance_provider: Optional[str] = None,
    visit_type: Optional[str] = None,
    suspected_issue: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """
    Upload files to S3 and create a bill record.

    In AWS mode: S3 upload triggers Lambda via S3 event notification.
    In local mode: Returns bill_id; caller triggers pipeline via BackgroundTasks.

    Returns bill_id.
    """
    session_id = str(uuid.uuid4())
    s3_keys = []

    # Upload each file to S3
    for file in files:
        timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
        s3_key = f"{session_id}/uploads/{timestamp}_{file.filename}"
        file_bytes = await file.read()
        await upload_file_to_s3(file_bytes, s3_key, file.content_type or "application/octet-stream")
        s3_keys.append(s3_key)

    # Create bill record in MongoDB
    bill_data = {
        "session_id": session_id,
        "s3_keys": s3_keys,
        "insurance_provider": insurance_provider,
        "visit_type": visit_type,
        "suspected_issue": suspected_issue,
        "notes": notes,
        "parsing_status": "processing" if settings.pipeline_mode == "local" else "uploaded",
        "pipeline_mode": settings.pipeline_mode,
    }

    bill_id = await bills_repo.create(bill_data)

    # In AWS mode, the S3 event notification will trigger Lambda automatically.
    # In local mode, the router will trigger the pipeline via BackgroundTasks.

    return bill_id
