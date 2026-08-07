from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel
from resume_parser import extract_text_from_pdf_url
from fit_scorer import compute_fit_score
from llm_explainer import generate_fit_explanation

app = FastAPI()

class FitScoreRequest(BaseModel):
    resume_url: str
    job_description: str

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "hiresync-ml-service"}

@app.post("/fit-score")
def get_fit_score(payload: FitScoreRequest):
    resume_text = extract_text_from_pdf_url(payload.resume_url)
    score = compute_fit_score(resume_text, payload.job_description)
    explanation = generate_fit_explanation(resume_text, payload.job_description, score)
    return {"fit_score": score, "explanation": explanation}


class RecommendationRequest(BaseModel):
    profile_text: str
    job_description: str

@app.post("/recommend-score")
def get_recommendation_score(payload: RecommendationRequest):
    score = compute_fit_score(payload.profile_text, payload.job_description)
    return {"score": score}