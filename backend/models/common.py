# Common Pydantic Models — Error responses, enums

from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    status: int


class ErrorResponse(BaseModel):
    error: ErrorDetail


class SuccessResponse(BaseModel):
    message: str
    status: str = "ok"
