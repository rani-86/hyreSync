from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

from corpus_index import corpus_index


def compute_fit_score_pairwise(resume_text: str, job_description: str) -> float:
    """Legacy scoring: fits TF-IDF on just [resume, job] with no real corpus, so IDF
    is meaningless (every term appears in exactly 1 or 2 "documents"). Kept only as
    a fallback when the corpus index has no entry for this job, and for the eval
    comparison in ml-service/eval/."""
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform([resume_text, job_description])
    similarity = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])
    score = similarity[0][0]
    return round(float(score) * 100, 2)


def compute_fit_score(resume_text: str, job_description: str, job_id: str | None = None) -> tuple[float, str]:
    """Scores `resume_text` against a job. Prefers the corpus-fit index (accurate
    IDF) when the job is indexed; falls back to pairwise TF-IDF otherwise.

    Returns (score, scoring_method).
    """
    if job_id is not None:
        corpus_score = corpus_index.score_against_job(resume_text, job_id)
        if corpus_score is not None:
            return corpus_score, "corpus_tfidf"

    return compute_fit_score_pairwise(resume_text, job_description), "pairwise_tfidf"
