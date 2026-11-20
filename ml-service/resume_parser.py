import os
from io import BytesIO
from urllib.parse import urlparse

import pdfplumber
import requests

# Resumes are only ever uploaded to Cloudinary (see server/src/config/multer.js).
# Restricting fetches to that host prevents SSRF via a crafted resume_url
# pointing at internal/metadata services.
ALLOWED_RESUME_HOST = os.environ.get("ALLOWED_RESUME_HOST", "res.cloudinary.com")
DOWNLOAD_TIMEOUT = 10
MAX_PDF_BYTES = 10 * 1024 * 1024  # 10MB


def _assert_allowed_host(pdf_url: str):
    host = urlparse(pdf_url).hostname or ""
    if host != ALLOWED_RESUME_HOST and not host.endswith(f".{ALLOWED_RESUME_HOST}"):
        raise ValueError(f"Refusing to fetch resume from disallowed host: {host}")


def extract_text_from_pdf_url(pdf_url: str) -> str:
    _assert_allowed_host(pdf_url)

    response = requests.get(pdf_url, timeout=DOWNLOAD_TIMEOUT, stream=True)
    response.raise_for_status()

    content_length = response.headers.get("Content-Length")
    if content_length and int(content_length) > MAX_PDF_BYTES:
        raise ValueError("Resume file is too large")

    buffer = BytesIO()
    downloaded = 0
    for chunk in response.iter_content(chunk_size=8192):
        downloaded += len(chunk)
        if downloaded > MAX_PDF_BYTES:
            raise ValueError("Resume file is too large")
        buffer.write(chunk)

    buffer.seek(0)
    text = ""
    with pdfplumber.open(buffer) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"

    return text.strip()
