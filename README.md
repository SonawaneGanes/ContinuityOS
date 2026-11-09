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

3. Configure `DATABASE_URL` in `backend/.env` (for the included Compose
   database: `postgresql+psycopg2://continuity:continuity_pass@localhost:5432/continuityos`).
   Add `OPENAI_API_KEY` to enable claim extraction, and optionally set
   `LLM_MODEL`.
4. Start the API from the `backend` directory:

   ```powershell
   uvicorn app.main:app --reload
   ```

5. Open the API docs at <http://127.0.0.1:8000/docs>.

## Demo

1. Create a project with `POST /projects?name=Attendance`.
2. Upload files from `sample_data/` with `POST /projects/{id}/upload`.
3. Review claims with `GET /projects/{id}/claims`.
4. Review gaps with `GET /projects/{id}/gaps`.
5. Approve with `POST /projects/{id}/approve?approved_by=YourName`.

The database URL and API key belong in the ignored `backend/.env` file. Never
commit real credentials.

## Libraries

FastAPI, SQLAlchemy, psycopg2, python-dotenv, python-multipart, pypdf,
python-docx, OpenAI, and pytest.
