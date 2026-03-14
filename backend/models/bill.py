# Bill Pydantic Models

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ParsingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class DocumentType(str, Enum):
    PROVIDER_BILL = "provider_bill"
    HOSPITAL_STATEMENT = "hospital_statement"
    EOB = "eob"
    DENIAL_LETTER = "denial_letter"
    ITEMIZED_STATEMENT = "itemized_statement"
    UNKNOWN = "unknown"


class VisitType(str, Enum):
    EMERGENCY = "emergency"
    OUTPATIENT = "outpatient"
    INPATIENT = "inpatient"
    IMAGING = "imaging"
    OTHER = "other"


class DateRange(BaseModel):
    start: Optional[str] = None
    end: Optional[str] = None


class BillDocument(BaseModel):
    s3_key: str
    filename: str
    content_type: str
    uploaded_at: datetime


class ConfidenceScores(BaseModel):
    overall: float = 0.0
    fields: dict = Field(default_factory=dict)


class BillResponse(BaseModel):
    id: str = Field(alias="_id")
    user_id: str
    provider: Optional[str] = None
    facility: Optional[str] = None
    visit_type: Optional[VisitType] = None
    service_date_range: DateRange = Field(default_factory=DateRange)
    total_billed: Optional[float] = None
    total_allowed: Optional[float] = None
    total_insurance_paid: Optional[float] = None
    patient_balance: Optional[float] = None
    insurance_provider: Optional[str] = None
    document_type: Optional[DocumentType] = None
    documents: List[BillDocument] = Field(default_factory=list)
    parsing_status: ParsingStatus = ParsingStatus.PENDING
    confidence_scores: ConfidenceScores = Field(default_factory=ConfidenceScores)
    plain_language_summary: Optional[str] = None
    user_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
