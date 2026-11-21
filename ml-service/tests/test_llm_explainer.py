import json
from unittest.mock import MagicMock, patch

from llm_explainer import generate_fit_explanation


def _mock_response(content: str):
    response = MagicMock()
    response.choices = [MagicMock(message=MagicMock(content=content))]
    return response


def test_valid_json_is_parsed_and_validated():
    valid_payload = json.dumps(
        {
            "summary": "Strong overlap with the job's core requirements.",
            "matched_skills": ["Python", "FastAPI"],
            "missing_skills": ["Kubernetes"],
            "recommendation": "strong_fit",
        }
    )
    with patch("llm_explainer.client.chat.completions.create", return_value=_mock_response(valid_payload)) as mock_create:
        result = generate_fit_explanation("resume text", "job description", 72.5)

    assert result["recommendation"] == "strong_fit"
    assert result["matched_skills"] == ["Python", "FastAPI"]
    assert result["missing_skills"] == ["Kubernetes"]
    mock_create.assert_called_once()


def test_invalid_json_retries_once_then_falls_back():
    with patch("llm_explainer.client.chat.completions.create", return_value=_mock_response("not json")) as mock_create:
        result = generate_fit_explanation("resume text", "job description", 10.0)

    assert mock_create.call_count == 2  # one retry
    assert result["recommendation"] == "weak_fit"  # fallback derived from low score
    assert result["matched_skills"] == []
    assert result["missing_skills"] == []


def test_schema_violation_falls_back():
    bad_schema_payload = json.dumps(
        {
            "summary": "ok",
            "matched_skills": "not a list",  # wrong type
            "missing_skills": [],
            "recommendation": "strong_fit",
        }
    )
    with patch("llm_explainer.client.chat.completions.create", return_value=_mock_response(bad_schema_payload)):
        result = generate_fit_explanation("resume text", "job description", 25.0)

    assert result["recommendation"] == "possible_fit"  # fallback derived from mid score


def test_api_error_falls_back_without_raising():
    with patch("llm_explainer.client.chat.completions.create", side_effect=RuntimeError("Groq API down")):
        result = generate_fit_explanation("resume text", "job description", 80.0)

    assert result["recommendation"] == "strong_fit"
    assert "couldn't be generated" in result["summary"]
