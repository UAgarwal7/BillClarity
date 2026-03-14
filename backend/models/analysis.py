# Analysis Pydantic Models — Explanation, Error, Insight responses

from pydantic import BaseModel
from typing import List, Optional


class LineItemExplanation(BaseModel):
    line_item_id: str
    explanation: str


class ExplanationResponse(BaseModel):
    overall_summary: str
    line_item_explanations: List[LineItemExplanation]


class ErrorRecord(BaseModel):
    line_item_index: int
    type: str
    message: str
    severity: str
    suggested_action: str
    affected_amount: Optional[float] = None
    reasoning: Optional[str] = None


class ErrorSummary(BaseModel):
    critical: int
    warning: int
    info: int


class ErrorsResponse(BaseModel):
    error_summary: ErrorSummary
    errors: List[ErrorRecord]
    cross_document_issues: List[dict] = []


class InsuranceInsight(BaseModel):
    rule: str
    description: str
    applicability: str
    strength: str  # strong | moderate | weak
    appeal_strategy: str


class AppealTrigger(BaseModel):
    trigger: str
    success_likelihood: str  # high | moderate | low
    reasoning: str


class InsightsResponse(BaseModel):
    insights: List[InsuranceInsight]
    appeal_triggers: List[AppealTrigger]
