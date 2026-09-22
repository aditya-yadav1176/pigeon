# 🐦 PIGEON

Temporary file sharing between devices without login, installation, cables, or cloud-drive accounts.

PIGEON is built for quick, frictionless handoffs—especially between phones and laptops. Instead of emailing attachments to yourself or logging into messaging apps on public computers, PIGEON lets you drop a file, generate a 5-character transfer code, and download it on another device.

---

## What is PIGEON?

Moving a PDF, presentation slides, an image, a video, or a text snippet between personal and shared devices (such as lab computers, library workstations, or classroom digital boards) is often annoying. Logging into email, cloud drives, or chat apps on a shared screen leaves accounts exposed, while USB cables and flash drives are rarely on hand.

PIGEON provides a lightweight, temporary browser-based file handoff. The sender drops files or pastes text into the web app, and PIGEON generates a short 5-character transfer code.

The receiver enters that code on another device to download the files. Active rooms and files are stored temporarily on the server and automatically purged when the transfer completes or when the room's countdown expires.

---

## How it works

```
OPEN → DROP → CODE → CONNECT → DONE
```

1. **Open**: Launch PIGEON in any modern browser on the sending device.
2. **Drop**: Select or drag-and-drop your files (or paste a text note).
3. **Code**: PIGEON uploads the payload and generates an unambiguous 5-character code (e.g., `K7M4P`).
4. **Connect**: Open PIGEON on the receiving device, switch to **Receive**, and enter the code.
5. **Done**: Download individual files or all at once.

> **Bi-Directional**: Transfers work seamlessly in both directions: **Phone ➔ Laptop** and **Laptop ➔ Phone**.

---

## Features

- **Zero Sign-Up**: No accounts, passwords, email verification, or phone numbers.
- **No Installation**: Runs entirely inside any standard web browser tab.
- **5-Character Transfer Codes**: Clean alphanumeric codes without confusing characters (`0`, `1`, `I`, `O`).
- **Phone ↔ Laptop Support**: Tailored for fast cross-device handoffs.
- **Multiple File Types**: Supports PDFs, PPTX decks, images, MP4 video, and plain text/links.
- **Real-Time Progress**: Live upload progress tracking and receiver status polling.
- **Configurable Expiration**: Senders can select room duration (3, 5, or default 10 minutes) with a live synchronized countdown.
- **250 MB Payload Limit**: Boundary limits protect server storage from disk exhaustion.
- **Responsive Interface**: Mobile-first layout with zero horizontal overflow across all screen sizes.
- **Accessible Motion**: Full `prefers-reduced-motion` fallbacks across character animations and transitions.

---

## Tech Stack

### Frontend

- **React 19**
- **TypeScript** (strict mode)
- **TanStack Start** & **TanStack Router**
- **Vite 8**
- **Tailwind CSS v4**

### Backend

- **Python 3.10+**
- **FastAPI**
- **Uvicorn**

### Storage & State

- **Temporary local filesystem**
- **In-memory room metadata**

### Deployment

- **Vercel** (frontend)
- **Render** (FastAPI backend)

---

## Local Development

Running PIGEON locally requires running the FastAPI backend and the Vite frontend in separate terminal windows.

### Backend

```bash
# 1. Navigate to backend directory
cd backend

# 2. Create and activate Python virtual environment
python -m venv .venv

# Windows:
.venv\Scripts\activate
# macOS / Linux:
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Start backend server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend starts at `http://localhost:8000`. Interactive API documentation is available at `http://localhost:8000/docs`.

### Frontend

```bash
# 1. Install dependencies from repository root
npm install

# 2. Start frontend development server
npm run dev
```

The frontend launches at `http://localhost:3000`. It connects to `http://localhost:8000` by default in development mode, or through the `VITE_API_BASE_URL` environment variable.

---

## Environment Variables

| Variable | Location | Default | Purpose |
|---|---|---|---|
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000` | FastAPI backend URL (set to your Render service URL on Vercel). |
| `VITE_TRANSFER_MODE` | Frontend | `api` | `api` for the real backend or `mock` for local testing. |
| `HOST` | Backend | `0.0.0.0` | Network binding interface for Uvicorn. |
| `PORT` | Backend | `8000` | Port number for Uvicorn server. |
| `ROOM_TTL_SECONDS` | Backend | `600` | Room lifetime in seconds (10 minutes). |
| `MAX_FILE_SIZE_MB` | Backend | `250` | Maximum payload size in megabytes. |
| `CORS_ORIGINS` | Backend | `["http://localhost:3000", ...]` | Allowed frontend origins. |

---

## Current Limitations

- **Temporary Storage Only**: Files are stored temporarily on the backend server's local disk during active transfers. PIGEON is designed for immediate handoffs, not persistent cloud storage.
- **Session Expiration**: Rooms and uploaded files are automatically deleted when the selected duration expires (3, 5, or default 10 minutes) or the transfer is completed.
- **250 MB Payload Limit**: Single-session uploads cannot exceed 250 MB.
- **Render Free-Tier Spin-Down**: On Render's free tier, the backend may spin down after a period of inactivity. The first request after sleep may take longer while the backend wakes up.
- **Single-Instance Design**: Room metadata is held in memory, so the current backend is intended for a single running instance.

---

## Testing

The test suite verifies the end-to-end transfer lifecycle and edge cases including file handling, payload boundaries, TTL expiration, security sanitization, and concurrent rooms.

```bash
# Frontend type check & linting
npx tsc --noEmit
npx eslint src
npm run build

# Backend integration & automated QA test suites
cd backend
python test_api.py
python test_qa_suite.py
```

---

## License

MIT © [Aditya Yadav](https://github.com/aditya-yadav1176)
