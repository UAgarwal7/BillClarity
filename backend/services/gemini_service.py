# Gemini Service — All Gemini interactions + JSON parsing safety

import os
import json
import re
import asyncio
import google.generativeai as genai
from datetime import datetime

from config import settings

# Configure Gemini
genai.configure(api_key=settings.gemini_api_key)

# Standard model for most tasks
model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={
        "temperature": 0.2,
        "top_p": 0.95,
        "max_output_tokens": 8192,
    },
)

# Fast model for real-time call responses
call_model = genai.GenerativeModel(
    model_name="gemini-2.5-flash",
    generation_config={
        "temperature": 0.3,
        "max_output_tokens": 2048,
    },
)

# Prompt loader
PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")


def load_prompt(name: str) -> str:
    """Load a prompt template from the prompts/ directory."""
    with open(os.path.join(PROMPTS_DIR, f"{name}.txt")) as f:
        return f.read()


class DateTimeEncoder(json.JSONEncoder):
    """Custom JSON encoder to handle datetime objects."""
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def json_dumps(obj, indent=None) -> str:
    """Helper to dump JSON with datetime support."""
    return json.dumps(obj, indent=indent, cls=DateTimeEncoder)


def parse_gemini_json(text: str) -> dict | list:
    """Strip markdown code fences and parse JSON from Gemini output.

    Includes repair logic for truncated JSON (e.g. from max_output_tokens cutoff).
    """
    cleaned = re.sub(r"^```(?:json)?\s*\n?", "", text.strip())
    cleaned = re.sub(r"\n?```\s*$", "", cleaned)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Try to repair truncated JSON by closing open strings/braces
        repaired = cleaned
        # Close any unterminated string
        if repaired.count('"') % 2 != 0:
            repaired += '"'
        # Close any open braces/brackets
        open_braces = repaired.count("{") - repaired.count("}")
        open_brackets = repaired.count("[") - repaired.count("]")
        repaired += "}" * max(0, open_braces)
        repaired += "]" * max(0, open_brackets)
        try:
            return json.loads(repaired)
        except json.JSONDecodeError:
            pass
        # Last resort: try to extract the response field with regex
        match = re.search(r'"response"\s*:\s*"((?:[^"\\]|\\.)*)', cleaned)
        if match:
            return {
                "response": match.group(1),
                "strategic_note": "Extracted from truncated Gemini output",
                "escalate": False,
                "end_call": False,
            }
        raise


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
        line_items_json=json_dumps(line_items, indent=2),
    )
    return await call_gemini(prompt)


async def detect_errors_ai(bill_metadata: dict, line_items_with_flags: list) -> list:
    """AI-augmented error detection pass."""
    prompt = load_prompt("detect_errors").format(
        provider=bill_metadata.get("provider", ""),
        facility=bill_metadata.get("facility", ""),
        visit_type=bill_metadata.get("visit_type", ""),
        insurance_provider=bill_metadata.get("insurance_provider", ""),
        line_items_with_flags_json=json_dumps(line_items_with_flags, indent=2),
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def match_insurance_rules(bill_metadata: dict, line_items: list, errors: list) -> dict:
    """Match insurance rules and identify appeal strategies."""
    prompt = load_prompt("match_insurance_rules").format(
        visit_type=bill_metadata.get("visit_type", ""),
        insurance_provider=bill_metadata.get("insurance_provider", ""),
        date_range=str(bill_metadata.get("service_date_range", "")),
        line_items_json=json_dumps(line_items, indent=2),
        errors_json=json_dumps(errors, indent=2),
    )
    result = await call_gemini(prompt)
    return parse_gemini_json(result)


async def generate_appeal_letter(
    bill_metadata: dict, errors: list, benchmarks: list, insights: list,
) -> str:
    """Generate formal appeal letter."""
    prompt = load_prompt("generate_appeal_letter").format(
        bill_metadata_json=json_dumps(bill_metadata, indent=2),
        errors_json=json_dumps(errors, indent=2),
        benchmarks_json=json_dumps(benchmarks, indent=2),
        insights_json=json_dumps(insights, indent=2),
    )
    return await call_gemini(prompt)


async def generate_negotiation_script(
    bill_metadata: dict, errors: list, benchmarks: list, insights: list,
) -> str:
    """Generate phone negotiation script."""
    prompt = load_prompt("generate_negotiation_script").format(
        bill_metadata_json=json_dumps(bill_metadata, indent=2),
        errors_json=json_dumps(errors, indent=2),
        benchmarks_json=json_dumps(benchmarks, indent=2),
        insights_json=json_dumps(insights, indent=2),
    )
    return await call_gemini(prompt)


def _format_transcript_for_prompt(transcript: list, max_exchanges: int = 10) -> tuple[str, str]:
    """Format transcript as readable text and extract topics already covered.

    Returns (formatted_recent_transcript, topics_covered_summary).
    """
    role_labels = {"patient": "Patient", "representative": "Representative", "agent": "Patient"}

    if len(transcript) <= max_exchanges * 2:
        lines = []
        for t in transcript:
            label = role_labels.get(t.get("role", ""), t.get("role", "Unknown"))
            lines.append(f"{label}: {t.get('text', '')}")
        return "\n".join(lines), ""

    earlier = transcript[:-(max_exchanges * 2)]
    recent = transcript[-(max_exchanges * 2):]

    topics = set()
    patient_said = []
    for t in earlier:
        text_lower = t.get("text", "").lower()
        role = t.get("role", "")
        for keyword in ["duplicate", "overcharg", "cpt", "code", "saline", "ct scan",
                        "adjusted", "removed", "reduce", "discount", "balance", "charge"]:
            if keyword in text_lower:
                topics.add(keyword)
        # Track what the patient already said to prevent repetition
        if role in ("patient", "agent"):
            patient_said.append(t.get("text", "")[:80])

    topics_summary = ""
    parts = []
    if topics:
        parts.append(f"Topics already discussed earlier in the call: {', '.join(sorted(topics))}. Do NOT bring these up again unless the rep re-opens them.")
    if patient_said:
        parts.append(f"You (patient) already said these things earlier — do NOT repeat them: {' | '.join(patient_said[-5:])}")
    topics_summary = "\n".join(parts)

    lines = []
    for t in recent:
        label = role_labels.get(t.get("role", ""), t.get("role", "Unknown"))
        lines.append(f"{label}: {t.get('text', '')}")

    return "\n".join(lines), topics_summary


async def generate_call_response(
    strategy: str, key_points: str, transcript: list, latest_message: str,
    bill_context: dict | None = None, prior_calls_summary: str = "",
) -> dict:
    """Generate real-time call response as the patient (low latency)."""
    ctx = bill_context or {}

    formatted_transcript, topics_covered = _format_transcript_for_prompt(transcript)

    prompt = load_prompt("generate_call_response").format(
        strategy=strategy,
        key_points=key_points,
        transcript_array=formatted_transcript,
        latest_representative_message=latest_message,
        provider=ctx.get("provider", "the hospital"),
        facility=ctx.get("facility", "the billing department"),
        visit_date=ctx.get("visit_date", "my recent visit"),
        total_billed=ctx.get("total_billed", "unknown"),
        patient_balance=ctx.get("patient_balance", "unknown"),
        insurance_provider=ctx.get("insurance_provider", "my insurance"),
        prior_calls_summary=prior_calls_summary or "No prior calls for this bill.",
        topics_already_covered=topics_covered,
    )
    result = await call_gemini(prompt, use_model=call_model)
    try:
        return parse_gemini_json(result)
    except Exception as e:
        print(f"[CALL] Gemini returned unparseable response: {result[:500]}")
        raise ValueError(f"Failed to parse Gemini call response: {e}") from e
