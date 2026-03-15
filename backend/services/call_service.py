# Call Service — Call session management, real-time Gemini loop

import json
from datetime import datetime, timezone
from services.gemini_service import generate_call_response, call_gemini, parse_gemini_json
from services.elevenlabs_service import text_to_speech_base64
from db.repositories import call_logs_repo, bills_repo, line_items_repo, benchmark_results_repo


async def start_call_session(bill_id: str, bill_metadata: dict, analysis_data: dict) -> dict:
    """Create a call session with Gemini-generated strategy and script.

    Returns { call_id, strategy, opening_script, key_points }.
    """
    errors = analysis_data.get("errors", [])
    benchmarks = analysis_data.get("benchmarks", [])
    insights = analysis_data.get("insights", {})

    # Generate negotiation strategy via Gemini
    strategy_prompt = f"""You are a medical billing negotiation strategist.

Given the following bill analysis, generate:
1. A concise negotiation strategy (2-3 sentences)
2. An opening phone script (what the patient should say when calling)
3. A list of 3-5 key talking points

Bill Info:
- Provider: {bill_metadata.get('provider', 'Unknown')}
- Total Billed: ${bill_metadata.get('total_billed', 0):,.2f}
- Patient Balance: ${bill_metadata.get('patient_balance', 0):,.2f}

Errors Found:
{json.dumps(errors[:5], indent=2)}

Benchmark Issues:
{json.dumps([b for b in benchmarks if b.get('risk_level') in ('elevated', 'extreme')][:5], indent=2)}

Output as JSON:
{{
  "strategy": "...",
  "opening_script": "...",
  "key_points": ["...", "...", "..."]
}}"""

    result = await call_gemini(strategy_prompt)
    parsed = parse_gemini_json(result)

    strategy = parsed.get("strategy", "Dispute billing errors and overpriced items.")
    opening_script = parsed.get("opening_script", "Hello, I'm calling about my recent bill...")
    key_points = parsed.get("key_points", ["Review duplicate charges", "Dispute overpriced items"])

    # Create call log in MongoDB
    call_id = await call_logs_repo.create({
        "bill_id": bill_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "ended_at": None,
        "strategy": strategy,
        "initial_script": opening_script,
        "transcript": [],
        "ai_responses": [],
        "negotiation_outcome": None,
        "summary": None,
        "next_steps": None,
    })

    # Synthesize opening script to speech
    opening_audio = await text_to_speech_base64(opening_script)

    return {
        "call_id": call_id,
        "strategy": strategy,
        "opening_script": opening_script,
        "key_points": key_points,
        "opening_audio_base64": opening_audio,
    }


async def process_transcript(
    call_id: str, role: str, text: str, session_context: dict
) -> dict:
    """Process incoming transcript segment and generate AI response.

    Returns { response, strategic_note, escalate }.
    """
    # Append transcript entry to MongoDB
    entry = {
        "role": role,
        "text": text,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_repo.append_transcript(call_id, entry)

    # Fetch full call log for context
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        return {"response": "Session not found.", "strategic_note": "", "escalate": False}

    transcript = call_log.get("transcript", [])
    strategy = call_log.get("strategy", "")
    key_points = session_context.get("key_points", "")

    # Generate AI response
    result = await generate_call_response(
        strategy=strategy,
        key_points=json.dumps(key_points) if isinstance(key_points, list) else str(key_points),
        transcript=transcript,
        latest_message=text,
    )

    # Save AI response to call log
    ai_entry = {
        "prompt_context": f"Transcript ({len(transcript)} entries)",
        "response": result.get("response", ""),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    await call_logs_repo.collection.update_one(
        {"_id": call_log["_id"]} if "_id" in call_log else {},
        {"$push": {"ai_responses": ai_entry}},
    )

    # Synthesize AI response to speech
    response_text = result.get("response", "")
    audio_base64 = await text_to_speech_base64(response_text) if response_text else None
    result["audio_base64"] = audio_base64

    return result


async def end_call_session(call_id: str) -> dict:
    """End call session and generate summary via Gemini.

    Returns { summary, outcome, next_steps }.
    """
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        return {"summary": "Session not found.", "outcome": "unknown", "next_steps": "N/A"}

    transcript = call_log.get("transcript", [])
    strategy = call_log.get("strategy", "")

    # Format transcript for Gemini
    transcript_text = "\n".join(
        f"[{t.get('role', 'unknown')}]: {t.get('text', '')}" for t in transcript
    )

    summary_prompt = f"""You are a medical billing negotiation analyst.

Summarize this phone call negotiation about a medical bill dispute.

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

    # Update call log
    await call_logs_repo.update(call_id, {
        "ended_at": datetime.now(timezone.utc).isoformat(),
        "summary": summary,
        "negotiation_outcome": outcome,
        "next_steps": next_steps,
    })

    return {"summary": summary, "outcome": outcome, "next_steps": next_steps}
