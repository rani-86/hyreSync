# Matching eval results

Dataset: 8 jobs, 10 resumes, 40 labelled resume-job pairs.

Hybrid here is lexical + skills only (no embeddings/network calls, so this eval runs offline without a GEMINI_API_KEY).

| Method | Precision@5 | Recall@5 | MRR |
|---|---|---|---|
| Old pairwise TF-IDF | 0.380 | 0.950 | 1.000 |
| Corpus-fit TF-IDF | 0.380 | 0.950 | 1.000 |
| Hybrid (lexical + skills) | 0.380 | 0.950 | 1.000 |

## Observations

The aggregate metrics tie across all three methods on this dataset — not because
the methods rank identically, but because at this small scale (8 jobs, 2
relevant per resume) every method already ranks the single best-matching job
first, which alone fixes MRR at 1.000 for all three. Precision@5/Recall@5 tie
in aggregate too, but for a more interesting reason: per-resume rankings
genuinely differ between methods, and the differences roughly cancel out:

- **Corpus-fit TF-IDF vs. old pairwise**: re-fitting TF-IDF on the real job
  corpus (instead of a meaningless 2-document fit) changes relative term
  weights, which reorders the bottom of several rankings, but doesn't change
  which jobs land in the top 5 for any resume here — the dataset's jobs are
  textually distinct enough that both get the obviously-relevant jobs right.
  The corpus fit is still the methodologically correct one (see Phase 1); this
  dataset is just too easy to show a precision/recall gap from it alone.
- **Hybrid vs. corpus-fit**: adding skill overlap *fixes* resume-1
  (`resume-1-python-backend`): `job-devops` is a true positive that both
  TF-IDF variants rank 6th-7th (missing top-5), but hybrid's direct skill-match
  bonus (AWS, Docker, Python all appear in both) pulls it into the top 5.
  It simultaneously *breaks* resume-2 (`resume-2-react-frontend`): a shared
  "JavaScript" keyword with `job-qa-automation`'s skill list is enough to
  outrank the true positive `job-product-designer`, which has no literal
  skill overlap with that resume's declared skills. One fix, one new miss —
  net zero on this 10-resume sample.

Takeaway: skill-overlap is a double-edged signal — great when the candidate's
declared skills genuinely match, misleading when a single generic keyword
(like a language name) coincidentally overlaps with an unrelated job. This is
exactly why hybrid scoring weights it at only 0.2 and blends it with lexical
and (in production, with a GEMINI_API_KEY) semantic signals rather than using
it alone. A larger, noisier eval set would very likely separate the methods
more clearly; this 40-pair set is enough to prove the pipeline works
end-to-end and surface this real failure mode, not to make a statistically
strong superiority claim.
