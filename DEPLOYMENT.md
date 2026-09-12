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
  │              FastAPI Backend (Hosted on Render)               │
  │              https://<your-api>.onrender.com                  │
  │                                                               │
  │  - FastAPI + Uvicorn ($PORT dynamic binding from Render)      │
  │  - CORS configured for localhost + LAN + *.vercel.app         │
  │  - Temporary local disk storage: `backend/storage/`           │
  │  - In-memory room manager (auto-expires in 10 minutes)        │
  └───────────────────────────────────────────────────────────────┘
```

---

## 2. Deploying Backend to Render

Render hosts the Python FastAPI server as a **Web Service** with automatic HTTPS and dynamic `$PORT` assignment.

### Step 2.1: Create Web Service on Render
1. Go to [render.com](https://render.com) and log in with your GitHub account.
2. Click **New +** ➔ **Web Service**.
3. Select your repository: `aditya-yadav1176/pigeon`.
4. Configure the service:
   - **Name**: `pigeon-backend` (or any unique name you prefer)
   - **Region**: Choose the region closest to you (e.g., Oregon, Frankfurt, Singapore)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```
   - **Instance Type**: `Free`

### Step 2.2: Set Environment Variables (Backend)
Under the **Environment Variables** section on Render, configure:
- **`PYTHON_VERSION`**: `3.11.0` (or `3.10` / `3.12`)
- **`CORS_ORIGINS`**: `https://YOUR-PIGEON-VERCEL-DOMAIN.vercel.app`
  *(You can also set this after creating the Vercel app. Wildcard `*.vercel.app` regex is already built-in to FastAPI for convenience, but setting your exact domain is best practice.)*

### Step 2.3: Deploy and Verify Backend
1. Click **Create Web Service**.
2. Wait for Render to install requirements and start Uvicorn.
3. Once deployed, Render will provide a public URL:
   `https://<your-backend-name>.onrender.com`
4. Test the health endpoint in your browser or terminal:
   ```
   https://<your-backend-name>.onrender.com/health
   ```
   Expected response:
   ```json
   {"status": "ok", "app": "PIGEON"}
   ```
5. You can also view the interactive Swagger docs at:
   ```
   https://<your-backend-name>.onrender.com/docs
   ```

---

## 3. Deploying Frontend to Vercel

Vercel hosts the React + TanStack Start frontend with global edge CDN delivery.

### Step 3.1: Import Project into Vercel
1. Go to [vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** ➔ **Project**.
3. Select `aditya-yadav1176/pigeon` from your GitHub repositories and click **Import**.

### Step 3.2: Configure Environment Variables (Frontend)
Under **Environment Variables**, add:
- **`VITE_API_BASE_URL`**: `https://<your-backend-name>.onrender.com`
  *(IMPORTANT: Do NOT include a trailing slash, and do NOT use localhost)*
- **`NITRO_PRESET`**: `vercel`

### Step 3.3: Deploy
1. Click **Deploy**.
2. Vercel will run `vite build` and configure the edge routes.
3. Once completed, Vercel provides your public domain:
   `https://<your-app-name>.vercel.app`

*(Optional but recommended: update the Render backend environment variable `CORS_ORIGINS` with this exact Vercel URL).*

---

## 4. Important Operational Limitations

### A. Render Free Tier Spin-Down
- **Inactivity Sleep**: Render Free Web Services automatically spin down ("sleep") after 15 minutes of inactivity.
- **Cold Start Delay**: If sleeping, the first incoming request may take 30–60 seconds to wake up the server. Subsequent requests will be fast.
- This is standard and expected for Phase 7 testing.

### B. Temporary Filesystem Storage (Phase 10 Hardened Lifecycle)
- All transferred files are stored temporarily on the local disk (`backend/storage/<room_code>/`).
- **Render Ephemeral Disk Warning**: Render container filesystems are strictly ephemeral. Any files and in-memory rooms will reset if the Render instance restarts, sleeps due to inactivity, or redeploys.
- **Automated Lifecycle Purge**:
  1. Room TTL (10 minutes) automatically expires active transfers.
  2. The background cleanup loop runs every 30 seconds to wipe expired room metadata and run `shutil.rmtree` on disk storage.
  3. Orphaned disk directories from past crashes, aborted client sessions, or server restarts are automatically detected and purged on boot and during periodic sweeps.
- **No Cloud Database or S3**: PIGEON is designed without persistent database or object storage dependencies in this phase.

---

## 5. Real Internet End-to-End Testing Protocol

> [!IMPORTANT]
> To truly verify public internet connectivity, ensure the **Phone is on cellular data (4G/5G)** and the **Laptop is on Wi-Fi**. Disconnect the phone from the local Wi-Fi.

### Test 1: Phone (Cellular Data) ➔ Laptop (Wi-Fi)
1. **On Phone (Cellular Data)**:
   - Open browser: `https://<your-app-name>.vercel.app`
   - In the **Send** tab, tap to select a photo, document, or paste a note.
   - Tap **Send across**.
   - Verify upload progress bar reaches 100% and a 5-character room code appears (e.g., `K7M4P`).
2. **On Laptop (Home/Office Wi-Fi)**:
   - Open browser: `https://<your-app-name>.vercel.app`
   - Click **Receive** tab.
   - Enter the 5-character code displayed on your phone.
   - Verify the file cards appear with accurate name, size, and type.
   - Click **Download** (or **Download All**).
   - Open downloaded file and confirm byte-for-byte integrity.

### Test 2: Reverse Transfer — Laptop (Wi-Fi) ➔ Phone (Cellular Data)
1. **On Laptop (Wi-Fi)**:
   - Select or drag and drop files into the **Send** tab.
   - Click **Send across**.
   - Note the generated 5-character room code.
2. **On Phone (Cellular Data)**:
   - Go to **Receive** tab.
   - Type in the code.
   - Download the files directly to your phone.

### Test 3: Expiration & Edge Cases
1. Wait 10 minutes (room TTL) or enter an invalid code (e.g., `ZZ999`).
2. Verify friendly error messaging ("That Pigeon code doesn't exist or has expired. Ask the sender for a fresh code.").

