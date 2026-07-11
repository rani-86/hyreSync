# HireSync — Build Log & Interview Reference

**Project:** AI-powered hiring platform (recruiter/candidate dual-role, resume screening, AI-ranked shortlists)
**Repo:** github.com/rani-86/hyreSync
**Stack:** React (Vite) · Node.js/Express · MongoDB Atlas (Mongoose) · JWT auth · Python FastAPI ML service (planned)
**Local environment:** Windows, Git Bash (MINGW64), VS Code, D: drive

This document is a running log of what was built, in what order, why, and every bug hit along the way. Use it to refresh your memory before interviews — especially the "Challenges & Debugging" sections, since walking through a real bug you found and fixed is more convincing than reciting a feature list.

---

## Architecture at a glance

```
hiresync/
├── client/          React (Vite) frontend
│   └── src/
│       ├── pages/       Signup.jsx, Login.jsx, Dashboard.jsx
│       ├── services/    api.js (centralized axios calls)
│       ├── App.jsx       route definitions
│       └── main.jsx      app entry point, wraps App in BrowserRouter
└── server/          Node/Express backend
    └── src/
        ├── config/       db.js (MongoDB connection)
        ├── controllers/  authController.js (signup/login logic)
        ├── middleware/   auth.js (protect, requireRole)
        ├── models/       User.js
        ├── routes/       authRoutes.js
        ├── app.js         Express app + middleware + route registration
        └── index.js       entry point, connects DB then starts server
```

---

## Stage 1 — Repo Initialization

**What was done:**
```bash
mkdir hiresync && cd hiresync
git init
git config user.name "Rani"
git config user.email "..."
```
Created `.gitignore` (excludes `node_modules/`, `.env`, `dist/`, `build/`) and a minimal `README.md`.

```bash
git add .gitignore README.md
git commit -m "chore: initialize repo with README and .gitignore"
```

**Why this order matters:** `.gitignore` exists *before* any dependency gets installed, so `node_modules` and secrets are never accidentally tracked, even for a moment.

**GitHub connection:** Repo created on GitHub as `hyreSync` (note: capitalized differently from the local folder `hiresync` — cosmetic only, doesn't affect git functionality).

**Bug hit — wrong remote URL:**
Initially set `git remote add origin` to a placeholder URL (`.../yourusername/hiresync.git`) instead of the real one. Every `git push` failed with `remote: Repository not found`. Trying `git remote add origin <correct-url>` again failed with `error: remote origin already exists` — `add` only works when no remote is set yet.
**Fix:** used `git remote set-url origin <correct-url>` instead, which updates an existing remote rather than trying to create a new one.
**Lesson:** `add` vs `set-url` — know the difference; it's a 2-second fix once you know which command to reach for.

---

## Stage 2 — Express Server Scaffold

```bash
mkdir server && cd server
npm init -y
npm install express cors dotenv
```

Created `server/src/app.js` (defines the Express app + routes) and `server/src/index.js` (entry point that starts listening). Kept these **separate on purpose** — `app.js` can be imported and tested without actually binding to a port, which matters later for automated testing.

First route: a health check (`GET /api/health`) returning `{ status: 'ok' }`. Verified with `curl http://localhost:5000/api/health` before committing — **rule followed throughout the project: nothing gets committed until it's actually run and verified working.**

```bash
git commit -m "chore: scaffold Express server with basic health check route"
```

---

## Stage 3 — MongoDB Atlas Connection

Set up a free M0 cluster on MongoDB Atlas, created a database user, whitelisted all IPs (`0.0.0.0/0` — fine for dev, would be locked down for real production).

Installed `mongoose` (ODM for MongoDB) and `dotenv` (loads `.env` variables into `process.env`).

Created `server/src/config/db.js`:
```js
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  }
};
```

Wired into `index.js` so the server only starts listening **after** the DB connection succeeds — avoids accepting requests that would immediately fail on a DB query.

**Bug hit — malformed connection string:**
Error: `MongoDB connection failed: option hyresync is not supported`.
Root cause: when adding the database name to the Atlas connection string, it got inserted in the wrong place — instead of `.../hyresync?retryWrites=...`, the `appName=Cluster0` parameter got overwritten as `?hyreSync=Cluster0`, so mongoose tried to parse `hyreSync` as a connection *option* (like `retryWrites` or `appName`), which doesn't exist as a valid key.
**Fix:** corrected the string to the proper shape:
```
mongodb+srv://<user>:<pass>@<cluster>/<db-name>?retryWrites=true&w=majority&appName=Cluster0
```
**Lesson (genuinely good interview answer):** everything before `?` is the connection path (host + db name); everything after `?` is `key=value` pairs joined by `&`, and only recognized keys are valid there. This is a real, explainable debugging story — a fabricated project wouldn't have this kind of specific war story.

**Bug hit — accidental root-level install:**
Ran `npm install mongoose dotenv` from the project root instead of `server/`, polluting the root with a stray `package.json`/`node_modules`.
**Fix:** `rm -rf node_modules package.json package-lock.json` at root, then reinstalled correctly inside `server/`.
**Lesson:** always check `pwd` before running `npm install` in a monorepo-style structure.

```bash
git commit -m "feat: connect MongoDB Atlas via mongoose"
```

---

## Stage 4 — User Model (Role-Based)

Created `server/src/models/User.js` with a Mongoose schema:
- `name`, `email` (unique, lowercase, trimmed), `password` (min length 6)
- `role`: **enum-restricted** to `['recruiter', 'candidate']`
- `{ timestamps: true }` — auto-manages `createdAt`/`updatedAt`

**Key design decision (interview-worthy):** role validation is enforced at the **schema level**, not just trusted from frontend input. If a request tries to save `role: 'admin'` or a typo, Mongoose rejects it before it reaches the database. Rule: never trust client input for anything security-relevant — validate on the server.

```bash
git commit -m "feat: add User model with role field (recruiter/candidate)"
```

---

## Stage 5 — Signup/Login (JWT Auth)

Installed `bcryptjs` (password hashing) and `jsonwebtoken` (JWT creation/verification).

Built `server/src/controllers/authController.js`:
- **Signup:** validates required fields + role, checks for existing email (409 if taken), hashes password with `bcrypt.hash(password, 10)`, creates the user, returns a signed JWT + user object (password excluded).
- **Login:** finds user by email, compares password with `bcrypt.compare()` (hashing is one-directional — you never decrypt a hash, you re-hash the input and compare), returns a fresh token on success.

JWT payload deliberately minimal: `{ id, role }` only — **never put sensitive data in a token**, since JWTs are signed but not encrypted; anyone can decode (not forge) them.

Created `server/src/routes/authRoutes.js` wiring `POST /signup` and `POST /login`.

**Testing method:** manual `curl` commands for all four cases — successful signup, successful login, duplicate email (409), wrong password (401) — verified before committing.

```bash
git commit -m "feat: add signup/login routes with JWT"
```

---

## Stage 6 — Auth Middleware (Protected Routes)

Created `server/src/middleware/auth.js`:
- `protect`: reads `Authorization: Bearer <token>` header, verifies with `jwt.verify()`, attaches decoded `{ id, role }` to `req.user`, calls `next()`. Returns `401` if missing/invalid.
- `requireRole(...roles)`: checks `req.user.role` against an allowed list, returns `403` if not permitted.

**Interview-relevant distinction:** `401 Unauthorized` = "I don't know who you are" (no/bad token). `403 Forbidden` = "I know who you are, but you can't do this" (valid token, wrong role).

Added a protected test route, `GET /api/auth/me`, to prove the middleware works — returns the logged-in user's own profile (password excluded via `.select('-password')`).

**Testing method:** verified all three states — no token → 401, invalid password at login → 401, valid token on `/me` → returns correct user data.

```bash
git commit -m "feat: add auth middleware for protected routes"
```

*(This closed out the complete backend auth system — a genuinely demoable slice on its own: server → DB → model → signup/login → protected routes.)*

---

## Stage 7 — Git Branching Workflow Introduced

From this point on, every new feature gets its own branch instead of committing straight to `master`, merged via Pull Request on GitHub — matching how real engineering teams work.

**Workflow used:**
```bash
git checkout -b feature/<name>     # create + switch to branch
# ...work, commit as usual...
git push -u origin feature/<name>   # first push needs upstream flag
# open PR on GitHub, merge, delete branch
git checkout master && git pull     # sync local master
```

**Bug hit — accidental commit to master:**
While switching branches, a `git push` was run while still on `master` (prompt wasn't checked), causing the React client scaffold to land on `master` directly instead of the intended feature branch. The subsequent PR merge combined both, resulting in two near-identical commits in history.
**Impact:** cosmetic only — final code state on `master` is correct, just slightly messy history.
**Lesson:** always run `git branch` immediately before `git add`/`commit`/`push` when actively switching branches — same discipline as checking `git status` before staging.

**PR #1:** `feature/react-client-setup` → `master` — scaffolded the React app via Vite.

---

## Stage 8 — React Client Scaffold

```bash
npm create vite@latest client -- --template react
cd client && npm install
```
Verified the default Vite starter page loads at `localhost:5173` before committing.

```bash
git commit -m "feat: scaffold React client with Vite"
```
Merged via PR #1 as described above.

---

## Stage 9 — Login/Signup UI (React) + CORS Fix

New branch: `feature/auth-ui`.

Installed `react-router-dom` (client-side routing) and `axios` (HTTP requests).

**`client/src/services/api.js`** — centralizes all backend calls through one pre-configured axios instance (`baseURL` set once), so deployment later only requires changing one line, not every component.

**`client/src/pages/Signup.jsx` / `Login.jsx`:**
- Single `useState` object per form, updated via computed property names (`[e.target.name]`)
- `e.preventDefault()` to stop native form submission/page reload
- On success: JWT + user object saved to `localStorage`, then `navigate('/dashboard')`
- On failure: error message read safely via optional chaining (`err.response?.data?.message`), since network errors won't have a `response` object at all

**`client/src/pages/Dashboard.jsx`** — minimal placeholder reading the saved user from `localStorage`, just enough to prove the auth flow closes the loop.

**Routing setup:**
- `main.jsx` wraps the whole app in `<BrowserRouter>` (needs to be at the top of the tree so any component can use routing hooks)
- `App.jsx` defines routes via `<Routes>`/`<Route>`, redirecting `/` to `/login` by default

**Bug hit — edits not actually saved:**
After "writing" the routing code, the browser still showed the default Vite starter page (`Get started`, `Count is 0`). Turned out `App.jsx`/`main.jsx` still contained the original boilerplate — a terminal heredoc (`cat > file << EOF`) attempt had failed silently earlier due to being run from the wrong directory. **Fix:** edited both files directly in VS Code instead, which is more reliable for multi-line file content than terminal heredocs on this setup.

**Bug hit — CORS error:**
Signup failed in the browser with a CORS error visible in DevTools → Network tab (preflight `OPTIONS` succeeded with 200, but the actual `POST` request was blocked).
**Root cause:** `cors` middleware was never actually wired into `app.js` — `app.use(cors())` was missing entirely, despite the package being listed as a dependency back in Stage 2.
**Fix attempt 1 hit a second bug:** adding `app.use(cors())` threw `Error: Cannot find module 'cors'` — the package was in `package.json` from an earlier `npm install express cors dotenv`, but somehow wasn't actually present in `node_modules` on this machine.
**Fix:** ran `npm install cors` explicitly to reinstall it, then restarted the server. Signup then succeeded end-to-end, redirecting to `/dashboard`.

**What CORS actually is (good interview explanation):** browsers block a page on one origin (`localhost:5173`) from calling an API on a different origin (`localhost:5000`) unless the server explicitly opts in via response headers. It's a browser security feature preventing malicious sites from silently calling APIs using a victim's saved credentials — not a bug in the browser, a deliberate protection that the server has to explicitly relax.

**Verification before committing:** signup with a fresh account, redirect to dashboard confirmed, `localStorage` contents checked via DevTools → Application tab, and a full page refresh on `/dashboard` confirmed the session persists (doesn't log out on reload).

Committed as **two separate commits** — a backend bugfix and a frontend feature — since they're logically distinct changes even though they were needed together:
```bash
git commit -m "fix: enable CORS on server to allow frontend requests"
git commit -m "feat: build login/signup UI in React, connected to auth API"
git push --set-upstream origin feature/auth-ui
```

**PR #2:** `feature/auth-ui` → `master` (merged).

---

## Stage 10 — Job Posting CRUD (Recruiter Side)

New branch: `feature/job-postings`.

**`server/src/models/Jobs.js`** — Job schema: `title`, `description` (both required), `skillsRequired` (array of strings, default empty), `location` (default `'Remote'`), and `postedBy` — a `mongoose.Schema.Types.ObjectId` with `ref: 'User'`.

**Why `postedBy` is stored as a reference, not a copy:** MongoDB relationships work by storing just the related document's `_id` plus a `ref` telling Mongoose which collection it points to. This avoids duplicating (and later desyncing) recruiter data inside every job document. `.populate('postedBy', 'name companyName')` is used on read routes to pull in just the needed recruiter fields when a job is fetched.

**`server/src/controllers/jobController.js`** — five handlers:
- `createJob` — recruiter-only, sets `postedBy: req.user.id` from the verified JWT (never trusts a `postedBy` value if one were sent in the request body)
- `getJobs` / `getJobById` — public, no auth required, since candidates need to browse listings before necessarily being logged in
- `updateJob` / `deleteJob` — recruiter-only **and** ownership-checked

**The ownership check (core security logic of this stage):**
```js
if (job.postedBy.toString() !== req.user.id) {
  return res.status(403).json({ message: 'Not authorized to edit this job' });
}
```
`job.postedBy` is a MongoDB ObjectId object, not a string, so it needs `.toString()` before comparing against `req.user.id` (a plain string from the decoded JWT). Without this check, any authenticated recruiter could edit or delete *any* job just by guessing/knowing its ID — this enforces that only the recruiter who created a listing can modify it. Good interview answer for "how do you prevent User A from touching User B's data?": never trust an ID passed in the request; always compare against the authenticated user's own ID from a verified token.

**`server/src/routes/jobRoutes.js`** — public GETs, protected POST/PUT/DELETE using chained middleware:
```js
router.post('/', protect, requireRole('recruiter'), createJob);
```
`protect` runs first (verifies token, attaches `req.user`), then `requireRole('recruiter')` checks the role — Express runs middleware left to right, and any failure short-circuits the chain before the controller ever executes.

**Testing method — full curl matrix, verified before committing:**
1. `GET /api/jobs` with nothing posted yet → `[]`
2. `POST /api/jobs` with no token → `401 No token provided`
3. `POST /api/jobs` as a **candidate** (valid token, wrong role) → `403 Forbidden: insufficient role`
4. `POST /api/jobs` as a **recruiter** → `201`, full job object with `postedBy` set
5. `PUT /api/jobs/:id` as a candidate → `403` (blocked at role level, never reaches ownership check)
6. `PUT /api/jobs/:id` as the owning recruiter → `200`, updated job returned
7. `DELETE /api/jobs/:id` as the owning recruiter → `200 {"message":"Job deleted"}`, confirmed via a follow-up `GET` returning `[]` again

**Bug hit — middleware order in app.js:**
While wiring the new job routes into `app.js`, `app.use('/api/auth', ...)` and `app.use('/api/jobs', ...)` were accidentally placed **before** `app.use(cors())` and `app.use(express.json())`. Since Express only applies middleware to routes registered after it, this would have silently broken JSON body parsing (and reopened the earlier CORS issue) for every route.
**Fix:** reordered so `cors()` and `express.json()` are always the first two lines after `const app = express();`, with all route registrations afterward.
**Lesson (reinforces the Stage 9 CORS bug):** middleware order in Express is not cosmetic — it's execution order, top to bottom, and global middleware like CORS/body-parsing always needs to come first.

**Bug hit — model filename mismatch:**
`jobController.js` had `const Job = require('../models/Job')`, but the actual file was saved as `Jobs.js` (plural) — threw `Error: Cannot find module '../models/Job'`.
**Fix:** rather than renaming the file to match `User.js`'s singular convention, the require path was updated to `require('../models/Jobs')` instead, keeping the plural filename. Both approaches work; this project ended up with `Jobs.js` (plural) alongside `User.js` (singular) — a minor naming inconsistency, harmless but worth being aware of if asked about code consistency.

**Bug hit — stray files from a bad terminal paste:**
A block of explanatory prose got pasted into the terminal and interpreted as a shell command, creating a scatter of junk single-word files at the project root (e.g., files literally named `Good.`, `Now`, `actual`, `logic`, etc.).
**Fix:** identified via `ls`, removed with a targeted `rm -f` listing each exact filename (avoided a blanket wildcard delete to prevent touching real project folders).
**Lesson:** always paste command blocks into the terminal, never explanation/prose text — and `ls`/`git status` before any destructive command is what caught this early.

```bash
git commit -m "feat: add job posting CRUD with recruiter role and ownership checks"
```

**PR #3:** `feature/job-postings` → `master` (merged).

---

## Current status

✅ Repo + git workflow (branches, PRs)
✅ Express server + MongoDB Atlas connection
✅ User model with recruiter/candidate roles
✅ JWT signup/login + protected routes middleware
✅ React frontend scaffolded, routed, connected to backend auth
✅ Full signup → login → protected dashboard flow working end to end
✅ Job posting CRUD — public browsing, recruiter-only create/edit/delete, ownership-enforced

**Not yet built:**
- Frontend UI for browsing/creating/editing jobs (backend only so far)
- Resume upload + storage
- Job applications (linking a candidate to a job)
- Python FastAPI ML microservice (resume parsing, embedding-based fit scoring)
- LLM-based shortlist explanations
- Deployment

---


