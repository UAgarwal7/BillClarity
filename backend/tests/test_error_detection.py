# Tests — Error Detection Service

import pytest
from services.error_detection_service import run_rule_based_checks


class TestErrorDetection:
    """Test suite for rule-based error detection."""

    def test_duplicate_detection(self, sample_line_items):
        """Test duplicate charges are flagged (same code + date)."""
        flags = run_rule_based_checks(sample_line_items, {"service_date_range": {"start": "2026-02-15", "end": "2026-02-15"}})
        duplicates = [f for f in flags if f["type"] == "duplicate"]
        assert len(duplicates) >= 2  # Both instances of 74177 should be flagged

    def test_quantity_anomaly(self):
        """Test high quantities for physician services are flagged."""
        items = [{"code": "99285", "code_type": "CPT", "description": "ER Visit", "quantity": 5, "category": "physician", "service_date": "2026-02-15"}]
        flags = run_rule_based_checks(items, {"service_date_range": {"start": "2026-02-15", "end": "2026-02-15"}})
        qty_flags = [f for f in flags if f["type"] == "quantity_anomaly"]
        assert len(qty_flags) == 1

    def test_date_mismatch(self):
        """Test service dates outside bill range are flagged."""
        items = [{"code": "99285", "code_type": "CPT", "description": "ER Visit", "quantity": 1, "category": "physician", "service_date": "2026-03-01"}]
        metadata = {"service_date_range": {"start": "2026-02-15", "end": "2026-02-15"}}
        flags = run_rule_based_checks(items, metadata)
        date_flags = [f for f in flags if f["type"] == "date_mismatch"]
        assert len(date_flags) == 1

    def test_denied_but_billed(self):
        """Test denied services with patient charges are flagged."""
        items = [{"code": "99285", "code_type": "CPT", "description": "ER Visit", "quantity": 1, "category": "physician", "service_date": "2026-02-15", "adjustment_reason": "Claim Denied", "patient_responsibility": 500.00}]
        flags = run_rule_based_checks(items, {"service_date_range": {"start": "2026-02-15", "end": "2026-02-15"}})
        denied_flags = [f for f in flags if f["type"] == "denied_billed"]
        assert len(denied_flags) == 1

    def test_no_false_positives(self):
        """Test clean bill returns no flags."""
        items = [{"code": "99285", "code_type": "CPT", "description": "ER Visit", "quantity": 1, "category": "physician", "service_date": "2026-02-15", "billed_amount": 800}]
        flags = run_rule_based_checks(items, {"service_date_range": {"start": "2026-02-15", "end": "2026-02-15"}})
        assert len(flags) == 0
