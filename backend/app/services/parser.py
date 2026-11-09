import io


def parse_file(filename: str, content: bytes) -> str:
    """Convert a supported uploaded file to plain text."""
    name = filename.lower()

    if name.endswith((".md", ".txt", ".csv")):
        return content.decode("utf-8", errors="replace")

    if name.endswith(".pdf"):
        from pypdf import PdfReader

        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    if name.endswith(".docx"):
        from docx import Document

        document = Document(io.BytesIO(content))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)

    raise ValueError(f"Unsupported file type: {filename}")
