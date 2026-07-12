import os
from groq import Groq

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

def generate_fit_explanation(resume_text: str, job_description: str, fit_score: float) -> str:
    prompt = f"""You are helping a recruiter understand a candidate's fit for a role.

Job description:
{job_description}

Candidate's resume (extracted text):
{resume_text[:2000]}

The candidate's computed fit score is {fit_score}/100 (based on semantic similarity).

In 2-3 sentences, explain in plain language why this candidate does or doesn't seem like a strong fit. Be specific about matching or missing skills where possible. Do not repeat the numeric score in your answer."""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=200,
    )

    return response.choices[0].message.content.strip()