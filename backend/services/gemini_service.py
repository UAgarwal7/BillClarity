# Gemini Service — All Gemini interactions + JSON parsing safety

import os
import json
import re
import asyncio
import google.generativeai as genai

from config import settings

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)

# Standard model for most tasks
model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.2,
        "top_p": 0.95,
        "max_output_tokens": 8192,
    },
)

# Fast model for real-time call responses
call_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.3,
        "max_output_tokens": 1024,
    },
)

# Prompt loader
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


def load_prompt(name: str) -> str:
    """Load a prompt template from the prompts/ directory."""
    with open(os.path.join(PROMPTS_DIR, f"{name}.txt")) as f:
        return f.read()


def parse_gemini_json(text: str) -> dict | list:
    """Strip markdown code fences and parse JSON from Gemini output."""
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    return json.loads(cleaned)


async def call_gemini(prompt: str, use_model=None, retries: int = 2) -> str:
    """Call Gemini with retry logic and error handling."""
    _model = use_model or model
    for attempt in range(retries + 1):
        try:
            response = _model.generate_content(prompt)
            if response.text:
                return response.text
            if response.prompt_feedback and response.prompt_feedback.block_reason:
                raise ValueError(f"Content blocked: {response.prompt_feedback.block_reason}")
        except Exception as e:
            if attempt < retries:
                await asyncio.sleep(1 * (attempt + 1))
                continue
            raise
    raise RuntimeError("Gemini failed after retries")


async def classify_document(raw_text: str) -> dict:
    """Classify document type using first 4000 chars of extracted text."""
    prompt = load_prompt("classify_document").format(
        textract_raw_text_first_4000_chars=raw_text[:4000]
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def extract_line_items(
    doc_type: str, doc_confidence: float,
    raw_text: str, tables_json: str, kv_pairs_json: str,
) -> dict:
    """Extract structured line items from Textract output."""
    prompt = load_prompt("extract_line_items").format(
        doc_type=doc_type,
        doc_confidence=doc_confidence,
        textract_raw_text=raw_text,
        textract_tables_json=tables_json,
        textract_kv_pairs_json=kv_pairs_json,
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def generate_explanation(bill_metadata: dict, line_items: list) -> str:
    """Generate plain-language bill explanation."""
    prompt = load_prompt("explain_bill").format(
        provider=bill_metadata.get("provider", ""),
        facility=bill_metadata.get("facility", ""),
        visit_type=bill_metadata.get("visit_type", ""),
        date_range=str(bill_metadata.get("service_date_range", "")),
        insurance_provider=bill_metadata.get("insurance_provider", ""),
        total_billed=bill_metadata.get("total_billed", 0),
        patient_balance=bill_metadata.get("patient_balance", 0),
        line_items_json=json.dumps(line_items, indent=2),
    )
    return await call_gemini(prompt)


async def detect_errors_ai(bill_metadata: dict, line_items_with_flags: list) -> list:
    """AI-augmented error detection pass."""
    prompt = load_prompt("detect_errors").format(
        provider=bill_metadata.get("provider", ""),
        facility=bill_metadata.get("facility", ""),
        visit_type=bill_metadata.get("visit_type", ""),
        insurance_provider=bill_metadata.get("insurance_provider", ""),
        line_items_with_flags_json=json.dumps(line_items_with_flags, indent=2),
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def match_insurance_rules(bill_metadata: dict, line_items: list, errors: list) -> dict:
    """Match insurance rules and identify appeal strategies."""
    prompt = load_prompt("match_insurance_rules").format(
        visit_type=bill_metadata.get("visit_type", ""),
        insurance_provider=bill_metadata.get("insurance_provider", ""),
        date_range=str(bill_metadata.get("service_date_range", "")),
        line_items_json=json.dumps(line_items, indent=2),
        errors_json=json.dumps(errors, indent=2),
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def generate_appeal_letter(
    bill_metadata: dict, errors: list, benchmarks: list, insights: list,
) -> str:
    """Generate formal appeal letter."""
    prompt = load_prompt("generate_appeal_letter").format(
        bill_metadata_json=json.dumps(bill_metadata, indent=2),
        errors_json=json.dumps(errors, indent=2),
        benchmarks_json=json.dumps(benchmarks, indent=2),
        insights_json=json.dumps(insights, indent=2),
    )
    return await call_gemini(prompt)


async def generate_negotiation_script(
    bill_metadata: dict, errors: list, benchmarks: list, insights: list,
) -> str:
    """Generate phone negotiation script."""
    prompt = load_prompt("generate_negotiation_script").format(
        bill_metadata_json=json.dumps(bill_metadata, indent=2),
        errors_json=json.dumps(errors, indent=2),
        benchmarks_json=json.dumps(benchmarks, indent=2),
        insights_json=json.dumps(insights, indent=2),
    )
    return await call_gemini(prompt)


async def generate_call_response(
    strategy: str, key_points: str, transcript: list, latest_message: str,
) -> dict:
    """Generate real-time call response (low latency)."""
    prompt = load_prompt("generate_call_response").format(
        strategy=strategy,
        key_points=key_points,
        transcript_array=json.dumps(transcript),
        latest_representative_message=latest_message,
    )
    result = await call_gemini(prompt, use_model=call_model)
    return parse_gemini_json(result)
