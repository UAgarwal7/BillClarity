# ElevenLabs TTS Service — Voice synthesis for the AI Call Assistant
#
# Converts Gemini-generated text responses into natural-sounding speech
# using the ElevenLabs streaming TTS API.
# Ref: prd-ai.md §8, prdplan.md §6.8

import base64
import httpx
from config import settings


# Voice configuration (per PRD)
ELEVENLABS_VOICE_ID = settings.elevenlabs_voice_id if hasattr(settings, 'elevenlabs_voice_id') else "21m00Tcm4TlvDq8ikWAM"
ELEVENLABS_MODEL = "eleven_turbo_v2"
ELEVENLABS_API_URL = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}/stream"


async def text_to_speech(text: str) -> bytes | None:
    """Convert text to speech audio via ElevenLabs streaming API.

    Returns MP3 audio bytes, or None if the API key is missing or the request fails.
    """
    api_key = settings.elevenlabs_api_key
    if not api_key:
        print("WARN: ELEVENLABS_API_KEY not set — skipping TTS")
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ELEVENLABS_API_URL,
                headers={
                    "xi-api-key": api_key,
                    "Content-Type": "application/json",
                    "Accept": "audio/mpeg",
                },
                json={
                    "text": text,
                    "model_id": ELEVENLABS_MODEL,
                    "voice_settings": {
                        "stability": 0.6,
                        "similarity_boost": 0.8,
                    },
                },
            )
            if response.status_code == 200:
                return response.content  # raw MP3 bytes
            else:
                print(f"WARN: ElevenLabs TTS failed ({response.status_code}): {response.text[:200]}")
                return None
    except Exception as e:
        print(f"WARN: ElevenLabs TTS error: {e}")
        return None


async def text_to_speech_base64(text: str) -> str | None:
    """Convert text to speech and return as a base64-encoded string.

    Useful for embedding audio in JSON responses (WebSocket, REST).
    """
    audio_bytes = await text_to_speech(text)
    if audio_bytes:
        return base64.b64encode(audio_bytes).decode("utf-8")
    return None
