# PDF Service — Markdown → HTML → PDF (markdown2 + weasyprint)

import markdown2
from utils.pdf_builder import render_pdf


async def generate_pdf(sections: dict, metadata: dict) -> bytes:
    """Convert packet sections from markdown to a PDF bundle."""
    # TODO: Convert each section's markdown to HTML via markdown2
    # TODO: Wrap in HTML template with cover page + TOC
    # TODO: Render to PDF via weasyprint
    # TODO: Return PDF bytes

    html_sections = {}
    for key, md_content in sections.items():
        html_sections[key] = markdown2.markdown(md_content, extras=["tables", "fenced-code-blocks"])

    # TODO: Assemble full HTML document
    # TODO: Render PDF
    pass
