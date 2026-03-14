# Line Item Pydantic Models

from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum


class CodeType(str, Enum):
    CPT = "CPT"
    HCPCS = "HCPCS"
    REV = "REV"
    ICD = "ICD"


class Category(str, Enum):
    FACILITY = "facility"
    PHYSICIAN = "physician"
    LAB = "lab"
    IMAGING = "imaging"
    PROCEDURE = "procedure"
    MEDICATION = "medication"
    SUPPLY = "supply"
    OTHER = "other"


class RiskLevel(str, Enum):
    NORMAL = "normal"
    NEEDS_REVIEW = "needs_review"
    HIGH_RISK = "high_risk"


class Severity(str, Enum):
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"


class LineItemFlag(BaseModel):
    type: str
    message: str
    severity: Severity
    suggested_action: str


class LineItemResponse(BaseModel):
    id: str = Field(alias="_id")
    bill_id: str
    service_date: Optional[str] = None
    description: str
    code: Optional[str] = None
    code_type: Optional[CodeType] = None
    quantity: int = 1
    billed_amount: float
    allowed_amount: Optional[float] = None
    insurance_paid: Optional[float] = None
    patient_responsibility: Optional[float] = None
    adjustment_reason: Optional[str] = None
    category: Optional[Category] = None
    confidence: float = 0.0
    risk_level: RiskLevel = RiskLevel.NORMAL
    flags: List[LineItemFlag] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class FieldCorrection(BaseModel):
    line_item_id: Optional[str] = None
    field: str
    corrected_value: str
