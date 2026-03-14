# Appeal Packet Pydantic Models

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PacketStatus(str, Enum):
    GENERATING = "generating"
    DRAFT = "draft"
    FINALIZED = "finalized"


class PacketGenerateRequest(BaseModel):
    sections: List[str]


class PacketUpdateRequest(BaseModel):
    sections: dict  # { section_name: "updated markdown" }


class AppealPacketResponse(BaseModel):
    id: str = Field(alias="_id")
    bill_id: str
    generation_date: datetime
    appeal_strategy: Optional[str] = None
    sections: dict = Field(default_factory=dict)
    selected_sections: List[str] = Field(default_factory=list)
    pdf_s3_key: Optional[str] = None
    status: PacketStatus = PacketStatus.DRAFT

    class Config:
        populate_by_name = True
