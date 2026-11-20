from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class CorpusIndex:
    """TF-IDF index fit on the full corpus of job documents (title + description + skills).

    Fitting on just a resume/job pair makes IDF meaningless (IDF needs a real corpus
    to tell common words from distinctive ones). This index is fit once on every job
    in the system and reused for every resume comparison, so IDF weights reflect
    actual term rarity across postings.
    """

    def __init__(self):
        self.vectorizer = None
        self.matrix = None
        self._row_by_job_id = {}

    def fit(self, jobs: list[dict]) -> int:
        jobs = [j for j in jobs if j.get("text", "").strip()]
        if not jobs:
            self.vectorizer = None
            self.matrix = None
            self._row_by_job_id = {}
            return 0

        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
        )
        self.matrix = self.vectorizer.fit_transform([j["text"] for j in jobs])
        self._row_by_job_id = {j["id"]: i for i, j in enumerate(jobs)}
        return len(jobs)

    def is_ready(self) -> bool:
        return self.vectorizer is not None and self.matrix is not None and len(self._row_by_job_id) > 0

    def has_job(self, job_id: str) -> bool:
        return job_id in self._row_by_job_id

    def score_against_job(self, text: str, job_id: str) -> float | None:
        """Cosine similarity (0-100) between `text` and the indexed job, using the
        corpus-fit vectorizer. Returns None if the index isn't ready or the job
        isn't in it (caller should fall back to pairwise TF-IDF in that case)."""
        if not self.is_ready() or job_id not in self._row_by_job_id:
            return None
        vec = self.vectorizer.transform([text])
        job_vec = self.matrix[self._row_by_job_id[job_id]]
        similarity = cosine_similarity(vec, job_vec)[0][0]
        return round(float(similarity) * 100, 2)

    def job_count(self) -> int:
        return len(self._row_by_job_id)


corpus_index = CorpusIndex()
