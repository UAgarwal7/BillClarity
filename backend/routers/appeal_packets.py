# Appeal Packets Router — /api/appeal-packets/*

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from db.repositories import appeal_packets_repo
from services.appeal_service import generate_packet
from services.pdf_service import generate_pdf

router = APIRouter()


@router.post("/bills/{bill_id}/appeal-packet/generate", status_code=201)
async def generate_appeal_packet(bill_id: str):
    """Trigger Gemini to generate all selected appeal sections."""
    # TODO: Parse sections from body
    # TODO: Fetch all analysis data
    # TODO: Generate each section via Gemini
    # TODO: Store in appeal_packets collection
    # TODO: Return { packet_id, status: "generating" }
    pass


@router.get("/appeal-packets/{packet_id}")
async def get_appeal_packet(packet_id: str):
    """Get all packet sections (markdown content)."""
    # TODO: Fetch from appeal_packets collection
    pass


@router.put("/appeal-packets/{packet_id}")
async def update_appeal_packet(packet_id: str):
    """Update edited sections."""
    # TODO: Parse sections from body
    # TODO: Update MongoDB doc
    pass


@router.get("/appeal-packets/{packet_id}/pdf")
async def get_appeal_packet_pdf(packet_id: str):
    """Generate and return the PDF bundle."""
    # TODO: Fetch packet, render markdown → HTML → PDF
    # TODO: Upload to S3, return presigned URL or stream
    pass
