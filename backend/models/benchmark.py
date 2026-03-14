# Benchmark Pydantic Models

from pydantic import BaseModel, Field
from enum import Enum


class BenchmarkRiskLevel(str, Enum):
    NORMAL = "normal"
    ELEVATED = "elevated"
    EXTREME = "extreme"


class BenchmarkResultResponse(BaseModel):
    id: str = Field(alias="_id")
    line_item_id: str
    bill_id: str
    code: str
    benchmark_source: str
    medicare_rate: float
    typical_low: float
    typical_median: float
    typical_high: float
    billed_amount: float
    deviation_percentage: float
    deviation_score: int
    risk_level: BenchmarkRiskLevel

    class Config:
        populate_by_name = True


class BenchmarkSummary(BaseModel):
    items_above_typical: int
    estimated_savings_low: float
    estimated_savings_high: float
