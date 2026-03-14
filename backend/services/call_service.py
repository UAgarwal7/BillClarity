# Call Service — Call session management, real-time Gemini loop

from services.gemini_service import generate_call_response, call_gemini, load_prompt, parse_gemini_json
from db.repositories import call_logs_repo
import json


async def start_call_session(bill_id: str, bill_metadata: dict, analysis_data: dict) -> dict:
    """Create a call session with Gemini-generated strategy and script."""
    # TODO: Generate negotiation strategy via Gemini
    # TODO: Generate opening script
    # TODO: Extract key talking points
    # TODO: Create call_log record in MongoDB
    # TODO: Return { call_id, strategy, opening_script, key_points }
    pass


async def process_transcript(
    call_id: str, role: str, text: str, session_context: dict
) -> dict:
    """Process incoming transcript and generate AI response."""
    # TODO: Append to transcript in MongoDB
    # TODO: Build full context for Gemini
    # TODO: Call generate_call_response
    # TODO: Return { response, strategic_note, escalate }
    pass


async def end_call_session(call_id: str) -> dict:
    """End call session and generate summary."""
    # TODO: Fetch full transcript from MongoDB
    # TODO: Generate summary via Gemini
    # TODO: Update call_log with outcome + summary + next_steps
    # TODO: Return { summary, outcome, next_steps }
    pass
