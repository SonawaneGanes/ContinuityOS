# ContinuityOS frontend

React + Vite dashboard for project claims, source evidence, readiness gaps, and
handover export.

From the project root:

```powershell
docker compose up -d
cd backend
.\venv\Scripts\Activate.ps1
python seed_demo.py
uvicorn app.main:app --reload
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open <http://localhost:5173>, enter the project ID printed by `seed_demo.py`,
and load the project. Set `VITE_API_URL` only if the backend is hosted somewhere
other than `http://127.0.0.1:8000`.

Uploading evidence files requires `OPENAI_API_KEY` in `backend/.env`.
