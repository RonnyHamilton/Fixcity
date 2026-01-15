# 🚀 FixCity Deployment Guide

Because your application uses both a **Modern Web Frontend (Next.js)** and a **Heavy AI Backend (Python InsightFace)**, you cannot deploy everything to a single place asking Vercel.

**The Solution:**
1.  **Frontend (Next.js)** → Deploy to **Vercel** (Best for React).
2.  **Backend (Python)** → Deploy to **Render** (Good for persistent Python apps).

---

## Part 1: Deploy Python Face Server (Render)

### Option A: Use Blueprint (Recommended - Easiest)
I have created a `render.yaml` file for you.
1.  Push your latest code to GitHub.
2.  Go to Render > **New +** > **Blueprint**.
3.  Connect your `FixCity` repo.
4.  Click **Apply**. Render will automatically read the config and deploy correctly.

### Option B: Manual Setup (If Manual failed)
If you prefer manual setup and the previous settings failed, try this **Robust Method**:

1.  **Name**: `fixcity-face-server`
2.  **Root Directory**: `.` (Leave Empty / Default)
3.  **Environment**: `Python 3`
4.  **Build Command**: `pip install -r python/requirements.txt`
5.  **Start Command**: `cd python && uvicorn face_server:app --host 0.0.0.0 --port $PORT`

> **Note**: This runs everything from the project root, so we explicitly look inside the `python` folder. This avoids "File not found" errors.

---

## Part 2: Deploy Frontend (Vercel)

1.  Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
2.  Import your `FixCity` repository.
3.  **Framework Preset**: Next.js (Should auto-detect).
4.  **Root Directory**: `fixcity` (Verify if your next.config.ts is in this folder, if not leave empty).
    *NOTE:* Based on your file structure, your Next.js app is at the root. So leave **Root Directory** as `.` (default) or check where `package.json` is.
5.  **Environment Variables**:
    *   Add a new variable:
        *   **Key**: `FACE_API_URL`
        *   **Value**: Paste your Render URL from Part 1.
        *   *(Do not add a trailing slash)*
    *   Add other env vars like `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
6.  Click **Deploy**.

---

## Part 3: Verify Integration

1.  Open your new Vercel App URL.
2.  Go to the **Login Page**.
3.  Select **Officer Login**.
4.  Try to verify to confirm the two apps are talking!
