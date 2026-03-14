# Tests for AWS Comprehend Medical service

import json
from unittest.mock import patch, MagicMock
import pytest


# Sample Comprehend Medical response for testing
SAMPLE_COMPREHEND_RESPONSE = {
    "Entities": [
        {
            "Id": 0,
            "BeginOffset": 0,
            "EndOffset": 21,
            "Score": 0.98,
            "Text": "Acetaminophen 1000mg",
            "Category": "MEDICATION",
            "Type": "GENERIC_NAME",
            "Traits": [],
            "Attributes": [
                {"Type": "DOSAGE", "Text": "1000mg", "Score": 0.95},
                {"Type": "ROUTE_OR_MODE", "Text": "IV", "Score": 0.92},
            ],
            "RxNormConcepts": [
                {"Code": "161", "Description": "Acetaminophen", "Score": 0.95},
            ],
        },
        {
            "Id": 1,
            "BeginOffset": 30,
            "EndOffset": 50,
            "Score": 0.92,
            "Text": "acute appendicitis",
            "Category": "MEDICAL_CONDITION",
            "Type": "DX_NAME",
            "Traits": [{"Name": "DIAGNOSIS"}],
            "ICD10CMConcepts": [
                {"Code": "K35.80", "Description": "Unspecified acute appendicitis", "Score": 0.88},
            ],
        },
        {
            "Id": 2,
            "BeginOffset": 55,
            "EndOffset": 75,
            "Score": 0.89,
            "Text": "CT abdomen and pelvis",
            "Category": "TEST_TREATMENT_PROCEDURE",
            "Type": "TEST_NAME",
            "Traits": [],
        },
    ]
}


@patch("services.comprehend_service.comprehend_client")
@pytest.mark.asyncio
async def test_detect_medical_entities(mock_client):
    """Test that detect_medical_entities correctly categorizes entities."""
    mock_client.detect_entities_v2.return_value = SAMPLE_COMPREHEND_RESPONSE

    from services.comprehend_service import detect_medical_entities

    result = await detect_medical_entities("Acetaminophen 1000mg IV for acute appendicitis CT abdomen and pelvis")

    assert result["raw_entity_count"] == 3
    assert len(result["medications"]) == 1
    assert len(result["diagnoses"]) == 1
    assert len(result["procedures"]) == 1
    assert result["medications"][0]["text"] == "Acetaminophen 1000mg"
    assert result["diagnoses"][0]["text"] == "acute appendicitis"


@patch("services.comprehend_service.comprehend_client")
@pytest.mark.asyncio
async def test_normalize_billing_codes(mock_client):
    """Test that normalize_billing_codes maps entities to code types."""
    mock_client.detect_entities_v2.return_value = SAMPLE_COMPREHEND_RESPONSE

    from services.comprehend_service import detect_medical_entities, normalize_billing_codes

    entities = await detect_medical_entities("sample text")
    hints = normalize_billing_codes(entities)

    assert len(hints) >= 2  # At least medication + diagnosis
    code_types = [h["code_type"] for h in hints]
    assert "RxNorm" in code_types
    assert "ICD-10-CM" in code_types


@patch("services.comprehend_service.comprehend_client")
@pytest.mark.asyncio
async def test_entities_to_json_context(mock_client):
    """Test that entities_to_json_context produces valid JSON."""
    mock_client.detect_entities_v2.return_value = SAMPLE_COMPREHEND_RESPONSE

    from services.comprehend_service import detect_medical_entities, entities_to_json_context

    entities = await detect_medical_entities("sample text")
    context_json = entities_to_json_context(entities)
    context = json.loads(context_json)

    assert "medications" in context
    assert "procedures" in context
    assert "diagnoses" in context
    assert "normalized_codes" in context


@patch("services.comprehend_service.comprehend_client")
@pytest.mark.asyncio
async def test_empty_text(mock_client):
    """Test handling of empty text input."""
    mock_client.detect_entities_v2.return_value = {"Entities": []}

    from services.comprehend_service import detect_medical_entities

    result = await detect_medical_entities("")
    assert result["raw_entity_count"] == 0
    assert result["medications"] == []
    assert result["procedures"] == []
    assert result["diagnoses"] == []
