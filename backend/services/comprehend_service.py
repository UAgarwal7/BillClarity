# AWS Comprehend Medical Service — Medical entity detection + code normalization

import boto3
import json
from typing import List, Dict, Any, Optional
from config import settings

comprehend_client = boto3.client(
    "comprehendmedical",
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.aws_region,
)


async def detect_medical_entities(text: str) -> Dict[str, Any]:
    """
    Run AWS Comprehend Medical DetectEntitiesV2 on raw text.

    Returns structured medical entities:
    - medications: drug names, dosages, routes, frequencies
    - procedures: test/treatment descriptions
    - diagnoses: medical conditions with ICD-10-CM mappings
    - anatomy: body parts and systems
    - normalized_codes: RxNorm + ICD-10-CM concept mappings
    """
    # Comprehend Medical has a 20,000 character limit per request
    truncated_text = text[:20000]

    response = comprehend_client.detect_entities_v2(Text=truncated_text)

    entities = response.get("Entities", [])

    # Categorize entities by type
    result = {
        "medications": [],
        "procedures": [],
        "diagnoses": [],
        "anatomy": [],
        "other_entities": [],
        "normalized_codes": [],
        "raw_entity_count": len(entities),
    }

    for entity in entities:
        category = entity.get("Category", "")
        entity_type = entity.get("Type", "")
        text_value = entity.get("Text", "")
        score = entity.get("Score", 0.0)
        traits = entity.get("Traits", [])
        attributes = entity.get("Attributes", [])

        entry = {
            "text": text_value,
            "type": entity_type,
            "score": round(score, 3),
            "begin_offset": entity.get("BeginOffset"),
            "end_offset": entity.get("EndOffset"),
        }

        # Extract ICD-10-CM concepts if present
        icd_concepts = entity.get("ICD10CMConcepts", [])
        if icd_concepts:
            entry["icd10_codes"] = [
                {"code": c.get("Code"), "description": c.get("Description"), "score": round(c.get("Score", 0), 3)}
                for c in icd_concepts[:3]  # Top 3 matches
            ]
            result["normalized_codes"].extend(
                {"source_text": text_value, "code": c.get("Code"), "code_type": "ICD-10-CM", "description": c.get("Description")}
                for c in icd_concepts[:1]  # Best match
            )

        # Extract RxNorm concepts if present
        rx_concepts = entity.get("RxNormConcepts", [])
        if rx_concepts:
            entry["rxnorm_codes"] = [
                {"code": c.get("Code"), "description": c.get("Description"), "score": round(c.get("Score", 0), 3)}
                for c in rx_concepts[:3]
            ]
            result["normalized_codes"].extend(
                {"source_text": text_value, "code": c.get("Code"), "code_type": "RxNorm", "description": c.get("Description")}
                for c in rx_concepts[:1]
            )

        # Extract attributes (dosage, frequency, route, etc.)
        if attributes:
            entry["attributes"] = [
                {"type": a.get("Type"), "text": a.get("Text"), "score": round(a.get("Score", 0), 3)}
                for a in attributes
            ]

        # Extract traits (negation, diagnosis, sign, symptom)
        if traits:
            entry["traits"] = [t.get("Name") for t in traits]

        # Categorize
        if category == "MEDICATION":
            result["medications"].append(entry)
        elif category == "TEST_TREATMENT_PROCEDURE":
            result["procedures"].append(entry)
        elif category == "MEDICAL_CONDITION":
            result["diagnoses"].append(entry)
        elif category == "ANATOMY":
            result["anatomy"].append(entry)
        else:
            result["other_entities"].append(entry)

    return result


def normalize_billing_codes(comprehend_entities: Dict[str, Any]) -> List[Dict[str, str]]:
    """
    Map Comprehend Medical entities to billing code types for enriching Gemini context.

    Returns a list of normalized code hints like:
    [
        {"source_text": "Acetaminophen 1000mg IV", "suggested_code": "J0131", "code_type": "HCPCS", "confidence": "high"},
        {"source_text": "Appendicitis", "suggested_code": "K35.80", "code_type": "ICD-10-CM", "confidence": "moderate"},
    ]
    """
    hints = []

    # Map RxNorm medication concepts → potential HCPCS codes
    for med in comprehend_entities.get("medications", []):
        rxnorm = med.get("rxnorm_codes", [])
        if rxnorm:
            hints.append({
                "source_text": med["text"],
                "suggested_code": rxnorm[0].get("code", ""),
                "code_type": "RxNorm",
                "description": rxnorm[0].get("description", ""),
                "confidence": "high" if rxnorm[0].get("score", 0) > 0.8 else "moderate",
            })

    # Map ICD-10-CM diagnosis concepts
    for dx in comprehend_entities.get("diagnoses", []):
        icd_codes = dx.get("icd10_codes", [])
        if icd_codes:
            hints.append({
                "source_text": dx["text"],
                "suggested_code": icd_codes[0].get("code", ""),
                "code_type": "ICD-10-CM",
                "description": icd_codes[0].get("description", ""),
                "confidence": "high" if icd_codes[0].get("score", 0) > 0.8 else "moderate",
            })

    return hints


def entities_to_json_context(comprehend_entities: Dict[str, Any]) -> str:
    """
    Format Comprehend Medical entities as a JSON string for inclusion
    in Gemini prompt context. Keeps only the most relevant fields.
    """
    context = {
        "medications": [
            {"name": m["text"], "attributes": m.get("attributes", []), "rxnorm": m.get("rxnorm_codes", [])[:1]}
            for m in comprehend_entities.get("medications", [])
        ],
        "procedures": [
            {"name": p["text"], "score": p["score"]}
            for p in comprehend_entities.get("procedures", [])
        ],
        "diagnoses": [
            {"condition": d["text"], "icd10": d.get("icd10_codes", [])[:1]}
            for d in comprehend_entities.get("diagnoses", [])
        ],
        "normalized_codes": comprehend_entities.get("normalized_codes", []),
    }
    return json.dumps(context, indent=2)
