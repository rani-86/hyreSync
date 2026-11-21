# HireSync

An AI-powered hiring platform connecting recruiters and candidates — with hybrid resume-to-job fit scoring, LLM-generated match explanations, and single-call job recommendations, all designed to run entirely on free-tier infrastructure.

**Live app:** [hyre-sync-rouge.vercel.app](https://hyre-sync-rouge.vercel.app)
**API:** [hyresync-xw1w.onrender.com](https://hyresync-xw1w.onrender.com)

> Free-tier hosting: the backend and ML service spin down after inactivity and can take ~50s to wake up on first request. If it looks slow on first load, give it a moment.

---

## What it does

HireSync has two sides:

- **Recruiters** post job listings, review applicants, see each candidate's AI-computed fit score with a structured, plain-language explanation, and accept or reject applications.
- **Candidates** browse listings, upload a resume, apply to jobs, get a ranked list of recommended jobs with a breakdown of *why* each one matched, and track the status of every application.

The core differentiator: every application is scored once (not on every page load) against the job description using a hybrid ML pipeline — lexical TF-IDF, semantic embeddings, and direct skill overlap — and an LLM generates a short, structured, honest explanation of why the candidate does or doesn't look like a strong fit.

---

## Features

- JWT authentication with role-based access (recruiter / candidate)
- Email verification (real email delivery) — gates posting and applying, doesn't block login or browsing
- Forgot / reset password with anti-enumeration protection, single-use expiring tokens (hashed at rest), and rate limiting
- Strong password policy enforced on both client and server, with live feedback
- Job posting CRUD, ownership-enforced (only the posting recruiter can edit or delete their own listings); deleting a job cascades to its applications
- Resume upload and storage (Cloudinary); text extracted and embedded once at upload time, not re-downloaded per score
- Job applications with duplicate prevention (database-level unique constraint, not just app-level logic)
- Recruiter can accept / reject applicants; candidates see status updates immediately
- **Hybrid fit scoring** — semantic (embedding cosine) + lexical (corpus-fit TF-IDF) + skill overlap, computed once per application and cached, not recomputed on every recruiter page load
- **Structured LLM match explanations** (Groq / Llama 3.3, JSON mode + Pydantic validation) — summary, matched/missing skills, and a strong/possible/weak-fit recommendation, grounded in the actual resume and job text
- **Single-call job recommendations** — one batched ml-service request ranks every job for a candidate, with a per-signal score breakdown shown in the UI
- Fully responsive, custom-designed UI — no component library, a from-scratch design system
- Client-side route guarding by role, on top of server-side authorization (defense in depth)
- SSRF-guarded resume fetching, internal-service auth, CORS locked to the deployed client, and no stack traces/error internals leaked to clients

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT, bcrypt |
| ML Service | Python, FastAPI, scikit-learn (TF-IDF), pdfplumber |
| Embeddings | Google Gemini embeddings API (hosted, HTTP-only — no local model) |
| GenAI | Groq API (Llama 3.3), JSON mode + Pydantic schema validation |
| File storage | Cloudinary |
| Email | Resend (HTTP API) |
| Testing | pytest (ml-service), Jest + Supertest + mongodb-memory-server (server) |
| CI | GitHub Actions |
| Hosting | Vercel (frontend), Render (backend + ML service), MongoDB Atlas (M0) |

---

## Architecture

```
hiresync/
├── client/          React frontend (Vite)
├── server/          Node/Express API — auth, jobs, applications, resumes, scoring orchestration
└── ml-service/      Python FastAPI microservice — resume parsing, embeddings, hybrid fit scoring, LLM explanations
```

The Node backend and Python ML service are independently deployed and communicate over HTTP, authenticated with a shared `ML_INTERNAL_KEY` header in both directions. This polyglot split exists because Python's ecosystem (scikit-learn, pdfplumber) is better suited to the ML/text-processing work than Node, while Express is a better fit for the CRUD/auth layer.

```
 Vercel (React)
      │
      ▼
 Render (Node/Express) ──► MongoDB Atlas (jobs, users, applications + embeddings)
      │  │              └──► Cloudinary (resumes)
      │  │
      │  └──► POST /index/rebuild, /fit-score, /embed, /recommend, /extract-resume-text
      ▼
 Render (Python/FastAPI) ──► Groq API (LLM explanations, JSON mode)
      │
      └──► Google Gemini embeddings API (semantic signal; optional)
```

**Scoring flow:** a candidate applies → the server responds `201` immediately → fit scoring happens in the background (ml-service call with retry) → the result (score, structured explanation, breakdown) is persisted on the `Application` document. The recruiter's applicants view is a plain, pre-sorted DB read — it never calls the ML service on a read path. Rescoring is triggered only when the job description changes or the candidate re-uploads a resume.

**Recommendation flow:** instead of one HTTP request per job (the old `/recommend-score` approach), the server sends the candidate's profile/resume once to a single `POST /recommend` call, which ranks every job server-side and returns the top-k with a score breakdown.

---

## Hybrid fit scoring

Defined in [`ml-service/hybrid_scorer.py`](ml-service/hybrid_scorer.py). Three signals, each 0-100, combined with fixed weights:

| Signal | Weight | What it measures | Source |
|---|---|---|---|
| Semantic | 0.5 | Meaning-level similarity (catches synonyms/paraphrase a keyword match misses) | Cosine similarity of Gemini embeddings |
| Lexical | 0.3 | Precise keyword/term overlap | TF-IDF cosine, fit on the **full job corpus** (not just the one resume/JD pair) |
| Skills | 0.2 | Direct, interpretable match against explicit requirements | `job.skillsRequired` vs. candidate skills + resume text |

If a signal can't be computed — no `GEMINI_API_KEY`, a failed embeddings call, or a job with no listed skills — its weight is dropped and the remaining weights are renormalized to sum to 1, rather than silently dragging the score toward zero. The `scoringMethod` field on each `Application` records exactly which signals were used (e.g. `hybrid(lexical+skills)` when semantic was unavailable).

The lexical signal itself was a correctness fix: the original implementation fit a fresh `TfidfVectorizer` on just `[resume, job_description]` per comparison, which makes IDF (inverse document frequency) meaningless — every term appears in exactly one or two "documents". It's now fit once on the full corpus of job postings ([`ml-service/corpus_index.py`](ml-service/corpus_index.py)), with a lazy rebuild/pull if the service restarts with an empty index (Render free tier spins down on inactivity).

---

## Free-tier design decisions

Every ML/LLM choice here was constrained to run on Render's free tier (512MB RAM) and free API quotas — documented so the trade-offs are explicit rather than accidental:

- **No local embedding model.** Sentence-transformers / PyTorch need 300MB+ RAM at idle alone, which doesn't fit in 512MB alongside the rest of the app. Embeddings instead come from the hosted Gemini embeddings API over plain HTTP — no model weights loaded into the process. Measured idle RSS for the whole ml-service: **~139MB**.
- **Graceful degradation, not a hard dependency.** If `GEMINI_API_KEY` is unset or the API call fails, scoring falls back to lexical TF-IDF + skill overlap only (renormalized weights) — the app keeps working with a slightly less informative score rather than failing requests.
- **LLM calls are minimal and off the read path.** Groq is called once per application, in the background, when the application is created or needs rescoring — never when a recruiter loads the applicants page. Responses go through JSON mode + Pydantic validation with one retry, falling back to a safe default rather than ever leaving a request hanging on a flaky model response.
- **Similarity math in Python with numpy**, not a vector database — at this app's scale (hundreds of jobs, not millions), a DB-side vector index would be solving a problem that doesn't exist yet, and MongoDB Atlas M0 doesn't support paid vector search features anyway.

---

## Evaluation

A 40-pair labelled dataset (8 synthetic jobs, 10 synthetic resumes) compares three scoring methods — see [`ml-service/eval/`](ml-service/eval/) and the full write-up in [`ml-service/eval/results.md`](ml-service/eval/results.md).

| Method | Precision@5 | Recall@5 | MRR |
|---|---|---|---|
| Old pairwise TF-IDF | 0.380 | 0.950 | 1.000 |
| Corpus-fit TF-IDF | 0.380 | 0.950 | 1.000 |
| Hybrid (lexical + skills) | 0.380 | 0.950 | 1.000 |

These are the real, measured numbers — not fabricated. They tie in aggregate on this small set (every method already ranks the single best match first), but the per-resume rankings genuinely differ: hybrid's skill-overlap signal fixes one true-positive miss and introduces a different one from a coincidental keyword overlap. The full breakdown, including exactly which resume/job pairs flip and why, is in `eval/results.md`. Run it yourself:

```bash
cd ml-service
python eval/run_eval.py
```

(No `GEMINI_API_KEY` needed — the eval's "hybrid" is lexical+skills only, so it runs offline and deterministically.)

---

## Running locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- A MongoDB Atlas connection string
- A Cloudinary account
- A Groq API key
- A [Resend](https://resend.com) API key (for email sending)
- Optional: a Gemini API key (for the semantic scoring signal — the app works without one)

### Backend
```bash
cd server
npm install
cp .env.example .env   # fill in your own values
npm run dev
```

### ML Service
```bash
cd ml-service
python -m venv venv
source venv/Scripts/activate    # Windows (Git Bash)
# or: source venv/bin/activate  # macOS/Linux
pip install -r requirements.txt
cp .env.example .env   # fill in GROQ_API_KEY, ML_INTERNAL_KEY, etc.
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev
```

### Environment variables

New since the matching-v2 upgrade (see each service's `.env.example` for the full list):

| Variable | Service | Purpose |
|---|---|---|
| `ML_INTERNAL_KEY` | both | Shared secret sent as `X-Internal-Key`; required on all non-health ml-service routes |
| `SERVER_URL` | ml-service | Lets ml-service lazily pull the job corpus from the server after a restart |
| `ALLOWED_RESUME_HOST` | ml-service | SSRF guard — only fetch resume PDFs from this host (defaults to `res.cloudinary.com`) |
| `GEMINI_API_KEY` | ml-service | Optional; enables the semantic scoring signal. Falls back to lexical+skills if unset |

---

## Running tests

```bash
# server (Jest + Supertest + mongodb-memory-server, no real DB/network needed)
cd server
npm test

# ml-service (pytest, Groq/embeddings mocked, no network calls)
cd ml-service
pip install -r requirements-dev.txt
pytest
```

Both run automatically on every push/PR via [`.github/workflows/test.yml`](.github/workflows/test.yml).

---

## Author

Rani Sharma — [GitHub](https://github.com/rani-86) · [LinkedIn](https://www.linkedin.com/in/rani-sharma-6b90b527b/)
