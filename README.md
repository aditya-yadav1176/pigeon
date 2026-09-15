# 🐦 PIGEON

A fast, temporary file-sharing tool between devices without requiring login, installation, cables, or cloud-drive accounts.

---

## What is PIGEON?

Moving a PDF, presentation slides, an image, a video, or text from a phone to a laptop, lab PC, or classroom smartboard is usually frustrating:

- Logging into WhatsApp Web or Telegram on a public computer leaves personal chats open.
- Emailing files to yourself fills your inbox with attachments and requires logging in.
- Cloud drives (Google Drive, iCloud, OneDrive) require signing in and manually deleting files later.
- USB cables and flash drives are often unavailable or restricted.

**PIGEON solves this with a direct temporary handoff.** You open a tab on your phone, drop your file, get a 5-character code, type the code on your laptop, and download. When the transfer is done or 10 minutes pass, the room and files are completely purged from disk.

---

## How It Works

```
OPEN  ──▶  DROP  ──▶  CODE  ──▶  CONNECT  ──▶  DONE
```

1. **Send**: Open PIGEON on your phone (or laptop) and select **Send**.
2. **Drop**: Select your files (PDF, PPTX, images, video, text/links) or drag them into the drop zone.
3. **Code**: PIGEON streams the upload to temporary server storage and issues a 5-character code (e.g. `K7M4P`).
4. **Receive**: Open PIGEON on the other device and select **Receive**.
5. **Connect**: Type the 5-character code. The devices pair instantly.
6. **Done**: Download individual files or all at once. The temporary room auto-expires in 10 minutes.

> **Bi-Directional**: The transfer works identically in both directions: **Phone ➔ Laptop** and **Laptop ➔ Phone**.

---

## Key Features

- **Zero Sign-Up**: No accounts, passwords, email verification, or phone numbers required.
- **No Installation**: The entire product runs inside any modern web browser tab.
- **5-Character Transfer Codes**: Clean, unambiguous alphanumeric codes (e.g., `H4K9M`) generated with cryptographic randomness.
- **Bi-Directional Sharing**: Phone-to-laptop and laptop-to-phone workflows are equally supported.
- **Multiple Files & Types**: Transmit PDFs, PowerPoint presentations, images, MP4 videos, code, and text snippets simultaneously.
- **Real-Time Progress & Feedback**: Upload progress percentage, active transfer indicator, and receiver status polling.
- **Temporary Ephemeral Storage**: Rooms and uploaded files are automatically destroyed after 10 minutes (600s TTL).
- **250 MB Payload Limit**: Built-in boundary protection prevents oversized payloads and server disk exhaustion.
- **Security & Path Traversal Protection**: Filename sanitization, header injection defense, and IP-based rate limiting on upload and code guessing.
- **Stylized Vector Mascot**: Custom parametric SVG character with 3-tier wing layering and state-driven avian kinematics (idle, drag alert, flapping, flight cruise, landing flare, success pop).
- **Mobile-First Responsive UI**: Tailored for phone browsers (tested from 320px to large desktop monitors) with zero horizontal overflow.
- **Accessibility**: Comprehensive `prefers-reduced-motion` support, screen-reader labels, and keyboard navigation.

---

## Tech Stack

### Frontend
- **Framework**: [React 19](https://react.dev/)
- **Routing & SSR**: [TanStack Start](https://tanstack.com/start) & [TanStack Router](https://tanstack.com/router)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (strict mode)
- **Build Tool**: [Vite 8](https://vitejs.dev/) with Cloudflare/Nitro SSR preset
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Primitives**: Radix UI (Dialog, Tooltip, Progress)
- **Icons**: Lucide React

### Backend
- **Runtime**: Python 3.10+
- **API Framework**: [FastAPI](https://fastapi.tiangolo.com/) + Starlette
- **Server**: [Uvicorn](https://www.uvicorn.org/) (ASGI)
- **Data Validation**: Pydantic v2
- **Multipart Uploads**: `python-multipart`
- **Background Tasks**: Python `asyncio` cleanup loop

### Storage
- **Filesystem**: Temporary local disk directory (`backend/storage/`), segregated per room.
- **Metadata**: In-memory `RoomManager` with thread-safe TTL tracking and cryptographic code generation.

---

## Architecture

```
┌───────────────────────────┐           ┌───────────────────────────┐
│       Sending Device      │           │      Receiving Device     │
│   (Phone Browser or PC)   │           │   (Laptop Browser or Lab) │
└─────────────┬─────────────┘           └─────────────▲─────────────┘
              │                                       │
              │ 1. Multipart Upload                   │ 3. Enter 5-char code &
              │    (Files / Text)                     │    Stream Download
              ▼                                       │
┌─────────────────────────────────────────────────────┴─────────────┐
│                 PIGEON Frontend (Hosted on Vercel)                │
│                 https://<your-app>.vercel.app                     │
└───────────────────────────────┬───────────────────────────────────┘
                                │ HTTPS REST API
                                ▼
┌───────────────────────────────────────────────────────────────────┐
│             FastAPI Backend Service (Hosted on Render)            │
│             https://<your-api>.onrender.com                       │
│                                                                   │
│   ┌────────────────────────┐         ┌────────────────────────┐   │
│   │   In-Memory Rooms      │         │   Ephemeral Storage    │   │
│   │   - 5-char unique code │         │   - backend/storage/   │   │
│   │   - 10-minute TTL      │         │   - sanitized files    │   │
│   │   - status polling     │         │   - auto-purge daemon  │   │
│   └────────────────────────┘         └────────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
pigeon/
├── src/
│   ├── components/
│   │   ├── pigeon/                  # Character mascot & core transfer UX
│   │   │   ├── Pigeon.tsx           # Signature vector SVG character & brand gradients
│   │   │   ├── PigeonExperience.tsx # Full end-to-end send & receive product flow
│   │   │   ├── pigeon.css           # 4-phase avian kinematics & stage animations
│   │   │   ├── pigeon.motion.ts     # State-to-motion mapping engine
│   │   │   └── pigeon.types.ts      # Anatomical parts & state types
│   │   └── ui/                      # Design system primitives & ScrollReveal
│   ├── routes/                      # TanStack file-based application routes
│   │   ├── __root.tsx               # Root layout, meta, font links & error boundary
│   │   └── index.tsx                # Main entry route
│   ├── services/
│   │   └── transfer/                # HTTP REST client & mock adapters
│   │       ├── fastApiTransferService.ts # Real FastAPI integration
│   │       ├── mockTransferService.ts    # In-memory test simulation
│   │       └── transferService.ts        # Service interface definition
│   ├── styles.css                   # Tailwind CSS v4 design tokens & keyframes
│   └── lib/                         # Utility helpers (cn, formatting)
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI application & CORS setup
│   │   ├── config.py                # Environment & storage settings
│   │   ├── models.py                # Pydantic response models
│   │   ├── room_manager.py          # Room lifecycle, 5-char code CSPRNG & state
│   │   ├── security.py              # Filename sanitization & rate limiting
│   │   ├── storage.py               # Chunked disk write & directory cleanup
│   │   ├── cleanup.py               # Background asyncio loop purging expired rooms
│   │   └── routes/
│   │       └── rooms.py             # Room endpoints (upload, status, connect, download)
│   ├── storage/                     # Temporary local disk storage (git-ignored)
│   ├── requirements.txt             # Python backend dependencies
│   ├── test_api.py                  # Lifecycle integration tests
│   └── test_qa_suite.py             # 34-point automated backend QA suite
├── public/
│   ├── favicon.svg                  # Brand vector favicon
│   └── robots.txt                   # Search crawler directives
├── .env.example                     # Frontend environment template
├── AGENTS.md                        # Development & Lovable sync guidelines
├── ARCHITECTURE.md                  # Comprehensive architectural specification
├── DEPLOYMENT.md                    # Step-by-step production deployment guide
├── PIGEON_DESIGN_SYSTEM.md          # Visual tokens, typography, and palette spec
├── package.json                     # Frontend dependencies and npm scripts
└── README.md                        # Project documentation
```

---

## Local Development

Running PIGEON locally requires running the FastAPI backend and the Vite frontend in separate terminals.

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv .venv

# On Windows:
.venv\Scripts\activate
# On macOS / Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server on port 8000
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend will be running at `http://localhost:8000`. You can test the health endpoint at `http://localhost:8000/health` or view Swagger docs at `http://localhost:8000/docs`.

### 2. Frontend Setup

In a new terminal:

```bash
# In the project root
npm install

# (Optional) Copy environment template
cp .env.example .env

# Start local development server
npm run dev
```

Open `http://localhost:3000` in your browser.

---

## Environment Variables

### Frontend (`.env`)

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Full URL to the FastAPI backend API | `http://localhost:8000` (Local) / `https://<backend>.onrender.com` (Production) |
| `VITE_TRANSFER_MODE` | Active service adapter (`api` for real FastAPI, `mock` for offline testing) | `api` |

> **Note**: In production deployments on Vercel, set `VITE_API_BASE_URL` to your Render backend URL **without** a trailing slash.

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `HOST` | Server bind address | `0.0.0.0` |
| `PORT` | Server listen port | `8000` (or dynamically set by Render via `$PORT`) |
| `ROOM_TTL_SECONDS` | Room lifetime before automatic deletion | `600` (10 minutes) |
| `MAX_FILE_SIZE_MB` | Maximum combined payload size per room | `250` |
| `CORS_ORIGINS` | Comma-separated or JSON list of allowed origins | `["http://localhost:3000","http://localhost:5173"]` |

---

## Production Deployment

The recommended production setup uses **Vercel** for the frontend and **Render** for the backend:

- **Frontend**: Hosted on [Vercel](https://vercel.com) connecting to the backend via `VITE_API_BASE_URL`.
- **Backend**: Hosted on [Render](https://render.com) as a Python Web Service with automatic HTTPS and Uvicorn dynamic `$PORT` binding.
- Detailed step-by-step instructions are available in [DEPLOYMENT.md](DEPLOYMENT.md).

### Known Production Limitations
1. **Temporary Ephemeral Storage**: Files are stored temporarily on the server's local disk and are permanently deleted upon transfer completion or when the 10-minute room TTL expires. PIGEON is not a persistent cloud drive.
2. **Render Free-Tier Sleep**: On Render's free tier, backend instances may spin down after 15 minutes of inactivity. The initial request after sleep may take ~15–25 seconds while the instance boots.
3. **250 MB Maximum Upload**: Rooms cannot exceed 250 MB in total file payload.

---

## API Overview

All backend endpoints are prefixed with `/api/rooms`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health status check |
| `POST` | `/api/rooms` | Create a room and upload files (`multipart/form-data`) or text |
| `GET` | `/api/rooms/{code}` | Retrieve room metadata, file list, and expiration timestamp |
| `POST` | `/api/rooms/{code}/connect` | Notify sender that receiver has connected and entered code |
| `POST` | `/api/rooms/{code}/complete` | Mark room status as completed |
| `GET` | `/api/rooms/{code}/status` | Lightweight status polling endpoint (connection state, TTL) |
| `GET` | `/api/rooms/{code}/files/{file_id}` | Stream stored file download with sanitized attachment header |

---

## Testing & Quality Assurance

### Frontend Verification
```bash
# TypeScript strict check (0 errors)
npx tsc --noEmit

# ESLint code quality & formatting check (0 errors)
npx eslint src

# Production build verification
npm run build
```

### Backend Automated QA Suite
```bash
cd backend
python test_api.py        # 9-point integration lifecycle check
python test_qa_suite.py   # 34-point comprehensive automated security & edge-case suite
```

#### Test Coverage Includes:
- Binary byte-for-byte preservation on PDFs, PNG/JPG images, PPTX presentations, and MP4 video.
- 250 MB file size limit enforcement (HTTP 413).
- Path traversal injection (`../../etc/passwd`, null bytes) sanitization.
- HTTP header injection (CRLF) prevention in `Content-Disposition`.
- Expired room automatic garbage collection and disk purge.
- IP-based rate limiting against abuse (HTTP 429).
- Concurrent room isolation (no cross-room file leakage).

---

## Security & Safeguards

- **CSPRNG Room Codes**: Codes are generated using Python's `secrets` module from an unambiguous 30-character alphabet (omitting easily confused characters `0`, `1`, `I`, `O`).
- **Path Traversal Defense**: All filenames are passed through `sanitize_filename()` to strip directory navigation (`../`, `..\`) and null characters.
- **Disk Exhaustion Protection**: Payload sizes are measured in real time during streaming; excess uploads are truncated and deleted immediately.
- **Automated Disk Cleanup**: An asynchronous background loop runs every 30 seconds to clean up orphaned folders and purge expired rooms.

---

## Design Philosophy

- **FAST**: No sign-in modals, no tracking scripts, no onboarding carousels. Drop, get code, download.
- **SIMPLE**: The entire UI consists of two core tabs: **Send** and **Receive**.
- **PLAYFUL**: The PIGEON vector character grounds the utility with personality, reacting to user actions with organic avian motion.
- **CLEAR**: Bold typography, high-contrast borders, explicit error explanations, and unambiguous labels.
- **TEMPORARY**: Privacy by architecture. Files live for 10 minutes and disappear forever.

---

## License

MIT © [Aditya Yadav](https://github.com/aditya-yadav1176)
