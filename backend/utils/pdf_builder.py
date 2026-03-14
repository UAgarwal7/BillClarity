# PDF Builder — HTML template + weasyprint PDF rendering


def render_pdf(html_content: str) -> bytes:
    """Render HTML string to PDF bytes using weasyprint."""
    # TODO: Import weasyprint
    # TODO: Wrap html_content in full HTML document with CSS styling
    # TODO: Return PDF bytes
    pass


def build_appeal_html(sections: dict, metadata: dict) -> str:
    """Build a full HTML document from appeal packet sections."""
    # TODO: Cover page with patient info and date
    # TODO: Table of contents
    # TODO: Each section as a chapter
    # TODO: Print-friendly CSS
    html = "<html><body>"
    for key, content in sections.items():
        html += f"<section><h2>{key}</h2>{content}</section>"
    html += "</body></html>"
    return html
