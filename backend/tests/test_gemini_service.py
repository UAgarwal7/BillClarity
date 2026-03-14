# Tests — Gemini Service

import pytest
from services.gemini_service import parse_gemini_json


class TestGeminiService:
    """Test suite for Gemini service utilities."""

    def test_parse_json_clean(self):
        """Test parsing clean JSON."""
        result = parse_gemini_json('{"type": "provider_bill", "confidence": 0.95}')
        assert result["type"] == "provider_bill"
        assert result["confidence"] == 0.95

    def test_parse_json_with_markdown_fences(self):
        """Test parsing JSON wrapped in markdown code fences."""
        text = '```json\n{"type": "eob", "confidence": 0.90}\n```'
        result = parse_gemini_json(text)
        assert result["type"] == "eob"

    def test_parse_json_array(self):
        """Test parsing JSON array."""
        text = '[{"type": "duplicate", "severity": "critical"}]'
        result = parse_gemini_json(text)
        assert isinstance(result, list)
        assert len(result) == 1

    def test_parse_json_with_whitespace(self):
        """Test parsing JSON with leading/trailing whitespace."""
        text = '  \n```json\n  {"key": "value"}  \n```\n  '
        result = parse_gemini_json(text)
        assert result["key"] == "value"

    def test_parse_invalid_json_raises(self):
        """Test that invalid JSON raises an exception."""
        with pytest.raises(Exception):
            parse_gemini_json("not valid json at all")

    def test_load_prompt_exists(self):
        """Test that all expected prompt files exist."""
        from services.gemini_service import load_prompt
        expected_prompts = [
            "classify_document", "extract_line_items", "explain_bill",
            "detect_errors", "match_insurance_rules", "generate_appeal_letter",
            "generate_negotiation_script", "generate_call_response",
        ]
        for name in expected_prompts:
            prompt = load_prompt(name)
            assert len(prompt) > 0, f"Prompt {name} should not be empty"
