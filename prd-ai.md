# BillClarity — AI Implementation PRD

> Detailed specification for all AI/ML components. Covers Gemini prompt design, voice pipeline, and call agent architecture.
> Reference this document for all AI-related implementation decisions.

---

## 1. AI Layer Overview

All AI reasoning in BillClarity is powered by **Google Gemini 2.0 Flash** via the `google-generativeai` Python SDK. Gemini handles 12 distinct task types across the parsing pipeline, analysis engine, appeal generation, and call assistant.

**ElevenLabs** handles text-to-speech for the call assistant (stretch goal).
**Speech-to-text** (ElevenLabs STT, Deepgram, or Web Speech API) handles live transcription (stretch goal).
**n8n** orchestrates the multi-step call workflow (stretch goal).

---

## 2. Gemini SDK Setup

```python
import google.generativeai as genai

genai.configure(api_key=GEMINI_API_KEY)

model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.2,         # Low temp for factual accuracy
        "top_p": 0.95,
        "max_output_tokens": 8192,
    }
)

# For real-time call responses, use lower max_output_tokens for speed:
call_model = genai.GenerativeModel(
    model_name="gemini-2.0-flash",
    generation_config={
        "temperature": 0.3,
        "max_output_tokens": 1024,  # Short, fast responses
    }
)
```

---

## 3. Prompt Architecture

All prompts follow a 5-part structure:

```
SYSTEM: Role definition and behavioral constraints
CONTEXT: Input data specific to this request
TASK: Exact instruction for what to produce
OUTPUT FORMAT: Strict schema (JSON or markdown)
CONSTRAINTS: Guardrails and edge case handling
```

### 3.1 Universal System Prompt (prepended to all tasks)

```
You are a medical billing analyst AI built into the BillClarity platform.
Your role is to help patients understand and dispute medical bills.

Core behavioral rules:
- Use plain language a patient without medical training can understand.
- Be factual and precise. Always cite specific billing codes, dollar amounts, dates, and rules.
- Never provide legal advice. Frame all findings as "potential issues" or "possible errors."
- When uncertain about an extraction or analysis, state the uncertainty explicitly.
- Do not fabricate billing codes, pricing data, or insurance rules.
- Output must strictly follow the requested format (JSON or markdown).
```

---

## 4. Prompt Templates — Complete Specifications

### 4.1 Document Classification

**When called:** After Textract extraction, before structured data extraction.

**Input:** First 4000 characters of Textract raw text.

```
SYSTEM: [Universal system prompt]

CONTEXT:
The following text was extracted via OCR from an uploaded medical billing document:

---
{textract_raw_text_first_4000_chars}
---

TASK:
Classify this document into exactly one of the following types:
- provider_bill: A bill from a physician, specialist, or medical group
- hospital_statement: A facility bill from a hospital or health system
- eob: An insurance Explanation of Benefits
- denial_letter: An insurance claim denial notification
- itemized_statement: A detailed line-item breakdown of charges

Also assess your confidence in the classification.

OUTPUT FORMAT (strict JSON, no markdown fencing):
{
  "type": "provider_bill | hospital_statement | eob | denial_letter | itemized_statement",
  "confidence": 0.95,
  "reasoning": "Brief explanation of why this classification was chosen"
}

CONSTRAINTS:
- If the document does not appear to be a medical billing document, return type "unknown" with confidence 0.0.
- Confidence should reflect how clearly the document matches the type.
```

**Expected latency:** ~1s with Flash.

---

### 4.2 Structured Line Item Extraction

**When called:** After classification. Produces the structured data that feeds all downstream analysis.

**Input:** Full Textract output (text + table data) + classified document type.

```
SYSTEM: [Universal system prompt]

CONTEXT:
Document type: {doc_type}
Document confidence: {doc_confidence}

Extracted text:
---
{textract_raw_text}
---

Extracted tables:
---
{textract_tables_json}
---

Extracted key-value pairs:
---
{textract_kv_pairs_json}
---

TASK:
Extract all billing line items from this document into structured records. Also extract the top-level bill metadata.

OUTPUT FORMAT (strict JSON):
{
  "bill_metadata": {
    "provider": "string or null",
    "facility": "string or null",
    "service_date_range": { "start": "YYYY-MM-DD or null", "end": "YYYY-MM-DD or null" },
    "total_billed": number or null,
    "total_allowed": number or null,
    "total_insurance_paid": number or null,
    "patient_balance": number or null,
    "insurance_provider": "string or null"
  },
  "line_items": [
    {
      "service_date": "YYYY-MM-DD or null",
      "description": "string",
      "code": "string or null",
      "code_type": "CPT | HCPCS | REV | ICD | null",
      "quantity": number (default 1),
      "billed_amount": number,
      "allowed_amount": number or null,
      "insurance_paid": number or null,
      "patient_responsibility": number or null,
      "adjustment_reason": "string or null",
      "confidence": 0.0 to 1.0
    }
  ],
  "extraction_notes": "Any issues or ambiguities encountered"
}

CONSTRAINTS:
- Extract EVERY line item visible in the document, even if some fields are missing.
- Set confidence per line item: 0.85+ if clearly readable, 0.6-0.84 if partially ambiguous, below 0.6 if guessed.
- If a code looks like a CPT code (5 digits, optionally with modifier), label code_type as "CPT".
- If a code starts with a letter followed by digits (e.g., J0131, A4217), label as "HCPCS".
- Revenue codes (3-4 digits, often in 0XXX format) should be labeled "REV".
- Normalize all dollar amounts to plain numbers (no $ signs, no commas).
- If a field is not present in the document, set it to null rather than guessing.
```

**Expected latency:** ~2-4s depending on document size.

---

### 4.3 Plain-Language Bill Explanation

**When called:** After line items are extracted and stored.

**Input:** Structured line items + bill metadata.

```
SYSTEM: [Universal system prompt]

CONTEXT:
Bill from: {provider} — {facility}
Visit type: {visit_type}
Service dates: {date_range}
Insurance: {insurance_provider}
Total billed: ${total_billed}
Patient owes: ${patient_balance}

Line items:
{line_items_json}

TASK:
Write a complete plain-language explanation of this medical bill for the patient. Include:
1. An overall summary paragraph explaining the visit, total charges, insurance processing, and what the patient owes and why.
2. For EACH line item, a separate explanation paragraph that:
   - Describes what the service is in plain language
   - Explains the billing code if present
   - States how much was billed and how insurance processed it
   - Explains why the patient owes their portion (deductible, copay, coinsurance)

OUTPUT FORMAT (markdown):
## Overall Summary
[paragraph]

## Charge-by-Charge Breakdown

### [Line item description] — $[billed_amount]
[explanation paragraph]

### [Next line item]...

CONSTRAINTS:
- Never use medical jargon without immediately defining it in parentheses.
- Use "you" to address the patient directly.
- Be empathetic but factual.
- Do not speculate about whether charges are correct — that is handled by the error detection step.
- Keep each explanation to 2-4 sentences.
```

**Expected latency:** ~2-3s.

---

### 4.4 Error Detection (AI-Augmented)

**When called:** After rule-based detection has already flagged obvious issues (duplicates, quantity). Gemini provides second-pass reasoning.

**Input:** All line items (with rule-based flags already attached) + bill metadata.

```
SYSTEM: [Universal system prompt]

CONTEXT:
Bill from: {provider}, {facility}
Visit type: {visit_type}
Insurance: {insurance_provider}

Line items with existing flags:
{line_items_with_flags_json}

TASK:
Review these line items for additional potential billing issues that the rule-based checks may have missed. Look for:
1. Services that seem clinically implausible for the visit type
2. Charges that appear to be double-billed under different codes (unbundling)
3. Administrative or facility charges that are typically included in other fees
4. Charges that seem unusual in combination
5. Any other anomalies

Do NOT re-flag issues already identified in the existing flags.

OUTPUT FORMAT (strict JSON):
[
  {
    "line_item_index": 0,
    "type": "unbundled | implausible | hidden_fee | unusual_combination | other",
    "message": "Patient-friendly explanation of the issue",
    "severity": "info | warning | critical",
    "suggested_action": "What the patient should do about this",
    "reasoning": "Internal reasoning for why this was flagged (for logging, not shown to patient)"
  }
]

Return an empty array [] if no additional issues are found.

CONSTRAINTS:
- Only flag genuine anomalies. Do not flag charges that are normal for the visit type.
- err on the side of caution — a warning is better than a false critical.
- Each message must be understandable by someone with no medical billing knowledge.
```

---

### 4.5 Insurance Rule Matching

**When called:** After line items and errors are processed.

**Input:** Line items + insurance info + visit type + any denial codes.

```
SYSTEM: [Universal system prompt]

CONTEXT:
Visit type: {visit_type}
Insurance provider: {insurance_provider}
Service dates: {date_range}

Line items:
{line_items_json}

Detected issues:
{errors_json}

TASK:
Analyze this bill against known insurance rules, consumer protections, and appeal patterns. Identify:
1. Federal protections that may apply (No Surprises Act, etc.)
2. Common state-level billing protections relevant to the visit type
3. Appeal triggers — specific conditions where appeals have high success rates
4. Denial code analysis if any denial codes are present
5. Deductible/copay/coinsurance validation issues

OUTPUT FORMAT (strict JSON):
{
  "insights": [
    {
      "rule": "Name of the rule or protection",
      "description": "What this rule does, in plain language",
      "applicability": "How this specifically applies to THIS bill",
      "strength": "strong | moderate | weak",
      "appeal_strategy": "Specific steps the patient could take"
    }
  ],
  "appeal_triggers": [
    {
      "trigger": "Specific condition that could support an appeal",
      "success_likelihood": "high | moderate | low",
      "reasoning": "Why this appeal would likely succeed or not"
    }
  ]
}

CONSTRAINTS:
- Only cite real, existing laws and regulations.
- If you are not certain a protection applies, set strength to "weak" and note the uncertainty.
- Do not provide legal advice — frame as "you may want to discuss with your insurer" not "you are legally entitled to."
```

---

### 4.6 Appeal Letter Generation

**When called:** During appeal packet generation, after all analysis is complete.

**Input:** All analysis data (line items, errors, benchmarks, insurance insights).

```
SYSTEM: [Universal system prompt]

CONTEXT:
Patient bill details:
{bill_metadata_json}

Flagged issues:
{errors_json}

Benchmark results:
{benchmarks_json}

Insurance insights:
{insights_json}

TASK:
Write a formal appeal letter that the patient can send to the billing department or insurance company. The letter should:
1. Open with patient identification and account reference
2. State the purpose clearly (disputing specific charges)
3. List each disputed item with the specific issue and supporting evidence
4. Reference applicable consumer protections or insurance rules
5. Include specific pricing benchmarks where relevant
6. Make a clear, specific request (itemized review, charge removal, adjustment)
7. Set a timeline for response
8. Close professionally

OUTPUT FORMAT (markdown, formatted as a letter):
[Date]

[Provider/Insurance Company Name]
[Billing Department]
[Address placeholder]

RE: Account #[placeholder] — Billing Dispute

Dear Billing Department:

[Letter body...]

Sincerely,
[Patient Name placeholder]

CONSTRAINTS:
- Use a firm but professional, non-adversarial tone.
- Cite specific dollar amounts, codes, and dates throughout.
- Include placeholders in brackets [like this] for information the patient needs to fill in.
- Keep the letter to one page (approximately 400-600 words).
```

---

### 4.7 Negotiation Script Generation

**Input:** All analysis data.

```
SYSTEM: [Universal system prompt]

TASK:
Generate a step-by-step phone negotiation script for calling the billing department about this bill.

OUTPUT FORMAT (markdown with numbered sections):
## 1. Opening — Who to Contact and What to Say
[specific dialogue]

## 2. Identify Your Account
[specific dialogue]

## 3. Explain the Issues
[specific dialogue for each issue, in order of strength]

## 4. Present Evidence
[specific references to benchmarks, rules, errors]

## 5. Make Your Request
[specific dollar amount or action requested]

## 6. If They Resist — Escalation
[what to say if the first person can't help]

## 7. Closing — Get It in Writing
[how to document the call outcome]

## Key Phrases to Use
- [bullet list of effective negotiation phrases]

## Things to Avoid Saying
- [bullet list of counterproductive phrases]
```

---

### 4.8 Real-Time Call Response Generation

**When called:** During active call sessions, triggered by each new transcript segment.

**Input:** Full conversation so far + strategy + analysis data.

```
SYSTEM: You are a real-time negotiation advisor helping a patient dispute a medical bill during a live phone call. Generate concise, ready-to-speak responses.

CONTEXT:
Negotiation strategy: {strategy}
Key evidence points: {key_points}

Conversation so far:
{transcript_array}

Latest message from representative:
"{latest_representative_message}"

TASK:
Generate the next response the patient should give. Keep it concise (2-4 sentences) and ready to speak aloud.

OUTPUT FORMAT (strict JSON):
{
  "response": "The exact words the patient should say",
  "strategic_note": "Brief internal note about strategy (shown to patient as a tip, not spoken)",
  "escalate": false
}

CONSTRAINTS:
- Response must be conversational, not robotic.
- Maximum 4 sentences. Shorter is better.
- Set "escalate" to true if the representative is refusing or stonewalling and escalation should be suggested.
- Do not repeat information already discussed in the conversation.
```

**Expected latency:** <1s with Flash + low max_output_tokens.

---

## 5. Confidence Scoring Strategy

After extraction, Gemini self-rates each field's confidence. The backend also applies heuristic adjustments:

| Factor | Adjustment |
|---|---|
| Textract confidence for source block > 95% | +0.05 |
| Textract confidence for source block < 80% | -0.15 |
| Code matches known CPT/HCPCS format | +0.05 |
| Dollar amount parsed cleanly | +0.05 |
| Field was inferred (not directly in text) | -0.20 |
| Date format was ambiguous | -0.10 |

Final confidence = clamp(gemini_confidence + heuristic_adjustment, 0.0, 1.0).

Fields below 0.6 are flagged in the UI for user confirmation.

---

## 6. Prompt Management

Prompts are stored as `.txt` files in `backend/prompts/` and loaded at startup. This allows iteration without code changes.

```python
import os

PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "prompts")

def load_prompt(name: str) -> str:
    with open(os.path.join(PROMPTS_DIR, f"{name}.txt")) as f:
        return f.read()

# Usage:
classify_prompt = load_prompt("classify_document")
formatted = classify_prompt.format(textract_raw_text=raw_text[:4000])
response = model.generate_content(formatted)
```

Template variables use Python `str.format()` syntax: `{variable_name}`.

---

## 7. Gemini Error Handling

```python
from google.generativeai.types import GenerationError

async def call_gemini(prompt: str, model=model, retries=2) -> str:
    for attempt in range(retries + 1):
        try:
            response = model.generate_content(prompt)
            if response.text:
                return response.text
            # Handle blocked content
            if response.prompt_feedback.block_reason:
                raise ValueError(f"Content blocked: {response.prompt_feedback.block_reason}")
        except GenerationError as e:
            if attempt < retries:
                await asyncio.sleep(1 * (attempt + 1))  # backoff
                continue
            raise
    raise RuntimeError("Gemini failed after retries")
```

### JSON Parsing Safety

Gemini sometimes wraps JSON in markdown fences. Strip before parsing:

```python
import json, re

def parse_gemini_json(text: str) -> dict | list:
    # Strip markdown code fences if present
    cleaned = re.sub(r'^```(?:json)?\s*\n?', '', text.strip())
    cleaned = re.sub(r'\n?```\s*$', '', cleaned)
    return json.loads(cleaned)
```

---

## 8. Voice Pipeline Architecture (Stretch Goal)

### ElevenLabs TTS Integration

```python
import httpx

ELEVENLABS_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"  # "Rachel" or chosen voice

async def text_to_speech(text: str) -> bytes:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream",
            headers={"xi-api-key": ELEVENLABS_API_KEY},
            json={
                "text": text,
                "model_id": "eleven_turbo_v2",
                "voice_settings": {"stability": 0.6, "similarity_boost": 0.8}
            }
        )
        return response.content  # MP3 audio bytes
```

### Speech-to-Text Options

| Service | Approach | Latency |
|---|---|---|
| Web Speech API | Browser-native, no backend needed | Real-time |
| Deepgram | WebSocket streaming | ~300ms |
| ElevenLabs STT | HTTP or WebSocket | ~500ms |

**MVP:** Use Web Speech API (zero infrastructure, runs in browser).
**Stretch:** Use Deepgram WebSocket for better accuracy.

### n8n Call Workflow

n8n manages the async loop:

```
[Webhook: receive transcript] 
    → [Function: append to session context]
    → [HTTP: send to Gemini API]
    → [HTTP: send response to ElevenLabs TTS]
    → [Function: save to MongoDB call_logs]
    → [Respond: return text + audio to frontend]
```

Each node has error handling and retry logic configured in n8n.

---

## 9. Benchmarking Data Format

Static JSON files loaded by the backend at startup:

### `data/benchmark_cpt.json`

```json
{
  "99281": { "description": "ER Visit Level 1", "medicare_rate": 73.00, "typical_low": 150, "typical_median": 300, "typical_high": 600 },
  "99282": { "description": "ER Visit Level 2", "medicare_rate": 143.00, "typical_low": 200, "typical_median": 450, "typical_high": 900 },
  "99283": { "description": "ER Visit Level 3", "medicare_rate": 214.00, "typical_low": 300, "typical_median": 550, "typical_high": 1100 },
  "99284": { "description": "ER Visit Level 4", "medicare_rate": 340.00, "typical_low": 350, "typical_median": 700, "typical_high": 1300 },
  "99285": { "description": "ER Visit Level 5", "medicare_rate": 432.00, "typical_low": 350, "typical_median": 800, "typical_high": 1500 },
  "74177": { "description": "CT Abdomen/Pelvis w/ Contrast", "medicare_rate": 269.00, "typical_low": 500, "typical_median": 1200, "typical_high": 2500 },
  "85025": { "description": "CBC with Differential", "medicare_rate": 10.59, "typical_low": 30, "typical_median": 80, "typical_high": 200 },
  "80053": { "description": "Comprehensive Metabolic Panel", "medicare_rate": 14.49, "typical_low": 35, "typical_median": 90, "typical_high": 250 },
  "96360": { "description": "IV Infusion First Hour", "medicare_rate": 103.00, "typical_low": 150, "typical_median": 350, "typical_high": 700 }
}
```

### `data/benchmark_hcpcs.json`

```json
{
  "J0131": { "description": "Acetaminophen Injection", "medicare_rate": 0.25, "typical_low": 1, "typical_median": 3, "typical_high": 8 },
  "A4217": { "description": "Sterile Saline 1000mL", "medicare_rate": 1.50, "typical_low": 3, "typical_median": 7, "typical_high": 15 }
}
```

These files will be expanded with more codes as needed. The lookup is O(1) hash map access.

---

## 10. AI Performance Budget

| Task | Target Latency | Max Tokens |
|---|---|---|
| Document classification | < 1s | 256 |
| Line item extraction | < 4s | 8192 |
| Plain-language explanation | < 3s | 4096 |
| Error detection (AI pass) | < 3s | 4096 |
| Insurance rule matching | < 3s | 4096 |
| Appeal letter generation | < 5s | 4096 |
| Negotiation script | < 5s | 4096 |
| Real-time call response | < 1s | 1024 |

Total pipeline (steps 2-8): target < 20s end-to-end for a single document.

---

*This sub-PRD covers all AI implementation details. See `prdplan.md` for the full product specification and `prd-backend.md` for backend infrastructure and API contracts.*
