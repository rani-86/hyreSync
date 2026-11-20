import json
import os
from typing import Literal

from groq import Groq
from pydantic import BaseModel

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

MODEL = "llama-3.3-70b-versatile"
MAX_ATTEMPTS = 2
RESUME_CHAR_LIMIT = 2000
JOB_CHAR_LIMIT = 3000


class FitExplanation(BaseModel):
    summary: str
    matched_skills: list[str]
    missing_skills: list[str]
    recommendation: Literal["strong_fit", "possible_fit", "weak_fit"]


def _fallback_explanation(fit_score: float) -> FitExplanation:
    if fit_score >= 40:
        recommendation = "strong_fit"
    elif fit_score >= 15:
        recommendation = "possible_fit"
    else:
        recommendation = "weak_fit"
    return FitExplanation(
        summary="An automated explanation couldn't be generated for this candidate right now.",
        matched_skills=[],
        missing_skills=[],
        recommendation=recommendation,
    )


def _build_prompt(resume_text: str, job_description: str, fit_score: float) -> str:
    return f"""You are helping a recruiter understand a candidate's fit for a role.
Ground every statement ONLY in the job description and resume text below — never invent
skills or experience that aren't actually present in them.

Job description:
{job_description}

Candidate's resume (extracted text):
{resume_text}

The candidate's computed fit score is {fit_score}/100 (keyword/term overlap, not semantic meaning).

Respond with ONLY a JSON object matching exactly this schema, no other text:
{{
  "summary": "2-3 sentence plain-language explanation of the fit, without repeating the numeric score",
  "matched_skills": ["skill mentioned in both the resume and job description", "..."],
  "missing_skills": ["skill the job asks for that the resume doesn't show", "..."],
  "recommendation": "strong_fit" | "possible_fit" | "weak_fit"
}}"""


def generate_fit_explanation(resume_text: str, job_description: str, fit_score: float) -> dict:
    prompt = _build_prompt(resume_text[:RESUME_CHAR_LIMIT], job_description[:JOB_CHAR_LIMIT], fit_score)

    for _ in range(MAX_ATTEMPTS):
        try:
            response = client.chat.completions.create(
                model=MODEL,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=300,
                response_format={"type": "json_object"},
            )
            raw = response.choices[0].message.content
            parsed = FitExplanation.model_validate(json.loads(raw))
            return parsed.model_dump()
        except Exception:
            continue

    return _fallback_explanation(fit_score).model_dump()
