# HireSync

An AI-powered hiring platform connecting recruiters and candidates — with resume-to-job fit scoring and plain-language match explanations powered by machine learning and an LLM.

**Live app:** [hyre-sync-rouge.vercel.app](https://hyre-sync-rouge.vercel.app)
**API:** [hyresync-xw1w.onrender.com](https://hyresync-xw1w.onrender.com)

> Free-tier hosting: the backend and ML service spin down after inactivity and can take ~50s to wake up on first request. If it looks slow on first load, give it a moment.

---

## What it does

HireSync has two sides:

- **Recruiters** post job listings, review applicants, see each candidate's AI-computed fit score with a plain-language explanation, and accept or reject applications.
- **Candidates** browse listings, upload a resume, apply to jobs, and track the status of every application they've submitted.

The core differentiator: every application is automatically scored against the job description using a real ML pipeline, and an LLM generates a short, honest explanation of why the candidate does or doesn't look like a strong fit — not just a bare number.

---

## Features

- JWT authentication with role-based access (recruiter / candidate)
- Email verification (real email delivery) — gates posting and applying, doesn't block login or browsing
- Forgot / reset password with anti-enumeration protection and single-use, expiring tokens
- Strong password policy enforced on both client and server, with live feedback
- Job posting CRUD, ownership-enforced (only the posting recruiter can edit or delete their own listings)
- Resume upload and storage (Cloudinary)
- Job applications with duplicate prevention (database-level unique constraint, not just app-level logic)
- Recruiter can accept / reject applicants; candidates see status updates immediately
- **ML-based fit scoring** — resume text extracted from the uploaded PDF, compared against the job description via TF-IDF and cosine similarity
- **LLM-generated match explanations** (Groq / Llama 3.3) — plain-language reasoning grounded in the actual resume content
- Fully responsive, custom-designed UI — no component library, a from-scratch design system
- Client-side route guarding by role, on top of server-side authorization (defense in depth)

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React (Vite), React Router, Axios |
| Backend | Node.js, Express, MongoDB (Mongoose) |
| Auth | JWT, bcrypt |
| ML Service | Python, FastAPI, scikit-learn (TF-IDF), pdfplumber |
| GenAI | Groq API (Llama 3.3) |
| File storage | Cloudinary |
| Email | Nodemailer (Gmail SMTP) |
| Hosting | Vercel (frontend), Render (backend + ML service), MongoDB Atlas |

---

## Architecture

```
hiresync/
├── client/          React frontend (Vite)
├── server/          Node/Express API — auth, jobs, applications, resumes
└── ml-service/      Python FastAPI microservice — resume parsing + fit scoring + LLM explanations
```

The Node backend and Python ML service are independently deployed and communicate over HTTP. This polyglot split exists because Python's ecosystem (scikit-learn, pdfplumber) is better suited to the ML/text-processing work than Node, while Express is a better fit for the CRUD/auth layer.

```
 Vercel (React)
      │
      ▼
 Render (Node/Express) ──► MongoDB Atlas
      │                └──► Cloudinary (resumes)
      ▼
 Render (Python/FastAPI) ──► Groq API (LLM explanations)
```

---

## Running locally

### Prerequisites
- Node.js 18+
- Python 3.10+
- A MongoDB Atlas connection string
- A Cloudinary account
- A Groq API key
- A Gmail account with an [App Password](https://myaccount.google.com/apppasswords) (for email sending)

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
cp .env.example .env   # fill in GROQ_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000/api
npm run dev
```

---

## Notes on the ML approach

The fit-scoring pipeline originally used sentence-transformer embeddings for semantic similarity, but that approach was memory-heavy (PyTorch alone needs 300MB+ RAM at idle) and exceeded free-tier hosting limits. It was replaced with TF-IDF + cosine similarity — a lighter, classic NLP technique that still captures meaningful word-importance-weighted overlap between a resume and a job description, at a fraction of the memory footprint. The LLM explanation layer (Groq) compensates for TF-IDF's weaker synonym-matching by providing qualitative, human-readable reasoning on top of the numeric score.

---

## Author

Rani Sharma — [GitHub](https://github.com/rani-86) · [LinkedIn](https://www.linkedin.com/in/rani-sharma-6b90b527b/)