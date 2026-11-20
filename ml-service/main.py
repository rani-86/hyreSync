import os

from dotenv import load_dotenv
load_dotenv()

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from resume_parser import extract_text_from_pdf_url
from fit_scorer import compute_fit_score
from llm_explainer import generate_fit_explanation
from corpus_index import corpus_index

app = FastAPI()

ML_INTERNAL_KEY = os.environ.get("ML_INTERNAL_KEY")
SERVER_URL = os.environ.get("SERVER_URL")


def require_internal_key(x_internal_key: str | None = Header(default=None)):
    if ML_INTERNAL_KEY and x_internal_key != ML_INTERNAL_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing internal key")


def fetch_corpus_from_server() -> list[dict]:
    if not SERVER_URL:
        return []
    headers = {"x-internal-key": ML_INTERNAL_KEY} if ML_INTERNAL_KEY else {}
    resp = requests.get(f"{SERVER_URL}/api/internal/jobs-corpus", headers=headers, timeout=10)
    resp.raise_for_status()
    return resp.json().get("jobs", [])


@app.on_event("startup")
def lazy_rebuild_on_startup():
    try:
        jobs = fetch_corpus_from_server()
        if jobs:
            corpus_index.fit(jobs)
    except Exception:
        # No corpus yet, or server unreachable — index stays empty and scoring
        # falls back to pairwise TF-IDF until a rebuild arrives.
        pass


class FitScoreRequest(BaseModel):
    resume_url: str | None = None
    resume_text: str | None = None
    job_description: str
    job_id: str | None = None


class ExtractResumeTextRequest(BaseModel):
    resume_url: str


class RecommendationRequest(BaseModel):
    profile_text: str
    job_description: str
    job_id: str | None = None


class IndexRebuildRequest(BaseModel):
    jobs: list[dict]


@app.get("/health")
def health_check():
    return {"status": "ok", "service": "hiresync-ml-service"}


@app.post("/index/rebuild")
def rebuild_index(payload: IndexRebuildRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    count = corpus_index.fit(payload.jobs)
    return {"status": "ok", "jobs_indexed": count}


@app.post("/extract-resume-text")
def extract_resume_text(payload: ExtractResumeTextRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    text = extract_text_from_pdf_url(payload.resume_url)
    return {"text": text}


@app.post("/fit-score")
def get_fit_score(payload: FitScoreRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)

    if not payload.resume_text and not payload.resume_url:
        raise HTTPException(status_code=400, detail="resume_text or resume_url is required")

    if not corpus_index.is_ready():
        try:
            jobs = fetch_corpus_from_server()
            if jobs:
                corpus_index.fit(jobs)
        except Exception:
            pass

    # Prefer the cached, already-extracted text so we don't re-download/re-parse
    # the PDF on every score.
    resume_text = payload.resume_text or extract_text_from_pdf_url(payload.resume_url)
    score, scoring_method = compute_fit_score(resume_text, payload.job_description, payload.job_id)
    explanation = generate_fit_explanation(resume_text, payload.job_description, score)
    return {"fit_score": score, "explanation": explanation, "scoring_method": scoring_method}


@app.post("/recommend-score")
def get_recommendation_score(payload: RecommendationRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    score, scoring_method = compute_fit_score(payload.profile_text, payload.job_description, payload.job_id)
    return {"score": score, "scoring_method": scoring_method}
