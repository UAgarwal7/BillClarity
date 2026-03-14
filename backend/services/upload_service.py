# Upload Service — S3 upload + bill record creation

from fastapi import UploadFile
from typing import List, Optional

from utils.s3 import upload_file_to_s3
from db.repositories import bills_repo


async def handle_upload(
    files: List[UploadFile],
    insurance_provider: Optional[str] = None,
    visit_type: Optional[str] = None,
    suspected_issue: Optional[str] = None,
    notes: Optional[str] = None,
) -> str:
    """Upload files to S3 and create a bill record. Returns bill_id."""
    # TODO: Generate session_id
    # TODO: Upload each file to S3 with key format: {session_id}/uploads/{timestamp}_{filename}
    # TODO: Create bill record in MongoDB with status "processing"
    # TODO: Return bill_id
    pass
