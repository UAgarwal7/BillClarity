# Textract Service — AWS Textract calls + response parsing

import boto3
from config import settings
from utils.textract_parser import parse_textract_response


# Initialize Textract client
textract_client = boto3.client(
    "textract",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)


async def run_textract(s3_key: str) -> dict:
    """Run Textract on an S3 document and return parsed results."""
    # TODO: Call AnalyzeDocument (sync) or StartDocumentAnalysis (async)
    # TODO: Features: TABLES, FORMS
    # TODO: Parse response into { raw_text, tables, kv_pairs }
    pass


async def run_textract_async(s3_key: str) -> str:
    """Start async Textract job for multi-page documents. Returns job_id."""
    # TODO: StartDocumentAnalysis
    # TODO: Return job_id for polling
    pass


async def get_textract_results(job_id: str) -> dict:
    """Poll for and return async Textract results."""
    # TODO: GetDocumentAnalysis with pagination
    # TODO: Parse full response
    pass
