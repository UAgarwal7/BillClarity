# Call Log Pydantic Models

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class CallOutcome(str, Enum):
    RESOLVED = "resolved"
    ESCALATED = "escalated"
    FOLLOW_UP = "follow_up"
    UNRESOLVED = "unresolved"


class TranscriptEntry(BaseModel):
    role: str  # agent | representative | system
    text: str
    timestamp: datetime


class AiResponseEntry(BaseModel):
    prompt_context: str
    response: str
    timestamp: datetime


class CallStartRequest(BaseModel):
    bill_id: str


class CallStartResponse(BaseModel):
    call_id: str
    strategy: str
    opening_script: str
    key_points: List[str]


class CallEndResponse(BaseModel):
    summary: str
    outcome: str
    next_steps: str


class CallLogResponse(BaseModel):
    id: str = Field(alias="_id")
    bill_id: str
    started_at: datetime
    ended_at: Optional[datetime] = None
    strategy: str
    initial_script: str
    transcript: List[TranscriptEntry] = Field(default_factory=list)
    ai_responses: List[AiResponseEntry] = Field(default_factory=list)
    negotiation_outcome: Optional[CallOutcome] = None
    summary: Optional[str] = None
    next_steps: Optional[str] = None
    notes: Optional[str] = None

    class Config:
        populate_by_name = True
