# Pytest Fixtures — test client, mock DB, mock S3

import pytest
from unittest.mock import AsyncMock, MagicMock


@pytest.fixture
def mock_db():
    """Mock MongoDB database for testing."""
    # TODO: Create mock collections with AsyncMock
    pass


@pytest.fixture
def mock_s3():
    """Mock S3 client for testing."""
    # TODO: Mock boto3 S3 operations
    pass


@pytest.fixture
def mock_gemini():
    """Mock Gemini API for testing."""
    # TODO: Mock google.generativeai responses
    pass


@pytest.fixture
def sample_bill():
    """Sample bill data for testing."""
    return {
        "provider": "Metro General Hospital",
        "facility": "Emergency Department",
        "visit_type": "emergency",
        "total_billed": 14365.00,
        "patient_balance": 1800.00,
        "parsing_status": "completed",
    }


@pytest.fixture
def sample_line_items():
    """Sample line items for testing."""
    return [
        {"code": "99285", "code_type": "CPT", "description": "ER Visit Level 5", "billed_amount": 1850.00, "quantity": 1, "service_date": "2026-02-15"},
        {"code": "74177", "code_type": "CPT", "description": "CT Scan", "billed_amount": 3200.00, "quantity": 1, "service_date": "2026-02-15"},
        {"code": "74177", "code_type": "CPT", "description": "CT Scan", "billed_amount": 3200.00, "quantity": 1, "service_date": "2026-02-15"},
        {"code": "J0131", "code_type": "HCPCS", "description": "Acetaminophen", "billed_amount": 75.00, "quantity": 1, "service_date": "2026-02-15"},
    ]
