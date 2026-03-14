# Tests — Benchmark Service

import pytest
from services.benchmark_service import (
    lookup_benchmark,
    calculate_deviation,
    calculate_deviation_score,
    get_risk_level,
)


class TestBenchmarkService:
    """Test suite for benchmark service calculations."""

    def test_lookup_cpt_code(self):
        """Test CPT code lookup returns benchmark data."""
        result = lookup_benchmark("99285", "CPT")
        assert result is not None
        assert result["medicare_rate"] == 432.00

    def test_lookup_hcpcs_code(self):
        """Test HCPCS code lookup returns benchmark data."""
        result = lookup_benchmark("J0131", "HCPCS")
        assert result is not None
        assert result["medicare_rate"] == 0.25

    def test_lookup_unknown_code(self):
        """Test unknown code returns None."""
        assert lookup_benchmark("99999", "CPT") is None

    def test_deviation_calculation(self):
        """Test deviation percentage calculation."""
        assert calculate_deviation(1600, 800) == 100.0
        assert calculate_deviation(800, 800) == 0.0
        assert calculate_deviation(400, 800) == -50.0

    def test_deviation_score_mapping(self):
        """Test deviation percentage to score mapping."""
        assert calculate_deviation_score(-10) == 0
        assert calculate_deviation_score(25) == 2
        assert calculate_deviation_score(75) == 4
        assert calculate_deviation_score(150) == 6
        assert calculate_deviation_score(300) == 8
        assert calculate_deviation_score(600) == 10

    def test_risk_level_mapping(self):
        """Test score to risk level mapping."""
        assert get_risk_level(0) == "normal"
        assert get_risk_level(3) == "normal"
        assert get_risk_level(4) == "elevated"
        assert get_risk_level(6) == "elevated"
        assert get_risk_level(7) == "extreme"
        assert get_risk_level(10) == "extreme"
