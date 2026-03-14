# PDF Service — Markdown → HTML → PDF (markdown2 + weasyprint)

from utils.pdf_builder import render_pdf, build_appeal_html
from utils.s3 import upload_file_to_s3
from db.repositories import appeal_packets_repo


async def generate_pdf(packet_id: str, sections: dict, metadata: dict) -> bytes:
    """Convert packet sections from markdown to a PDF bundle.

    Returns PDF bytes and uploads to S3.
    """
    # Build full HTML document with cover page, TOC, and sections
    html = build_appeal_html(sections, metadata)

    # Render to PDF
    pdf_bytes = render_pdf(html)

    # Upload to S3
    s3_key = f"packets/{packet_id}.pdf"
    await upload_file_to_s3(pdf_bytes, s3_key, "application/pdf")

    # Update packet record with S3 key
    await appeal_packets_repo.update(packet_id, {
        "pdf_s3_key": s3_key,
        "status": "finalized",
    })

    return pdf_bytes
