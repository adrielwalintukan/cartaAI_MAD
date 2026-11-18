# Backend CartaAI v2 (FastAPI)

Struktur dan kontrak: `docs/04-arsitektur.md`, `docs/06-api-spec.md`, `docs/07-pipeline-generate-ai.md`.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements-dev.txt
copy .env.example .env   # isi SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY, MIDTRANS_SERVER_KEY
uvicorn app.main:app --reload --port 8000
```

Tes (tanpa jaringan, Supabase/Gemini/Midtrans dipalsukan): `pytest -q` (cakupan: `pytest --cov=app`).
Tes integrasi ke project Supabase uji: set `TEST_SUPABASE_URL` dan `TEST_SUPABASE_SERVICE_ROLE_KEY`, lalu `pytest -m integration`.
