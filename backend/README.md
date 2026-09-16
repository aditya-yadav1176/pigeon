# PIGEON — FastAPI Backend

Ultra-lightweight, temporary cross-device file transfer backend.

## Architecture
- **Framework**: FastAPI + Python 3.11+
- **Storage**: Local chunked streaming filesystem storage (`storage/{room_code}/`)
- **Metadata**: In-memory store (`dict[str, Room]`)
- **Code Generation**: Cryptographically secure 5-character unambiguous codes (`CSPRNG`) via Python `secrets`
- **TTL Expiration**: Auto-purge background task every 30 seconds

## Setup & Running

```bash
# 1. Create and activate venv
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# Linux/macOS:
source .venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive API Documentation is available at: `http://localhost:8000/docs`
