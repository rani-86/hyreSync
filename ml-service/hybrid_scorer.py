from corpus_index import corpus_index
from embeddings import cosine_similarity
from fit_scorer import compute_fit_score_pairwise

# Weights for the hybrid fit score (must sum to 1).
#
# - semantic: cosine similarity between resume and job embeddings. Catches
#   meaning/synonyms a keyword match misses (e.g. "Postgres" vs "relational
#   database"), but costs an embeddings API call and can be unavailable.
# - lexical: TF-IDF cosine similarity over the job corpus. Catches precise
#   keyword/term overlap; always available, cheap, deterministic.
# - skills: direct overlap between the job's required skills and the
#   candidate's skills/resume text. Most literal and interpretable signal.
#
# When a signal can't be computed (no embeddings for this resume/job, or the
# job lists no required skills), its weight is dropped and the remaining
# weights are renormalised to sum to 1, so a missing signal never silently
# drags the score toward zero.
WEIGHTS = {
    "semantic": 0.5,
    "lexical": 0.3,
    "skills": 0.2,
}


def compute_skill_overlap(
    job_skills: list[str], candidate_skills: list[str], resume_text: str
) -> float | None:
    if not job_skills:
        return None
    candidate_lower = {s.lower() for s in candidate_skills}
    resume_lower = resume_text.lower()
    matched = sum(
        1
        for skill in job_skills
        if skill.lower() in candidate_lower or skill.lower() in resume_lower
    )
    return round(matched / len(job_skills) * 100, 2)


def compute_hybrid_score(
    resume_text: str,
    resume_embedding: list[float] | None,
    job_text: str,
    job_embedding: list[float] | None,
    job_id: str | None,
    job_skills: list[str],
    candidate_skills: list[str],
) -> tuple[float, dict, str]:
    """Returns (score 0-100, breakdown per signal, scoring_method label)."""
    components: dict[str, float] = {}

    semantic_sim = cosine_similarity(resume_embedding, job_embedding)
    if semantic_sim is not None:
        components["semantic"] = round(max(semantic_sim, 0.0) * 100, 2)

    lexical_score = corpus_index.score_against_job(resume_text, job_id) if job_id else None
    if lexical_score is None:
        lexical_score = compute_fit_score_pairwise(resume_text, job_text)
    components["lexical"] = lexical_score

    skills_score = compute_skill_overlap(job_skills, candidate_skills, resume_text)
    if skills_score is not None:
        components["skills"] = skills_score

    total_weight = sum(WEIGHTS[signal] for signal in components)
    if total_weight == 0:
        return 0.0, components, "hybrid()"

    score = sum(components[signal] * WEIGHTS[signal] for signal in components) / total_weight
    scoring_method = "hybrid(" + "+".join(sorted(components.keys())) + ")"
    return round(score, 2), components, scoring_method
