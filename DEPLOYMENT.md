# 🚀 FixCity Deployment Guide

Because your application uses both a **Modern Web Frontend (Next.js)** and a **Heavy AI Backend (Python InsightFace)**, you cannot deploy everything to a single place like Vercel. Vercel cannot run long-running Python AI processes efficiently.

**The Solution:**
1.  **Frontend (Next.js)** → Deploy to **Vercel** (Best for React).
2.  **Backend (Python)** → Deploy to **Render** (Good for persistent Python apps).

> **Why not deploy Python to Vercel?**
> You referenced the [Vercel Python Runtime docs](https://vercel.com/docs/functions/runtimes/python). While Vercel supports Python, it is for **Serverless Functions**, which have strict limits:
> *   **Size Limit**: Max 250MB (unzipped). Our AI libraries (`insightface`, `onnxruntime`, `opencv`) + Models exceed ~500MB.
> *   **Timeout**: Max 10s (Hobby Plan). Loading the AI model takes 5-10s on every cold start, causing timeouts.
> *   **Persistence**: Vercel freezes/kills functions after use. We need the AI model to stay loaded in RAM for fast face verification.
> 
> Therefore, **Render** (which keeps the server running) is the correct choice for this AI workloads.

---

## Part 1: Deploy Python Face Server (Render)
Run this first so you get the URL to give to the frontend.

1.  Push your latest code to GitHub.
2.  Go to [dashboard.render.com](https://dashboard.render.com/) and create a new **Web Service**.
3.  Connect your GitHub repository (`FixCity`).
4.  **Configure the Service:**
    *   **Name**: `fixcity-face-server`
    *   **Root Directory**: `fixcity/python` (IMPORTANT! This tells Render where the python code is)
    *   **Environment**: `Python 3`
    *   **Build Command**: `pip install -r requirements.txt`
    *   **Start Command**: `uvicorn face_server:app --host 0.0.0.0 --port $PORT`
    *   **Plan**: Free (Note: InsightFace is heavy, if Free tier fails on memory, you might need the Starter plan).
5.  Click **Create Web Service**.
6.  Wait for it to deploy. Once live, copy the URL (e.g., `https://fixcity-face-api.onrender.com`).

---

## Part 2: Deploy Frontend (Vercel)

1.  Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
2.  Import your `FixCity` repository.
3.  **Framework Preset**: Next.js (Should auto-detect).
4.  **Root Directory**: `fixcity` (Verify if your next.config.ts is in this folder).
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
3.  Select **Officer Login** (which uses Face Auth).
4.  Try to verify.
    *   The Vercel App will call `api/auth/face-verify`.
    *   That API will proxy the request to your **Render Python Server**.
    *   The Render Server will process the image and return the result.

✅ **Done!** You now have a scalable, split-stack production app.
