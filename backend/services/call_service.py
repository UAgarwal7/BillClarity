# Call Service — Voice-based call session: Gemini as patient, ElevenLabs TTS

import re
from datetime import datetime, timezone
from bson import ObjectId
from services.gemini_service import json_dumps, generate_call_response, call_gemini, parse_gemini_json
from services.elevenlabs_service import text_to_speech_base64
from db.repositories import call_logs_repo, bills_repo, line_items_repo, benchmark_results_repo


def _strip_brackets(text: str) -> str:
    """Remove any [bracketed] placeholders from text."""
    return re.sub(r"\[.*?\]", "", text).strip()


def _build_bill_context(bill_metadata: dict) -> dict:
    date_range = bill_metadata.get("service_date_range", {})
    return {
        "provider": bill_metadata.get("provider", "the hospital"),
        "facility": bill_metadata.get("facility", "the billing department"),
        "visit_date": date_range.get("start") or bill_metadata.get("service_date", "my recent visit"),
        "total_billed": f"{bill_metadata.get('total_billed', 0):,.2f}",
        "patient_balance": f"{bill_metadata.get('patient_balance', 0):,.2f}",
        "insurance_provider": bill_metadata.get("insurance_provider", "my insurance"),
    }


def _build_prior_calls_summary(past_calls: list) -> str:
    """Build a summary string from prior call logs for this bill.

    Only includes completed calls (those with a real outcome and summary)
    to avoid polluting context with abandoned/incomplete sessions.
    """
    completed = [
        c for c in past_calls
        if c.get("negotiation_outcome") and c.get("summary")
    ]
    if not completed:
        return "No prior calls for this bill."
    # Limit to last 3 completed calls to prevent prompt bloat
    completed = completed[:3]
    lines = []
    for i, c in enumerate(completed, 1):
        outcome = c.get("negotiation_outcome", "unknown")
        summary = c.get("summary", "No summary")
        next_steps = c.get("next_steps", "")
        lines.append(f"Call {i} — Outcome: {outcome}. {summary}")
        if next_steps:
            lines.append(f"  Next steps: {next_steps}")
    return "\n".join(lines)


async def start_call_session(bill_id: str, bill_metadata: dict, analysis_data: dict) -> dict:
    """Create a call session. Gemini generates strategy + opening statement AS the patient.

    Returns { call_id, strategy, opening_script, key_points, opening_audio_base64, bill_context }.
    """
    errors = analysis_data.get("errors", [])
    benchmarks = analysis_data.get("benchmarks", [])

    bill_context = _build_bill_context(bill_metadata)

    past_calls = await call_logs_repo.get_by_bill(bill_id)
    prior_calls_summary = _build_prior_calls_summary(past_calls)

    strategy_prompt = f"""You are preparing to make a phone call AS a patient to dispute a medical bill.

Given the bill analysis below, generate:
1. A concise negotiation strategy (2-3 sentences, internal notes for the patient)
2. The opening statement the patient will SAY when the billing representative picks up. Write it in first person ("Hi, I'm calling about my bill..."). Do NOT use placeholders like [name] — use the real data or say "the patient" / "my account" naturally.
3. A list of 3-5 key talking points (specific dollar amounts, codes, errors to reference)

Bill Info:
- Provider: {bill_context['provider']}
- Facility: {bill_context['facility']}
- Visit Date: {bill_context['visit_date']}
- Total Billed: ${bill_context['total_billed']}
- Patient Balance: ${bill_context['patient_balance']}
- Insurance: {bill_context['insurance_provider']}

Prior Call History:
{prior_calls_summary}

Errors Found:
{json_dumps(errors[:5], indent=2)}

Benchmark Issues:
{json_dumps([b for b in benchmarks if b.get('risk_level') in ('elevated', 'extreme')][:5], indent=2)}

IMPORTANT: If issues were disputed in 2+ prior calls without resolution, do NOT include them as talking points. Focus on unresolved items only.
ABSOLUTELY NEVER use square brackets, curly braces, or any placeholder syntax. Use real data or natural phrases.

Output as JSON:
{{
  "strategy": "...",
  "opening_script": "Hi, I'm calling about my recent bill from ... (spoken words only, no special characters)",
  "key_points": ["...", "...", "..."]
}}"""

    result = await call_gemini(strategy_prompt)
    parsed = parse_gemini_json(result)

    strategy = parsed.get("strategy", "Dispute billing errors and overpriced items.")
    opening_script = _strip_brackets(parsed.get("opening_script", f"Hi, I'm calling about my recent bill from {bill_context['provider']}. I've reviewed the charges and I have some concerns I'd like to discuss."))
    key_points = parsed.get("key_points", ["Review duplicate charges", "Dispute overpriced items"])

    opening_audio = await text_to_speech_base64(opening_script)

    call_id = await call_logs_repo.create({
        "bill_id": bill_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "strategy": strategy,
        "initial_script": opening_script,
        "key_points": key_points,
        "bill_context": bill_context,
        "prior_calls_summary": prior_calls_summary,
        "transcript": [{
            "role": "patient",
            "text": opening_script,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }],
        "ai_responses": [],
        "negotiation_outcome": None,
        "summary": None,
        "next_steps": None,
    })

    return {
        "call_id": call_id,
        "strategy": strategy,
        "opening_script": opening_script,
        "key_points": key_points,
        "opening_audio_base64": opening_audio,
        "bill_context": bill_context,
    }


async def process_transcript(
    call_id: str, role: str, text: str, session_context: dict
) -> dict:
    """Process incoming transcript segment.

    Only the representative role triggers a Gemini response + TTS.
    """
    entry = {
        "role": role,
        "text": text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_repo.append_transcript(call_id, entry)

    if role == "patient":
        return {
            "type": "transcript_saved",
            "response": "",
            "strategic_note": "",
            "escalate": False,
            "end_call": False,
            "audio_base64": None,
        }

    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        return {"type": "ai_response", "response": "Session not found.", "strategic_note": "", "escalate": False, "end_call": False, "audio_base64": None}

    transcript = call_log.get("transcript", [])
    strategy = call_log.get("strategy", "")
    key_points = session_context.get("key_points", "")
    bill_context = session_context.get("bill_context") or call_log.get("bill_context", {})
    prior_calls_summary = call_log.get("prior_calls_summary", "")

    try:
        result = await generate_call_response(
            strategy=strategy,
            key_points=json_dumps(key_points) if isinstance(key_points, list) else str(key_points),
            transcript=transcript,
            latest_message=text,
            bill_context=bill_context,
            prior_calls_summary=prior_calls_summary,
        )
    except Exception as e:
        import traceback
        print(f"[CALL] Gemini call response FAILED for call {call_id}: {e}")
        traceback.print_exc()

        # Dynamic fallback that references what the rep actually said
        # so it doesn't repeat the same static line every time
        fallback_text = f"I appreciate you explaining that. Could you tell me more about how that charge was determined?"
        if "correct" in text.lower() or "accurate" in text.lower():
            fallback_text = "I understand you're saying the charge is correct. Could you walk me through exactly how that amount was calculated?"
        elif "sure" in text.lower() or "continue" in text.lower() or "go ahead" in text.lower():
            fallback_text = "Great, so looking at my bill, could you help me understand the largest charge on here?"
        elif "?" in text:
            fallback_text = "That's a good question. Let me think about that for a moment. Could you also pull up the itemized charges for me?"

        result = {
            "response": fallback_text,
            "strategic_note": f"Gemini failed: {str(e)[:200]} — using contextual fallback.",
            "escalate": False,
            "end_call": False,
        }

    response_text = _strip_brackets(result.get("response", ""))

    ai_entry = {
        "prompt_context": f"Transcript ({len(transcript)} entries)",
        "response": response_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_repo.collection.update_one(
        {"_id": ObjectId(call_id)},
        {"$push": {"ai_responses": ai_entry}},
    )

    patient_entry = {
        "role": "patient",
        "text": response_text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_repo.append_transcript(call_id, patient_entry)

    audio_base64 = await text_to_speech_base64(response_text) if response_text else None

    result["type"] = "ai_response"
    result["response"] = response_text
    result["audio_base64"] = audio_base64
    return result


async def end_call_session(call_id: str) -> dict:
    """End call session and generate summary via Gemini."""
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        return {"summary": "Session not found.", "outcome": "unknown", "next_steps": "N/A"}

    transcript = call_log.get("transcript", [])
    strategy = call_log.get("strategy", "")

    transcript_text = "\n".join(
        f"[{t.get('role', 'unknown')}]: {t.get('text', '')}" for t in transcript
    )

    summary_prompt = f"""You are a medical billing negotiation analyst.

Summarize this phone call negotiation about a medical bill dispute.
The patient called the billing department / insurance company to dispute charges.

Strategy used: {strategy}

Full transcript:
{transcript_text}

Output as JSON:
{{
  "summary": "2-3 sentence summary of what happened",
  "outcome": "resolved | escalated | follow_up | unresolved",
  "next_steps": "Specific next steps the patient should take"
}}"""

    result = await call_gemini(summary_prompt)
    parsed = parse_gemini_json(result)

    summary = parsed.get("summary", "Call completed.")
    outcome = parsed.get("outcome", "unresolved")
    next_steps = parsed.get("next_steps", "Follow up in 5 business days.")

    await call_logs_repo.update(call_id, {
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "negotiation_outcome": outcome,
        "next_steps": next_steps,
    })

    await _apply_call_outcomes(call_id)

    return {"summary": summary, "outcome": outcome, "next_steps": next_steps}


async def _apply_call_outcomes(call_id: str):
    """Analyze call transcript and apply resolution updates to line items, benchmarks, and bill."""
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        return

    bill_id = call_log.get("bill_id")
    bill = await bills_repo.get_by_id(bill_id) if bill_id else None
    if not bill:
        return

    transcript = call_log.get("transcript", [])
    transcript_text = "\n".join(
        f"[{t.get('role', 'unknown')}]: {t.get('text', '')}" for t in transcript
    )

    line_items = await line_items_repo.get_by_bill(bill_id)
    benchmarks = await benchmark_results_repo.get_by_bill(bill_id)

    line_items_summary = json_dumps([
        {"_id": li["_id"], "description": li.get("description", ""), "code": li.get("code", ""), "billed_amount": li.get("billed_amount", 0)}
        for li in line_items
    ], indent=2)

    benchmarks_summary = json_dumps([
        {"_id": b["_id"], "code": b.get("code", ""), "billed_amount": b.get("billed_amount", 0)}
        for b in benchmarks
    ], indent=2)

    prompt = f"""You are a medical billing analyst. Analyze the call transcript below and determine what was resolved or changed during the negotiation.

CALL TRANSCRIPT:
{transcript_text}

LINE ITEMS:
{line_items_summary}

BENCHMARKS:
{benchmarks_summary}

CURRENT BILL TOTALS:
- Total Billed: ${bill.get('total_billed', 0):,.2f}
- Patient Balance: ${bill.get('patient_balance', 0):,.2f}

Based on the conversation, identify:
1. Which line items were resolved (rep agreed to remove/reduce)
2. Which amounts changed (rep offered a different amount)
3. Updated patient balance if reductions were agreed upon

Output as JSON:
{{
  "line_item_updates": [
    {{
      "_id": "line_item_id",
      "status": "resolved | adjusted | denied",
      "new_amount": 0,
      "note": "Brief explanation"
    }}
  ],
  "benchmark_updates": [
    {{
      "_id": "benchmark_id",
      "status": "resolved | adjusted | denied",
      "new_amount": 0,
      "note": "Brief explanation"
    }}
  ],
  "bill_updates": {{
    "new_total_billed": 0,
    "new_patient_balance": 0,
    "savings_summary": "Brief summary of savings achieved"
  }},
  "resolved_insights": ["list of insurance insight rules that are no longer applicable"]
}}

RULES:
- Only include items that were ACTUALLY discussed and changed/resolved in the call.
- If nothing was resolved, return empty arrays and null for bill_updates.
- Use the exact _id values from the data above.
- Be conservative — only mark as resolved/adjusted if the rep clearly agreed."""

    try:
        result = await call_gemini(prompt)
        parsed = parse_gemini_json(result)
    except Exception:
        return

    for update in parsed.get("line_item_updates", []):
        item_id = update.get("_id")
        if not item_id:
            continue
        try:
            await line_items_repo.collection.update_one(
                {"_id": ObjectId(item_id)},
                {"$set": {
                    "call_resolution": {
                        "status": update.get("status", "denied"),
                        "previous_amount": next(
                            (li.get("billed_amount", 0) for li in line_items if li["_id"] == item_id), 0
                        ),
                        "new_amount": update.get("new_amount", 0),
                        "note": update.get("note", ""),
                        "call_id": call_id,
                    }
                }},
            )
        except Exception:
            continue

    for update in parsed.get("benchmark_updates", []):
        bench_id = update.get("_id")
        if not bench_id:
            continue
        try:
            await benchmark_results_repo.collection.update_one(
                {"_id": ObjectId(bench_id)},
                {"$set": {
                    "call_resolution": {
                        "status": update.get("status", "denied"),
                        "previous_amount": next(
                            (b.get("billed_amount", 0) for b in benchmarks if b["_id"] == bench_id), 0
                        ),
                        "new_amount": update.get("new_amount", 0),
                        "note": update.get("note", ""),
                        "call_id": call_id,
                    }
                }},
            )
        except Exception:
            continue

    bill_updates = parsed.get("bill_updates")
    if bill_updates and bill_updates.get("new_patient_balance") is not None:
        try:
            await bills_repo.collection.update_one(
                {"_id": ObjectId(bill_id)},
                {"$set": {
                    "call_adjustments": {
                        "previous_total_billed": bill.get("total_billed", 0),
                        "new_total_billed": bill_updates.get("new_total_billed", bill.get("total_billed", 0)),
                        "previous_patient_balance": bill.get("patient_balance", 0),
                        "new_patient_balance": bill_updates.get("new_patient_balance", bill.get("patient_balance", 0)),
                        "savings_summary": bill_updates.get("savings_summary", ""),
                        "call_id": call_id,
                    }
                }},
            )
        except Exception:
            pass

    resolved_insights = parsed.get("resolved_insights", [])
    if resolved_insights and bill.get("insurance_insights"):
        insights = bill.get("insurance_insights", {})
        existing = insights.get("insights", [])
        for ins in existing:
            if ins.get("rule") in resolved_insights:
                ins["resolved_by_call"] = True
                ins["call_id"] = call_id
        try:
            await bills_repo.collection.update_one(
                {"_id": ObjectId(bill_id)},
                {"$set": {"insurance_insights.insights": existing}},
            )
        except Exception:
            pass
