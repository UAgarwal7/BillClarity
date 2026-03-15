# SQS Background Worker
# Polls the AWS SQS queue for parsing jobs (Steps 5-14) in "aws" mode

import asyncio
import logging
from config import settings
from services.sqs_service import receive_parsing_job, delete_message
from services.parsing_pipeline import run_parsing_pipeline

logger = logging.getLogger(__name__)

async def sqs_worker_loop():
    """Continuously poll SQS for new parsing jobs."""
    if settings.pipeline_mode != "aws":
        return

    logger.info("Starting SQS worker loop for AWS pipeline mode...")
    
    while True:
        try:
            job = await receive_parsing_job()
            if job:
                bill_id = job.get("bill_id")
                receipt_handle = job.get("_receipt_handle")
                
                if bill_id:
                    logger.info(f"SQS Worker picked up bill {bill_id}. Running Gemini AI steps...")
                    # Run the second half of the pipeline (Gemini, Benchmarks, Errors)
                    await run_parsing_pipeline(bill_id)
                    logger.info(f"SQS Worker completed bill {bill_id}.")
                
                # Delete message from queue to prevent reprocessing
                if receipt_handle:
                    await delete_message(receipt_handle)
            else:
                # No messages, sleep briefly
                await asyncio.sleep(2)
        except Exception as e:
            logger.error(f"Error in SQS worker loop: {e}")
            await asyncio.sleep(5)  # Backoff on error
