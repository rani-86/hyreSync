from unittest.mock import patch

import pytest
from fastapi.testclient import TestClient

import main
from corpus_index import corpus_index

INTERNAL_KEY = "test-internal-key"
HEADERS = {"x-internal-key": INTERNAL_KEY}


@pytest.fixture(autouse=True)
def reset_corpus_index():
    # The corpus index is a module-level singleton shared across requests;
    # reset it between tests so one test's /index/rebuild can't leak into another.
    corpus_index.fit([])
    yield
    corpus_index.fit([])


@pytest.fixture
def client():
    return TestClient(main.app)


def test_health_check_requires_no_auth(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


@pytest.mark.parametrize(
    "path,body",
    [
        ("/index/rebuild", {"jobs": []}),
        ("/embed", {"text": "hello"}),
        ("/fit-score", {"resume_text": "x", "job_description": "y"}),
        ("/recommend", {"jobs": []}),
        ("/extract-resume-text", {"resume_url": "https://res.cloudinary.com/x.pdf"}),
    ],
)
def test_protected_routes_reject_missing_or_wrong_key(client, path, body):
    resp_missing = client.post(path, json=body)
    assert resp_missing.status_code == 401

    resp_wrong = client.post(path, json=body, headers={"x-internal-key": "wrong-key"})
    assert resp_wrong.status_code == 401


def test_index_rebuild_with_correct_key(client):
    resp = client.post(
        "/index/rebuild",
        json={"jobs": [{"id": "job-1", "text": "Python backend engineer"}]},
        headers=HEADERS,
    )
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "jobs_indexed": 1}


def test_embed_returns_unavailable_without_gemini_key(client):
    # GEMINI_API_KEY is unset in the test environment, so embeddings must be
    # unavailable rather than erroring — this is the required fallback behavior.
    resp = client.post("/embed", json={"text": "some resume text"}, headers=HEADERS)
    assert resp.status_code == 200
    assert resp.json() == {"embedding": None, "method": "unavailable"}


def test_fit_score_requires_resume_text_or_url(client):
    resp = client.post("/fit-score", json={"job_description": "a job"}, headers=HEADERS)
    assert resp.status_code == 400


@patch("main.generate_fit_explanation")
def test_fit_score_with_resume_text_returns_breakdown(mock_explain, client):
    mock_explain.return_value = {
        "summary": "ok",
        "matched_skills": [],
        "missing_skills": [],
        "recommendation": "possible_fit",
    }
    resp = client.post(
        "/fit-score",
        json={
            "resume_text": "Python developer with Django experience",
            "job_description": "Looking for a Python developer",
            "job_skills": ["Python"],
            "candidate_skills": ["Python"],
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "fit_score" in data
    assert "lexical" in data["breakdown"]
    assert data["scoring_method"].startswith("hybrid(")


@patch("main.generate_fit_explanation")
def test_recommend_ranks_jobs_in_one_call(mock_explain, client):
    mock_explain.return_value = {"summary": "ok", "matched_skills": [], "missing_skills": [], "recommendation": "possible_fit"}
    resp = client.post(
        "/recommend",
        json={
            "resume_text": "Experienced Python developer with Django and PostgreSQL",
            "candidate_skills": ["Python", "Django"],
            "jobs": [
                {
                    "id": "job-py",
                    "title": "Backend Engineer",
                    "description": "Python Django PostgreSQL backend role",
                    "skills_required": ["Python", "Django"],
                },
                {
                    "id": "job-react",
                    "title": "Frontend Engineer",
                    "description": "React TypeScript frontend role",
                    "skills_required": ["React", "TypeScript"],
                },
            ],
            "top_k": 5,
        },
        headers=HEADERS,
    )
    assert resp.status_code == 200
    results = resp.json()["results"]
    assert len(results) == 2
    assert results[0]["job_id"] == "job-py"  # should rank the matching job first
    assert results[0]["score"] > results[1]["score"]
    assert "breakdown" in results[0]
