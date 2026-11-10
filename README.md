# ContinuityOS

Evidence-first project handover platform. Built for the CodersInPune Hackathon by Team VOIDCORE.

ContinuityOS turns project files (meeting notes, task boards, READMEs, chat logs) into claims. Each claim is linked to the exact text it came from, labelled as Verified, Uncertain, Conflicting, or Missing, and checked by rule-based gap detection. A human must approve the handover before it is shared.

![ContinuityOS architecture](https://github.com/SonawaneGanes/ContinuityOS/blob/9883a3f7f5b6bdd011ca636cca41c255b989f416/diagram.png)

## Features

- Upload project files (`.md`, `.txt`, `.csv`, `.pdf`, `.docx`)
- Extract tasks, owners, deadlines, and decisions with an LLM
- Keep only claims whose quote matches the source text exactly
- Label claims: Verified, Uncertain, Conflicting, Missing
- Detect unowned tasks, conflicting deadlines, stale tasks, and broken dependencies
- Calculate a Handover Readiness Score (out of 100)
- Block approval when the score is below 85
- Source viewer that highlights the exact quote in the original file

## Technology

| Layer | Technology |
|---|---|
| Frontend | React, Vite |
| Backend | Python, FastAPI, SQLAlchemy, Pydantic |
| Database | PostgreSQL 16 (Docker) |
| Parsing | pypdf, python-docx |
| AI extraction | Google Gemini API |

## Prerequisites

- Docker Desktop (running)
- Python 3.11 or newer
- Node.js 18 or newer
- A Google Gemini API key (only needed for uploading files)

## Setup

### 1. Start PostgreSQL

From the project root (`continuityos/`):

```powershell
docker compose up -d
```

This starts PostgreSQL on port `5432` and creates the `continuityos` database.

### 2. Set up the backend

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure environment variables

Copy the example file and edit it:

```powershell
copy .env.example .env
```

Set these values in `backend/.env`:

```
DATABASE_URL=postgresql://continuity:continuity_pass@localhost:5432/continuityos
GEMINI_API_KEY=your_key_here
LLM_MODEL=gemini-3.8-flash
```

Never commit `.env`. It is listed in `.gitignore`.

### 4. Start the API

From the `backend` folder, with the virtual environment active:

```powershell
uvicorn app.main:app --reload
```

Open the API documentation at <http://127.0.0.1:8000/docs>.

### 5. Start the frontend

In a second terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>.

## Deploy the frontend to Netlify

The repository includes a `netlify.toml` configured to install and build the
Vite app in `frontend/`, publish `frontend/dist/`, and serve the app entry point
for page routes. Connect the GitHub repository to Netlify and deploy with the
detected settings; no custom build command or publish directory is needed.

The frontend needs a separately deployed backend and PostgreSQL database;
Netlify hosts the static frontend, not this FastAPI service or its database.
Configure these environment variables:

- **Netlify:** Set `VITE_API_URL` to the public base URL of the deployed API
  (for example, `https://api.example.com`, without a trailing slash), then
  trigger a new deploy. `frontend/.env.example` shows the expected format.
- **Backend host:** Set `DATABASE_URL` to the hosted PostgreSQL connection
  string, `GEMINI_API_KEY` for file extraction, and `CORS_ORIGINS` to the
  exact Netlify site origin (for example, `https://your-site.netlify.app`).
  Multiple allowed origins can be comma-separated. Keep the local origins in
  `backend/.env.example` when developing locally.

Check that `https://<your-backend-host>/health` returns `{"status":"ok"}` and
that the deployed frontend can reach it before using upload and project
features. Never put backend secrets in Netlify's `VITE_*` variables; values
with that prefix are included in the public frontend bundle.

### Deploy the API on Render

The root `render.yaml` defines the API service. In Render, choose **New +
Blueprint** and connect this repository. The service installs dependencies
from the root `requirements.txt` and starts Uvicorn from `backend/`, where the
`app` package lives. It also pins Python to 3.12.10 and uses `/health` as its
health check.

Set the prompted environment variables on the Render API service:

- `DATABASE_URL`: the **internal** database URL from your Render PostgreSQL
  instance (ideally in the same Oregon region as the API).
- `GEMINI_API_KEY`: your Gemini API key.
- `CORS_ORIGINS`: your exact Netlify site origin, such as
  `https://your-site.netlify.app` (no trailing slash).

After deployment, set Netlify's `VITE_API_URL` to the Render API service URL
and redeploy the frontend.

## Demo

1. Create demo data (from the `backend` folder):

   ```powershell
   python seed_demo.py
   ```

   Note the project ID it prints and use it in the frontend.

2. Or upload files from `sample_data/` using **Upload evidence** in the app, or `POST /projects/{id}/upload` in `/docs`. Uploading needs `GEMINI_API_KEY`.

3. Review claims: `GET /projects/{id}/claims`
4. Review gaps and score: `GET /projects/{id}/gaps`
5. Approve the handover: `POST /projects/{id}/approve?approved_by=YourName`

Approval fails if the readiness score is below 85 or the project has no claims.

## Testing

Run unit tests from the `backend` folder:

```powershell
python -m pytest
```

Run the extraction benchmark (needs `GEMINI_API_KEY`):

```powershell
python run_benchmark.py
```

The benchmark runs the extractor on the sample files and reports recall and precision for each gap type. Results can vary between runs, so run it three times and record the average for the Round 2 report.

## Project structure

```
continuityos/
├── docker-compose.yml
├── sample_data/           sample files for the demo
├── backend/
│   ├── app/
│   │   ├── main.py        API entry point
│   │   ├── database.py    database connection
│   │   ├── models.py      tables: projects, documents, claims
│   │   ├── routes/        upload, claims, gaps, handover
│   │   └── services/      parser, extractor, schemas, verifier, gaps
│   ├── tests/             unit tests
│   ├── seed_demo.py       creates demo data without the LLM
│   └── run_benchmark.py   extraction benchmark
└── frontend/              React app
```

## Libraries

FastAPI, SQLAlchemy, psycopg2-binary, python-dotenv, python-multipart, pypdf, python-docx, openai, pydantic, pytest.

## Limitations (Round 2)

- Extraction quality depends on the LLM. The verifier rejects any claim whose quote is not found exactly in the source, so wrong claims are dropped rather than shown.
- Role-based access and export are planned for Round 3.
- Gap labels are updated when the gaps endpoint is called.

## Team

- Pranav Yogesh Borse: backend orchestration and gap engine
- Ganesh Ravindra Sonawane: LLM extraction and verification (team leader)
- Shreyas Panchal: React frontend
