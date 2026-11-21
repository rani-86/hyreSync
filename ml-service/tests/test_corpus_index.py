from corpus_index import CorpusIndex


def test_not_ready_before_fit():
    index = CorpusIndex()
    assert not index.is_ready()
    assert index.score_against_job("some resume text", "job-1") is None


def test_fit_indexes_all_jobs_and_scores_against_corpus():
    index = CorpusIndex()
    count = index.fit(
        [
            {"id": "job-py", "text": "Python backend engineer FastAPI MongoDB"},
            {"id": "job-react", "text": "React frontend developer Redux TailwindCSS"},
        ]
    )
    assert count == 2
    assert index.is_ready()
    assert index.has_job("job-py")
    assert not index.has_job("job-missing")

    score = index.score_against_job("Experienced Python developer with FastAPI and MongoDB", "job-py")
    assert score is not None
    assert 0 <= score <= 100

    # A resume should score higher against the job it actually matches.
    react_score = index.score_against_job("Experienced Python developer with FastAPI and MongoDB", "job-react")
    assert score > react_score


def test_score_against_unknown_job_returns_none():
    index = CorpusIndex()
    index.fit([{"id": "job-py", "text": "Python backend engineer"}])
    assert index.score_against_job("some resume", "job-unknown") is None


def test_fit_with_empty_corpus():
    index = CorpusIndex()
    count = index.fit([])
    assert count == 0
    assert not index.is_ready()


def test_fit_skips_blank_documents():
    index = CorpusIndex()
    count = index.fit([{"id": "job-1", "text": "Python engineer"}, {"id": "job-2", "text": "   "}])
    assert count == 1
    assert index.has_job("job-1")
    assert not index.has_job("job-2")
