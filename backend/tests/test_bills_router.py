# Tests — Bills Router

import pytest


class TestBillsRouter:
    """Test suite for /api/bills/* endpoints."""

    async def test_upload_bill(self):
        """Test POST /api/bills/upload with valid files."""
        # TODO: Test file upload with multipart form data
        pass

    async def test_upload_invalid_file_type(self):
        """Test upload rejects unsupported file types."""
        pass

    async def test_upload_too_large(self):
        """Test upload rejects files over 10MB."""
        pass

    async def test_get_bill(self):
        """Test GET /api/bills/:bill_id returns bill metadata."""
        pass

    async def test_get_bill_not_found(self):
        """Test GET /api/bills/:bill_id returns 404 for invalid ID."""
        pass

    async def test_get_line_items(self):
        """Test GET /api/bills/:bill_id/line-items returns extracted items."""
        pass

    async def test_confirm_fields(self):
        """Test POST /api/bills/:bill_id/confirm-fields updates corrections."""
        pass
