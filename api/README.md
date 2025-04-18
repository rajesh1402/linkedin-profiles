# LinkedIn Profile Saver — Backend (FastAPI + Neon Postgres)

## Features
- RESTful API (FastAPI) for saving, listing, and deleting LinkedIn profiles
- PostgreSQL (Neon) database
- SQLAlchemy ORM, Alembic migrations
- Pydantic validation
- CORS for Chrome Extension & localhost
- Seed/truncate scripts for testing
- Automated/manual endpoint tests

## Setup

1. Clone repository and navigate to `api/`.
2. Copy `.env.example` to `.env` and fill in your Neon Postgres credentials.
3. (Optional) Create a virtual environment:
   ```sh
   python -m venv venv
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   ```
4. Install dependencies:
   ```sh
   pip install -r requirements.txt
   ```
5. Run Alembic migrations:
   ```sh
   alembic upgrade head
   ```
6. (Optional) Seed the database:
   ```sh
   python seed.py
   ```
7. Start the API server:
   ```sh
   uvicorn main:app --reload
   ```

## API Endpoints
- `POST /profiles`: Save a LinkedIn profile
- `GET /profiles`: List all profiles
- `DELETE /profiles/{profile_id}`: Delete by ID

## Testing
- Run `pytest` for automated tests (see `test_api.py`).
- Use `test_post.py`, `test_get.py`, `test_delete.py` for manual endpoint tests.

## Migrations
- Alembic config is set up to use `.env` for `DATABASE_URL`.
- Migration scripts are in `alembic/versions/`.

## Seeding/Truncation
- `seed.py`: Adds example profiles
- `truncate.py`: Deletes all profiles (for testing)

## Security
- No secrets in code
- Use HTTPS in production
- Secure CORS origins in production

## OpenAPI Docs
- Visit `/docs` when server is running

---

See the root requirements doc for full project details and decision log.
