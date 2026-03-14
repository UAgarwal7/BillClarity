# AWS SQS Service — Job queue send/receive helpers

import boto3
import json
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from config import settings

sqs_client = boto3.client(
    "sqs",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)


async def send_parsing_job(bill_id: str, s3_keys: List[str]) -> str:
    """
    Send a parsing job message to the SQS queue.

    Message format:
    {
        "bill_id": "660a...",
        "s3_keys": ["session/uploads/file1.pdf", ...],
        "timestamp": "2026-03-14T12:00:00Z"
    }

    Returns the SQS message ID.
    """
    message_body = {
        "bill_id": bill_id,
        "s3_keys": s3_keys,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    response = sqs_client.send_message(
        QueueUrl=settings.sqs_queue_url,
        MessageBody=json.dumps(message_body),
        MessageAttributes={
            "JobType": {
                "DataType": "String",
                "StringValue": "bill_parsing",
            },
        },
    )

    return response["MessageId"]


async def receive_parsing_job() -> Optional[Dict[str, Any]]:
    """
    Receive a single parsing job from the SQS queue.

    Returns the parsed message body + receipt handle, or None if queue is empty.
    """
    response = sqs_client.receive_message(
        QueueUrl=settings.sqs_queue_url,
        MaxNumberOfMessages=1,
        WaitTimeSeconds=5,
        MessageAttributeNames=["All"],
        VisibilityTimeout=300,  # 5 min — matches Lambda timeout
    )

    messages = response.get("Messages", [])
    if not messages:
        return None

    message = messages[0]
    body = json.loads(message["Body"])
    body["_receipt_handle"] = message["ReceiptHandle"]
    body["_message_id"] = message["MessageId"]

    return body


async def delete_message(receipt_handle: str) -> None:
    """Delete a processed message from the queue (acknowledge completion)."""
    sqs_client.delete_message(
        QueueUrl=settings.sqs_queue_url,
        ReceiptHandle=receipt_handle,
    )


async def get_queue_stats() -> Dict[str, int]:
    """Get approximate message counts for monitoring."""
    response = sqs_client.get_queue_attributes(
        QueueUrl=settings.sqs_queue_url,
        AttributeNames=[
            "ApproximateNumberOfMessages",
            "ApproximateNumberOfMessagesNotVisible",
            "ApproximateNumberOfMessagesDelayed",
        ],
    )

    attrs = response.get("Attributes", {})
    return {
        "pending": int(attrs.get("ApproximateNumberOfMessages", 0)),
        "in_flight": int(attrs.get("ApproximateNumberOfMessagesNotVisible", 0)),
        "delayed": int(attrs.get("ApproximateNumberOfMessagesDelayed", 0)),
    }
