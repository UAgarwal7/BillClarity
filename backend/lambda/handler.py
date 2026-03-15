# BillClarity Lambda Handler — S3-triggered pipeline orchestrator
#
# Triggered by S3 ObjectCreated events on the uploads/ prefix.
# Flow: S3 event → enqueue SQS job → Textract → Comprehend Medical → Gemini → MongoDB

import os
import json
import boto3
from datetime import datetime, timezone
from pymongo import MongoClient

# AWS clients
s3_client = boto3.client("s3")
textract_client = boto3.client("textract")
comprehend_client = boto3.client("comprehendmedical")
sqs_client = boto3.client("sqs")

# Environment
MONGODB_URI = os.environ.get("MONGODB_URI", "")
SQS_QUEUE_URL = os.environ.get("SQS_QUEUE_URL", "")
S3_BUCKET = os.environ.get("S3_BUCKET_NAME", "billclarity-docs")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# MongoDB (sync for Lambda — motor is async-only)
mongo_client = None
db = None


def get_db():
    """Lazy-init MongoDB connection (reused across warm Lambda invocations)."""
    global mongo_client, db
    if db is None:
        mongo_client = MongoClient(MONGODB_URI)
        db = mongo_client["billclarity"]
    return db


def handler(event, context):
    """
    Lambda entry point. Handles two event types:
    1. S3 event notification (ObjectCreated) — enqueue SQS job
    2. SQS event (from queue) — run the parsing pipeline
    """
    # Determine event source
    if "Records" in event:
        record = event["Records"][0]
        event_source = record.get("eventSource", record.get("EventSource", ""))

        if event_source == "aws:s3":
            return handle_s3_event(record)
        elif event_source == "aws:sqs":
            return handle_sqs_event(record)

    return {"statusCode": 400, "body": "Unknown event source"}


def handle_s3_event(record):
    """
    Handle S3 ObjectCreated event.
    Extract the S3 key and enqueue a parsing job to SQS.
    """
    bucket = record["s3"]["bucket"]["name"]
    key = record["s3"]["object"]["key"]

    print(f"S3 event: {bucket}/{key}")

    # Extract bill_id from the S3 key (format: {bill_id}/uploads/{timestamp}_{filename})
    parts = key.split("/")
    bill_id = parts[0] if len(parts) >= 2 else "unknown"

    # Enqueue parsing job
    message = {
        "bill_id": bill_id,
        "s3_keys": [key],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "bucket": bucket,
    }

    response = sqs_client.send_message(
        QueueUrl=SQS_QUEUE_URL,
        MessageBody=json.dumps(message),
        MessageAttributes={
            "JobType": {"DataType": "String", "StringValue": "bill_parsing"},
        },
    )

    print(f"Enqueued SQS job: {response['MessageId']}")

    # Update bill status
    db = get_db()
    from bson import ObjectId
    db.bills.update_one(
        {"session_id": bill_id},
        {"$set": {"parsing_status": "queued", "updated_at": datetime.now(timezone.utc)}},
    )

    return {"statusCode": 200, "body": f"Enqueued job for bill {bill_id}"}


def handle_sqs_event(record):
    """
    Handle SQS message event.
    Run the full parsing pipeline: Textract → Comprehend Medical → store results.
    """
    body = json.loads(record["body"])
    bill_id = body["bill_id"]
    s3_keys = body["s3_keys"]
    bucket = body.get("bucket", S3_BUCKET)

    print(f"Processing parsing job for bill {bill_id}")

    db = get_db()
    from bson import ObjectId

    try:
        # Update status to processing
        db.bills.update_one(
            {"session_id": bill_id},
            {"$set": {"parsing_status": "processing", "updated_at": datetime.now(timezone.utc)}},
        )

        all_textract_results = []
        all_comprehend_results = []

        for s3_key in s3_keys:
            # Step 1: Run Textract
            print(f"Running Textract on {s3_key}")
            textract_response = textract_client.analyze_document(
                Document={"S3Object": {"Bucket": bucket, "Name": s3_key}},
                FeatureTypes=["TABLES", "FORMS"],
            )

            # Parse Textract output
            raw_text = ""
            tables = []
            kv_pairs = {}

            for block in textract_response.get("Blocks", []):
                if block["BlockType"] == "LINE":
                    raw_text += block.get("Text", "") + "\n"

            all_textract_results.append({
                "s3_key": s3_key,
                "raw_text": raw_text.strip(),
                "tables": tables,
                "kv_pairs": kv_pairs,
                "block_count": len(textract_response.get("Blocks", [])),
            })

            # Step 2: Run Comprehend Medical
            print(f"Running Comprehend Medical on {s3_key}")
            comprehend_text = raw_text[:20000]  # API limit

            if comprehend_text.strip():
                comprehend_response = comprehend_client.detect_entities_v2(Text=comprehend_text)
                entities = comprehend_response.get("Entities", [])

                categorized = {
                    "medications": [],
                    "procedures": [],
                    "diagnoses": [],
                    "anatomy": [],
                    "normalized_codes": [],
                }

                for entity in entities:
                    category = entity.get("Category", "")
                    entry = {
                        "text": entity.get("Text", ""),
                        "type": entity.get("Type", ""),
                        "score": entity.get("Score", 0.0),
                    }

                    # Extract normalized codes
                    for concept in entity.get("ICD10CMConcepts", [])[:1]:
                        categorized["normalized_codes"].append({
                            "source_text": entry["text"],
                            "code": concept.get("Code"),
                            "code_type": "ICD-10-CM",
                        })

                    for concept in entity.get("RxNormConcepts", [])[:1]:
                        categorized["normalized_codes"].append({
                            "source_text": entry["text"],
                            "code": concept.get("Code"),
                            "code_type": "RxNorm",
                        })

                    if category == "MEDICATION":
                        categorized["medications"].append(entry)
                    elif category == "TEST_TREATMENT_PROCEDURE":
                        categorized["procedures"].append(entry)
                    elif category == "MEDICAL_CONDITION":
                        categorized["diagnoses"].append(entry)
                    elif category == "ANATOMY":
                        categorized["anatomy"].append(entry)

                all_comprehend_results.append(categorized)

        # Store intermediate results in MongoDB for the Gemini pipeline to consume
        db.bills.update_one(
            {"session_id": bill_id},
            {
                "$set": {
                    "textract_results": all_textract_results,
                    "comprehend_results": all_comprehend_results,
                    "parsing_status": "extracted",
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )

        print(f"Completed AWS processing for bill {bill_id}")
        return {"statusCode": 200, "body": f"Processed bill {bill_id}"}

    except Exception as e:
        print(f"Error processing bill {bill_id}: {str(e)}")
        db.bills.update_one(
            {"session_id": bill_id},
            {
                "$set": {
                    "parsing_status": "failed",
                    "parsing_error": str(e),
                    "updated_at": datetime.now(timezone.utc),
                }
            },
        )
        raise
