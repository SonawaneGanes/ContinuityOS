# ContinuityOS

Evidence-first project handover platform (CodersInPune Hackathon, Team VOIDCORE).

## Setup

1. Start PostgreSQL:

   ```powershell
   docker compose up -d
   ```

2. Create and activate the backend environment, then install dependencies:

   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. From the `backend` directory, copy `.env.example` to `.env`, then configure
   `DATABASE_URL` (the included Compose
   database: `postgresql+psycopg2://continuity:continuity_pass@localhost:5433/continuityos`).
   Add `OPENAI_API_KEY` to enable claim extraction, and optionally set
   `LLM_MODEL`.
4. Start the API from the `backend` directory:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Open the API docs at <http://127.0.0.1:8000/docs>.
6. In a separate terminal, run:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Then open <http://localhost:5173>.

## Demo

1. Seed repeatable sample claims with `python seed_demo.py` from `backend`;
   use the printed project ID in the frontend.
2. Upload files from `sample_data/` with `POST /projects/{id}/upload`
   (requires `OPENAI_API_KEY`).
3. Review claims with `GET /projects/{id}/claims`.
4. Review gaps with `GET /projects/{id}/gaps`.
5. Approve with `POST /projects/{id}/approve?approved_by=YourName`.

Run backend tests from `backend` with `python -m pytest`. With an OpenAI API
key configured, run `python run_benchmark.py` from the same directory to
perform three extraction benchmark runs and print their average.

The database URL and API key belong in the ignored `backend/.env` file. Never
commit real credentials.

## Libraries

FastAPI, SQLAlchemy, psycopg2, python-dotenv, python-multipart, pypdf,
python-docx, OpenAI, and pytest.
