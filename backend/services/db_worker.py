# DB Background Worker
# Polls MongoDB for bills that have been processed by AWS Lambda ("extracted" status)
# and resumes the parsing pipeline (Steps 5-14).

import asyncio
import logging
from config import settings
from db.repositories import bills_repo
from services.parsing_pipeline import run_parsing_pipeline

logger = logging.getLogger(__name__)

async def resume_worker_loop():
    """Continuously poll MongoDB for 'extracted' bills to finish Gemini AI steps."""
    if settings.pipeline_mode != "aws":
        return

    print("Starting DB resume worker loop for AWS pipeline mode...")
    
    while True:
        try:
            # Find bills that Lambda finished Textract/Comprehend on
            extracted_bills = await bills_repo.collection.find({"parsing_status": "extracted"}).to_list(10)
            
            for bill in extracted_bills:
                bill_id = str(bill["_id"])
                print(f"DB Worker found extracted bill {bill_id}. Resuming Gemini AI pipeline...")
                
                # Mark as processing so we don't pick it up twice concurrently
                await bills_repo.update_status(bill_id, "processing")
                
                # Run the second half of the pipeline (Gemini, Benchmarks, Errors)
                # It will automatically set status to 'completed' when done
                asyncio.create_task(run_parsing_pipeline(bill_id))
            
            await asyncio.sleep(5)
        except Exception as e:
            print(f"Error in DB resume worker loop: {e}")
            await asyncio.sleep(5)
