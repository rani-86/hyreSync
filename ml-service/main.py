import os

from dotenv import load_dotenv
load_dotenv()

import requests
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

from resume_parser import extract_text_from_pdf_url
from hybrid_scorer import compute_hybrid_score
from llm_explainer import generate_fit_explanation
from corpus_index import corpus_index
from embeddings import get_embedding

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


def ensure_index_ready():
    if not corpus_index.is_ready():
        try:
            jobs = fetch_corpus_from_server()
            if jobs:
                corpus_index.fit(jobs)
        except Exception:
            pass


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
    resume_embedding: list[float] | None = None
    job_description: str
    job_id: str | None = None
    job_embedding: list[float] | None = None
    job_skills: list[str] = []
    candidate_skills: list[str] = []


class ExtractResumeTextRequest(BaseModel):
    resume_url: str


class EmbedRequest(BaseModel):
    text: str


class IndexRebuildRequest(BaseModel):
    jobs: list[dict]


class RecommendJobInput(BaseModel):
    id: str
    title: str
    description: str
    skills_required: list[str] = []
    embedding: list[float] | None = None


class RecommendRequest(BaseModel):
    profile_text: str = ""
    resume_text: str = ""
    resume_embedding: list[float] | None = None
    candidate_skills: list[str] = []
    jobs: list[RecommendJobInput]
    top_k: int = 20


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


@app.post("/embed")
def embed(payload: EmbedRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    embedding = get_embedding(payload.text)
    return {"embedding": embedding, "method": "gemini" if embedding is not None else "unavailable"}


@app.post("/fit-score")
def get_fit_score(payload: FitScoreRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)

    if not payload.resume_text and not payload.resume_url:
        raise HTTPException(status_code=400, detail="resume_text or resume_url is required")

    ensure_index_ready()

    # Prefer the cached, already-extracted text so we don't re-download/re-parse
    # the PDF on every score.
    resume_text = payload.resume_text or extract_text_from_pdf_url(payload.resume_url)

    score, breakdown, scoring_method = compute_hybrid_score(
        resume_text=resume_text,
        resume_embedding=payload.resume_embedding,
        job_text=payload.job_description,
        job_embedding=payload.job_embedding,
        job_id=payload.job_id,
        job_skills=payload.job_skills,
        candidate_skills=payload.candidate_skills,
    )
    explanation = generate_fit_explanation(resume_text, payload.job_description, score)
    return {
        "fit_score": score,
        "explanation": explanation,
        "scoring_method": scoring_method,
        "breakdown": breakdown,
    }


@app.post("/recommend")
def recommend(payload: RecommendRequest, x_internal_key: str | None = Header(default=None)):
    require_internal_key(x_internal_key)
    ensure_index_ready()

    resume_or_profile_text = payload.resume_text or payload.profile_text
    results = []
    for job in payload.jobs:
        job_text = f"{job.title} {job.description} {' '.join(job.skills_required)}"
        score, breakdown, scoring_method = compute_hybrid_score(
            resume_text=resume_or_profile_text,
            resume_embedding=payload.resume_embedding,
            job_text=job_text,
            job_embedding=job.embedding,
            job_id=job.id,
            job_skills=job.skills_required,
            candidate_skills=payload.candidate_skills,
        )
        results.append(
            {
                "job_id": job.id,
                "score": score,
                "breakdown": breakdown,
                "scoring_method": scoring_method,
            }
        )

    results.sort(key=lambda r: r["score"], reverse=True)
    return {"results": results[: payload.top_k]}
