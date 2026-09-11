# PIGEON — Deployment & Real Internet Testing Guide

This guide details how to take **PIGEON** from local development to the public internet across real devices (e.g., Phone on 4G/5G mobile data ↔ Laptop on home/office Wi-Fi).

---

## 1. Architecture Overview

```
Phone (4G/5G Mobile Cellular)                Laptop (Home/Office Wi-Fi)
              │                                           │
              ▼                                           ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 Frontend (Hosted on Vercel)                   │
  │               https://<your-app>.vercel.app                   │
  └───────────────────────────────┬───────────────────────────────┘
                                  │ HTTPS REST / Multipart
                                  ▼
  ┌───────────────────────────────────────────────────────────────┐
  │                 Backend (Hosted on Railway)                   │
  │             https://<your-api>.up.railway.app                 │
  │                                                               │
  │  - FastAPI + Uvicorn ($PORT dynamic binding)                  │
  │  - CORS configured for localhost + LAN + *.vercel.app         │
  │  - Ephemeral disk storage: `backend/storage/` (auto-cleaned)  │
  │  - In-memory room manager (auto-expires in 10 minutes)        │
  └───────────────────────────────────────────────────────────────┘
```

---

## 2. Deploying Backend to Railway

Railway runs our Python FastAPI server and exposes it with automatic HTTPS.

### Step 2.1: Create Service on Railway
1. Go to [railway.com](https://railway.com) and log in with your GitHub account.
2. Click **+ New Project** ➔ **Deploy from GitHub repo**.
3. Select your repository: `aditya-yadav1176/pigeon`.
4. Click **Deploy Now**.

### Step 2.2: Configure Service Settings
1. Click on the newly created service in your Railway canvas and go to the **Settings** tab.
2. In the **General** section:
   - If deploying from the repository root:
     - Ensure the repository has `railway.toml` (already included in the repo).
     - Or set **Custom Start Command**:
       ```bash
       uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --app-dir backend
       ```
   - Alternatively, if setting **Root Directory** to `backend`:
     - Set **Root Directory**: `backend`
     - Start Command will automatically use `backend/railway.toml` (`uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`).
3. In the **Networking** section:
   - Click **Generate Domain**.
   - Railway will provide a public URL like:
     `https://pigeon-production-xxxx.up.railway.app`
   - **Copy this URL** (you will need it for Vercel).

### Step 2.3: Verify Backend Deployment
Open your browser and navigate to:
- `https://<your-railway-url>/health` ➔ should return:
  ```json
  {"status": "ok", "app": "PIGEON"}
  ```
- `https://<your-railway-url>/docs` ➔ interactive Swagger UI will load.

---

## 3. Deploying Frontend to Vercel

Vercel hosts the React + TanStack Start frontend with lightning-fast global CDN delivery.

### Step 3.1: Import Project into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with GitHub.
2. Click **Add New...** ➔ **Project**.
3. Select `aditya-yadav1176/pigeon` from your GitHub repositories and click **Import**.

### Step 3.2: Configure Environment Variables
Under **Environment Variables**, add:
- **Key**: `VITE_API_BASE_URL`
- **Value**: `https://<your-railway-url>` (e.g. `https://pigeon-production-xxxx.up.railway.app`)
  *(Do NOT include a trailing slash)*
- **Key**: `NITRO_PRESET`
- **Value**: `vercel`

### Step 3.3: Deploy
1. Click **Deploy**.
2. Vercel will run `vite build` and configure the edge routes.
3. Once completed, Vercel gives you your public domain:
   `https://<your-app>.vercel.app`

---

## 4. Real Internet End-to-End Testing Protocol

> [!IMPORTANT]
> To truly verify public connectivity, ensure the **Phone is on cellular data (4G/5G)** and the **Laptop is on Wi-Fi**. Disconnect the phone from the local Wi-Fi.

### Test 1: Phone (Cellular) ➔ Laptop (Wi-Fi)
1. **On Phone (Cellular Data)**:
   - Open browser: `https://<your-app>.vercel.app`
   - Under **Send**, select a photo or enter a text note.
   - Click **Send across**.
   - Verify upload progress reaches 100% and a 6-character room code appears (e.g., `ABCD-EF`).
2. **On Laptop (Home/Office Wi-Fi)**:
   - Open browser: `https://<your-app>.vercel.app`
   - Click **Receive** tab.
   - Enter the code displayed on your phone.
   - Verify the file card appears with correct name, size, and type.
   - Click **Download** (or **Download All**).
   - Open downloaded file and confirm byte-for-byte integrity.

### Test 2: Reverse Transfer — Laptop (Wi-Fi) ➔ Phone (Cellular)
1. **On Laptop (Wi-Fi)**:
   - Drag and drop a PDF, image, or multi-file batch.
   - Click **Send across**.
   - Note the room code.
2. **On Phone (Cellular Data)**:
   - Go to **Receive** tab.
   - Type in the code.
   - Download the files to your phone.

### Test 3: Expiration & Edge Cases
1. Wait 10 minutes (room TTL) or enter an invalid code (e.g. `ZZZZ-99`).
2. Verify friendly error messaging ("That Pigeon code doesn't exist or has expired").

