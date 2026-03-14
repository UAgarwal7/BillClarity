# Textract Service — AWS Textract calls + response parsing

import boto3
import asyncio
import time
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
    """Run Textract AnalyzeDocument on an S3 document.

    Uses synchronous API for single-page docs.
    Returns parsed { raw_text, tables_json, kv_pairs_json }.
    """
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: textract_client.analyze_document(
            Document={"S3Object": {"Bucket": settings.s3_bucket_name, "Name": s3_key}},
            FeatureTypes=["TABLES", "FORMS"],
        ),
    )
    return parse_textract_response(response)


async def run_textract_async(s3_key: str) -> str:
    """Start async Textract job for multi-page documents. Returns job_id."""
    loop = asyncio.get_event_loop()
    response = await loop.run_in_executor(
        None,
        lambda: textract_client.start_document_analysis(
            DocumentLocation={"S3Object": {"Bucket": settings.s3_bucket_name, "Name": s3_key}},
            FeatureTypes=["TABLES", "FORMS"],
        ),
    )
    return response["JobId"]


async def get_textract_results(job_id: str, max_wait: int = 120) -> dict:
    """Poll for async Textract results and return parsed output."""
    loop = asyncio.get_event_loop()
    start = time.time()

    while time.time() - start < max_wait:
        response = await loop.run_in_executor(
            None,
            lambda: textract_client.get_document_analysis(JobId=job_id),
        )
        status = response["JobStatus"]
        if status == "SUCCEEDED":
            # Collect all pages
            all_blocks = response.get("Blocks", [])
            next_token = response.get("NextToken")
            while next_token:
                page_response = await loop.run_in_executor(
                    None,
                    lambda: textract_client.get_document_analysis(
                        JobId=job_id, NextToken=next_token
                    ),
                )
                all_blocks.extend(page_response.get("Blocks", []))
                next_token = page_response.get("NextToken")

            return parse_textract_response({"Blocks": all_blocks})
        elif status == "FAILED":
            raise RuntimeError(f"Textract job {job_id} failed: {response.get('StatusMessage', '')}")

        await asyncio.sleep(3)

    raise TimeoutError(f"Textract job {job_id} did not complete within {max_wait}s")
