import math
import os

import requests

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
EMBEDDING_MODEL = "gemini-embedding-001"
EMBEDDING_DIM = 768
EMBEDDING_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{EMBEDDING_MODEL}:embedContent"
TEXT_CHAR_LIMIT = 8000


def get_embedding(text: str) -> list[float] | None:
    """Hosted embedding via the Gemini API (plain HTTP, no local model — this
    service runs on a 512MB free tier). Returns None if GEMINI_API_KEY is unset,
    the text is empty, or the call fails for any reason; callers must treat that
    as "no semantic signal" and fall back to lexical/skill-based scoring."""
    if not GEMINI_API_KEY or not text.strip():
        return None
    try:
        resp = requests.post(
            EMBEDDING_URL,
            params={"key": GEMINI_API_KEY},
            json={
                "model": f"models/{EMBEDDING_MODEL}",
                "content": {"parts": [{"text": text[:TEXT_CHAR_LIMIT]}]},
                "outputDimensionality": EMBEDDING_DIM,
            },
            timeout=10,
        )
        resp.raise_for_status()
        return resp.json()["embedding"]["values"]
    except Exception:
        return None


def cosine_similarity(a: list[float] | None, b: list[float] | None) -> float | None:
    if not a or not b or len(a) != len(b):
        return None
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return None
    return dot / (norm_a * norm_b)
