# Tests for AWS SQS service

import json
from unittest.mock import patch, MagicMock
import pytest


@patch("services.sqs_service.sqs_client")
@pytest.mark.asyncio
async def test_send_parsing_job(mock_client):
    """Test that send_parsing_job sends correct message format."""
    mock_client.send_message.return_value = {"MessageId": "test-msg-123"}

    from services.sqs_service import send_parsing_job

    msg_id = await send_parsing_job("bill-001", ["session/uploads/file.pdf"])

    assert msg_id == "test-msg-123"
    mock_client.send_message.assert_called_once()

    call_args = mock_client.send_message.call_args
    body = json.loads(call_args.kwargs.get("MessageBody", call_args[1].get("MessageBody", "")))

    assert body["bill_id"] == "bill-001"
    assert body["s3_keys"] == ["session/uploads/file.pdf"]
    assert "timestamp" in body


@patch("services.sqs_service.sqs_client")
@pytest.mark.asyncio
async def test_receive_parsing_job_with_message(mock_client):
    """Test receiving a message from the queue."""
    mock_client.receive_message.return_value = {
        "Messages": [
            {
                "MessageId": "msg-456",
                "ReceiptHandle": "receipt-789",
                "Body": json.dumps({"bill_id": "bill-002", "s3_keys": ["key.pdf"]}),
            }
        ]
    }

    from services.sqs_service import receive_parsing_job

    result = await receive_parsing_job()

    assert result is not None
    assert result["bill_id"] == "bill-002"
    assert result["_receipt_handle"] == "receipt-789"
    assert result["_message_id"] == "msg-456"


@patch("services.sqs_service.sqs_client")
@pytest.mark.asyncio
async def test_receive_parsing_job_empty_queue(mock_client):
    """Test receiving from empty queue returns None."""
    mock_client.receive_message.return_value = {"Messages": []}

    from services.sqs_service import receive_parsing_job

    result = await receive_parsing_job()
    assert result is None


@patch("services.sqs_service.sqs_client")
@pytest.mark.asyncio
async def test_delete_message(mock_client):
    """Test deleting a processed message."""
    from services.sqs_service import delete_message

    await delete_message("receipt-handle-123")

    mock_client.delete_message.assert_called_once()


@patch("services.sqs_service.sqs_client")
@pytest.mark.asyncio
async def test_get_queue_stats(mock_client):
    """Test getting queue statistics."""
    mock_client.get_queue_attributes.return_value = {
        "Attributes": {
            "ApproximateNumberOfMessages": "5",
            "ApproximateNumberOfMessagesNotVisible": "2",
            "ApproximateNumberOfMessagesDelayed": "0",
        }
    }

    from services.sqs_service import get_queue_stats

    stats = await get_queue_stats()
    assert stats["pending"] == 5
    assert stats["in_flight"] == 2
    assert stats["delayed"] == 0
