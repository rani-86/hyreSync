from hybrid_scorer import WEIGHTS, compute_hybrid_score, compute_skill_overlap


def test_skill_overlap_full_match():
    score = compute_skill_overlap(
        job_skills=["Python", "Django"],
        candidate_skills=["python", "django", "aws"],
        resume_text="",
    )
    assert score == 100.0


def test_skill_overlap_partial_match_falls_back_to_resume_text():
    score = compute_skill_overlap(
        job_skills=["Python", "Kubernetes"],
        candidate_skills=["python"],
        resume_text="I have experience with kubernetes clusters",
    )
    assert score == 100.0


def test_skill_overlap_no_job_skills_returns_none():
    assert compute_skill_overlap([], ["python"], "some resume") is None


def test_hybrid_score_uses_all_signals_when_available():
    score, breakdown, method = compute_hybrid_score(
        resume_text="Experienced Python developer with FastAPI and MongoDB",
        resume_embedding=[1.0, 0.0, 0.0],
        job_text="Python backend engineer FastAPI MongoDB",
        job_embedding=[1.0, 0.0, 0.0],
        job_id=None,
        job_skills=["Python", "FastAPI", "MongoDB"],
        candidate_skills=["Python", "MongoDB"],
    )
    assert set(breakdown.keys()) == {"semantic", "lexical", "skills"}
    assert method == "hybrid(lexical+semantic+skills)"
    assert breakdown["semantic"] == 100.0  # identical embeddings -> cosine 1.0
    assert 0 <= score <= 100


def test_hybrid_score_falls_back_when_embeddings_missing():
    score, breakdown, method = compute_hybrid_score(
        resume_text="Experienced Python developer with FastAPI and MongoDB",
        resume_embedding=None,
        job_text="Python backend engineer FastAPI MongoDB",
        job_embedding=None,
        job_id=None,
        job_skills=["Python", "FastAPI"],
        candidate_skills=["Python"],
    )
    assert "semantic" not in breakdown
    assert set(breakdown.keys()) == {"lexical", "skills"}
    assert method == "hybrid(lexical+skills)"
    assert 0 <= score <= 100


def test_hybrid_score_falls_back_when_job_has_no_required_skills():
    score, breakdown, method = compute_hybrid_score(
        resume_text="Experienced Python developer",
        resume_embedding=None,
        job_text="Python backend engineer",
        job_embedding=None,
        job_id=None,
        job_skills=[],
        candidate_skills=["Python"],
    )
    assert "skills" not in breakdown
    assert method == "hybrid(lexical)"


def test_weights_sum_to_one():
    assert round(sum(WEIGHTS.values()), 6) == 1.0
