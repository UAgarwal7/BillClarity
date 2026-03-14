# Appeal Packets Router — /api/appeal-packets/*

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import io

from db.repositories import appeal_packets_repo, bills_repo, line_items_repo, benchmark_results_repo
from services.appeal_service import generate_packet
from services.pdf_service import generate_pdf

router = APIRouter()


class GeneratePacketRequest(BaseModel):
    sections: List[str] = [
        "bill_explanation",
        "flagged_issues",
        "benchmark_analysis",
        "insurance_insights",
        "appeal_letter",
        "negotiation_script",
        "evidence_checklist",
    ]


class UpdatePacketRequest(BaseModel):
    sections: dict


@router.post("/bills/{bill_id}/appeal-packet/generate", status_code=201)
async def generate_appeal_packet(bill_id: str, request: GeneratePacketRequest):
    """Trigger Gemini to generate all selected appeal sections."""
    bill = await bills_repo.get_by_id(bill_id)
    if not bill:
        raise HTTPException(status_code=404, detail={
            "error": "BILL_NOT_FOUND", "message": f"Bill {bill_id} not found."
        })

    # Fetch all analysis data
    line_items = await line_items_repo.get_by_bill(bill_id)
    benchmarks = await benchmark_results_repo.get_by_bill(bill_id)
    insights = bill.get("insurance_insights", {"insights": [], "appeal_triggers": []})

    # Aggregate errors from line items
    errors = []
    for item in line_items:
        for flag in item.get("flags", []):
            errors.append({
                **flag,
                "description": item.get("description", "Unknown"),
                "code": item.get("code"),
                "affected_amount": item.get("billed_amount"),
            })

    # Generate the packet
    packet_id = await generate_packet(
        bill_id=bill_id,
        bill_metadata=bill,
        line_items=line_items,
        errors=errors,
        benchmarks=benchmarks,
        insights=insights,
        selected_sections=request.sections,
    )

    return {"packet_id": packet_id, "status": "draft"}


@router.get("/appeal-packets/{packet_id}")
async def get_appeal_packet(packet_id: str):
    """Get all packet sections (markdown content)."""
    packet = await appeal_packets_repo.get_by_id(packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail={
            "error": "PACKET_NOT_FOUND", "message": f"Packet {packet_id} not found."
        })
    return packet


@router.put("/appeal-packets/{packet_id}")
async def update_appeal_packet(packet_id: str, request: UpdatePacketRequest):
    """Update edited sections."""
    packet = await appeal_packets_repo.get_by_id(packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail={
            "error": "PACKET_NOT_FOUND", "message": f"Packet {packet_id} not found."
        })

    # Merge updated sections
    existing = packet.get("sections", {})
    existing.update(request.sections)

    await appeal_packets_repo.update(packet_id, {"sections": existing})
    return {"message": "Packet updated.", "packet_id": packet_id}


@router.get("/appeal-packets/{packet_id}/pdf")
async def get_appeal_packet_pdf(packet_id: str):
    """Generate and return the PDF bundle."""
    packet = await appeal_packets_repo.get_by_id(packet_id)
    if not packet:
        raise HTTPException(status_code=404, detail={
            "error": "PACKET_NOT_FOUND", "message": f"Packet {packet_id} not found."
        })

    # Get bill metadata for cover page
    bill_id = packet.get("bill_id")
    bill = await bills_repo.get_by_id(bill_id) if bill_id else {}

    # Generate PDF
    pdf_bytes = await generate_pdf(
        packet_id=packet_id,
        sections=packet.get("sections", {}),
        metadata=bill or {},
    )

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=appeal_packet_{packet_id}.pdf"},
    )
