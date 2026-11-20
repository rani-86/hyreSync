"""Compares three scoring methods on a small labelled resume/job dataset:

  (a) Old pairwise TF-IDF  — the original per-pair fit (fit_scorer.compute_fit_score_pairwise)
  (b) Corpus-fit TF-IDF    — TF-IDF fit once on the full job corpus (corpus_index)
  (c) Hybrid               — corpus TF-IDF + skill overlap, renormalised

No embeddings/network calls are made here (so the eval runs offline and
deterministically without a GEMINI_API_KEY) — the hybrid score below is
lexical+skills only, which isolates how much the skill-overlap signal adds
over lexical TF-IDF alone. Real deployments also get the semantic signal.

Run from ml-service/: python eval/run_eval.py
"""

import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from corpus_index import CorpusIndex  # noqa: E402
from fit_scorer import compute_fit_score_pairwise  # noqa: E402
from hybrid_scorer import compute_hybrid_score  # noqa: E402

K = 5


def load_dataset():
    path = os.path.join(os.path.dirname(__file__), "dataset.json")
    with open(path) as f:
        return json.load(f)


def job_text(job):
    return f"{job['title']} {job['description']} {' '.join(job['skills_required'])}"


def relevant_job_ids(labels, resume_id):
    return {label["job_id"] for label in labels if label["resume_id"] == resume_id and label["relevant"]}


def rank_jobs(score_fn, jobs):
    scored = [(job["id"], score_fn(job)) for job in jobs]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [job_id for job_id, _ in scored]


def precision_at_k(ranked, relevant, k):
    top_k = ranked[:k]
    return sum(1 for job_id in top_k if job_id in relevant) / k


def recall_at_k(ranked, relevant, k):
    top_k = ranked[:k]
    return sum(1 for job_id in top_k if job_id in relevant) / len(relevant)


def reciprocal_rank(ranked, relevant):
    for i, job_id in enumerate(ranked, start=1):
        if job_id in relevant:
            return 1 / i
    return 0.0


def evaluate(method_name, score_fn_builder, dataset):
    jobs = dataset["jobs"]
    labels = dataset["labels"]

    precisions, recalls, mrrs = [], [], []
    for resume in dataset["resumes"]:
        relevant = relevant_job_ids(labels, resume["id"])
        if not relevant:
            continue
        score_fn = score_fn_builder(resume)
        ranked = rank_jobs(score_fn, jobs)
        precisions.append(precision_at_k(ranked, relevant, K))
        recalls.append(recall_at_k(ranked, relevant, K))
        mrrs.append(reciprocal_rank(ranked, relevant))

    return {
        "method": method_name,
        "precision@5": sum(precisions) / len(precisions),
        "recall@5": sum(recalls) / len(recalls),
        "mrr": sum(mrrs) / len(mrrs),
    }


def build_pairwise_scorer(resume):
    def score_fn(job):
        return compute_fit_score_pairwise(resume["text"], job_text(job))

    return score_fn


def build_corpus_scorer(corpus_index):
    def builder(resume):
        def score_fn(job):
            score = corpus_index.score_against_job(resume["text"], job["id"])
            return score if score is not None else 0.0

        return score_fn

    return builder


def build_hybrid_scorer(resume):
    def score_fn(job):
        score, _, _ = compute_hybrid_score(
            resume_text=resume["text"],
            resume_embedding=None,
            job_text=job_text(job),
            job_embedding=None,
            job_id=job["id"],
            job_skills=job["skills_required"],
            candidate_skills=resume["skills"],
        )
        return score

    return score_fn


def main():
    dataset = load_dataset()
    jobs = dataset["jobs"]

    corpus_index = CorpusIndex()
    corpus_index.fit([{"id": job["id"], "text": job_text(job)} for job in jobs])

    results = [
        evaluate("Old pairwise TF-IDF", build_pairwise_scorer, dataset),
        evaluate("Corpus-fit TF-IDF", build_corpus_scorer(corpus_index), dataset),
        evaluate("Hybrid (lexical + skills)", build_hybrid_scorer, dataset),
    ]

    header = "| Method | Precision@5 | Recall@5 | MRR |"
    sep = "|---|---|---|---|"
    rows = [
        f"| {r['method']} | {r['precision@5']:.3f} | {r['recall@5']:.3f} | {r['mrr']:.3f} |" for r in results
    ]
    table = "\n".join([header, sep] + rows)

    print(table)

    results_path = os.path.join(os.path.dirname(__file__), "results.md")
    with open(results_path, "w") as f:
        f.write("# Matching eval results\n\n")
        f.write(
            f"Dataset: {len(jobs)} jobs, {len(dataset['resumes'])} resumes, "
            f"{len(dataset['labels'])} labelled resume-job pairs.\n\n"
        )
        f.write(
            "Hybrid here is lexical + skills only (no embeddings/network calls, "
            "so this eval runs offline without a GEMINI_API_KEY).\n\n"
        )
        f.write(table + "\n")

    print(f"\nWrote {results_path}")


if __name__ == "__main__":
    main()
