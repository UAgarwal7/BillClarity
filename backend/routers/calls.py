# Calls Router — /api/calls/*

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException

from services.call_service import start_call_session, process_transcript, end_call_session
from db.repositories import call_logs_repo

router = APIRouter()


@router.post("/start", status_code=201)
async def start_call(bill_id: str = None):
    """Create a new call session. Gemini generates strategy and opening script."""
    # TODO: Fetch bill + analysis data
    # TODO: Generate strategy via Gemini
    # TODO: Generate opening script
    # TODO: Create call_log in MongoDB
    # TODO: Return { call_id, strategy, opening_script, key_points }
    pass


@router.websocket("/{call_id}/stream")
async def call_stream(websocket: WebSocket, call_id: str):
    """WebSocket for real-time call interaction."""
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            # TODO: Append transcript segment to call session
            # TODO: Send full context to Gemini
            # TODO: Return AI response + strategic note
            pass
    except WebSocketDisconnect:
        pass


@router.post("/{call_id}/end")
async def end_call(call_id: str):
    """End the call session. Gemini generates summary and outcome."""
    # TODO: Generate call summary via Gemini
    # TODO: Update call_log with outcome + next_steps
    # TODO: Return { summary, outcome, next_steps }
    pass


@router.get("/{call_id}")
async def get_call_log(call_id: str):
    """Get the complete call log (transcript, AI responses, outcome)."""
    # TODO: Fetch from call_logs collection
    pass
