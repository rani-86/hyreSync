from fastapi import FastAPI
from pydantic import BaseModel
from resume_parser import extract_text_from_pdf_url
from fit_scorer import compute_fit_score

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
    return {"fit_score": score}