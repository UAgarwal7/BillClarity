# Tests — Analysis Router

import pytest


class TestAnalysisRouter:
    """Test suite for /api/bills/:bill_id/explanation|errors|benchmarks|insurance-insights."""

    async def test_get_explanation(self):
        """Test GET /api/bills/:bill_id/explanation returns plain-language summary."""
        pass

    async def test_get_errors(self):
        """Test GET /api/bills/:bill_id/errors returns detected issues."""
        pass

    async def test_get_benchmarks(self):
        """Test GET /api/bills/:bill_id/benchmarks returns pricing comparisons."""
        pass

    async def test_get_insurance_insights(self):
        """Test GET /api/bills/:bill_id/insurance-insights returns rules and triggers."""
        pass

    async def test_analysis_before_parsing_complete(self):
        """Test analysis endpoints return 409 when parsing is in progress."""
        pass
