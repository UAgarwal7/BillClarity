# Calls Router — /api/calls/*

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel
from typing import Optional

from services.call_service import start_call_session, process_transcript, end_call_session
from services.elevenlabs_service import text_to_speech, text_to_speech_base64
from db.repositories import call_logs_repo, bills_repo, line_items_repo, benchmark_results_repo

router = APIRouter()


class StartCallRequest(BaseModel):
    bill_id: str


class TranscriptMessage(BaseModel):
    role: str  # "patient" or "representative"
    text: str


@router.get("/bill/{bill_id}")
async def list_calls_for_bill(bill_id: str):
    """List all call sessions for a bill (summary only, no transcript)."""
    calls = await call_logs_repo.get_by_bill(bill_id)
    return {"calls": calls}


@router.post("/start", status_code=201)
async def start_call(request: StartCallRequest):
    """Create a new call session. Gemini generates strategy and opening script."""
    bill = await bills_repo.get_by_id(request.bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {request.bill_id} not found."
        })

    # Gather analysis data for the call
    items = await line_items_repo.get_by_bill(request.bill_id)
    benchmarks = await benchmark_results_repo.get_by_bill(request.bill_id)

    errors = []
    for item in items:
        errors.extend(item.get("flags", []))

    analysis_data = {
        "errors": errors,
        "benchmarks": benchmarks,
        "insights": bill.get("insurance_insights", {}),
    }

    result = await start_call_session(
        bill_id=request.bill_id,
        bill_metadata=bill,
        analysis_data=analysis_data,
    )

    return result


@router.websocket("/{call_id}/stream")
async def call_stream(websocket: WebSocket, call_id: str):
    """WebSocket for real-time call interaction."""
    await websocket.accept()

    # Verify call exists
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        await websocket.send_json({"error": "CALL_NOT_FOUND", "message": f"Call {call_id} not found."})
        await websocket.close()
        return

    session_context = {
        "strategy": call_log.get("strategy", ""),
        "key_points": call_log.get("key_points", []),
    }

    try:
        while True:
            data = await websocket.receive_json()
            role = data.get("role", "patient")
            text = data.get("text", "")

            if not text:
                await websocket.send_json({"error": "EMPTY_MESSAGE", "message": "Text is required."})
                continue

            result = await process_transcript(
                call_id=call_id,
                role=role,
                text=text,
                session_context=session_context,
            )

            await websocket.send_json({
                "type": result.get("type", "ai_response"),
                "response": result.get("response", ""),
                "strategic_note": result.get("strategic_note", ""),
                "escalate": result.get("escalate", False),
                "audio_base64": result.get("audio_base64"),
            })
    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_json({"error": "INTERNAL_ERROR", "message": str(e)})
        except Exception:
            pass


@router.post("/{call_id}/end")
async def end_call(call_id: str):
    """End the call session. Gemini generates summary and outcome."""
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        raise HTTPException(status_code=404, detail={
            "error": "CALL_NOT_FOUND", "message": f"Call {call_id} not found."
        })

    result = await end_call_session(call_id)
    return result


@router.get("/{call_id}")
async def get_call_log(call_id: str):
    """Get the complete call log (transcript, AI responses, outcome)."""
    call_log = await call_logs_repo.get_by_id(call_id)
    if not call_log:
        raise HTTPException(status_code=404, detail={
            "error": "CALL_NOT_FOUND", "message": f"Call {call_id} not found."
        })
    return call_log


class TTSRequest(BaseModel):
    text: str


@router.post("/tts")
async def synthesize_speech(request: TTSRequest):
    """On-demand text-to-speech. Returns MP3 audio."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text is required.")

    audio_bytes = await text_to_speech(request.text)
    if audio_bytes is None:
        raise HTTPException(status_code=502, detail="TTS synthesis failed. Check ElevenLabs API key.")

    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": 'inline; filename="tts_output.mp3"'},
    )
