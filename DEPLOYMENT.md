# 🚀 FixCity Deployment Guide

Because your application uses both a **Modern Web Frontend (Next.js)** and a **Heavy AI Backend (Python InsightFace)**, you cannot deploy everything to a single place asking Vercel.

**The Solution:**
1.  **Frontend (Next.js)** → Deploy to **Vercel** (Best for React).
2.  **Backend (Python)** → Deploy to **Render** or **Hugging Face Spaces** (Good for AI apps).

---

## Part 1: Deploy Python Face Server

### Option A: Hugging Face Spaces (Recommended - Free & Easy)
1.  Create a new Space at [huggingface.co/spaces](https://huggingface.co/new-space)
2.  **Space Name**: `fixcity-face-api` (or any name)
3.  **SDK**: Select **Gradio** or **FastAPI** (choose FastAPI)
4.  Clone the space locally or use the web editor
5.  Upload your `python/face_server.py` and `python/requirements.txt`
6.  Add your reference images to the space
7.  The space will auto-deploy and give you a URL like: `https://username-fixcity-face-api.hf.space`

### Option B: Render (Alternative)
1.  Push your latest code to GitHub.
2.  Go to Render > **New +** > **Blueprint**.
3.  Connect your `FixCity` repo.
4.  Click **Apply**. Render will automatically read the config and deploy correctly.

**Manual Setup (If Blueprint failed):**
1.  **Name**: `fixcity-face-server`
2.  **Root Directory**: `.` (Leave Empty / Default)
3.  **Environment**: `Python 3`
4.  **Build Command**: `pip install -r python/requirements.txt`
5.  **Start Command**: `cd python && uvicorn face_server:app --host 0.0.0.0 --port $PORT`

---

## Part 2: Deploy Frontend (Vercel)

1.  Go to [vercel.com](https://vercel.com/) and click **Add New > Project**.
2.  Import your `FixCity` repository.
3.  **Framework Preset**: Next.js (Should auto-detect).
4.  **Root Directory**: `.` (default) - where `package.json` is located.
5.  **Environment Variables**:
    *   Add a new variable:
        *   **Key**: `FACE_API_URL`
        *   **Value**: Your backend URL (NO trailing slash!)
        *   **Examples**:
            - Hugging Face: `https://username-fixcity-face-api.hf.space`
            - Render: `https://fixcity-face-server.onrender.com`
    *   Add other env vars like `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `HUGGINGFACE_API_KEY`, etc.
6.  Click **Deploy**.

**⚠️ Important**: The code will automatically remove any trailing slash from `FACE_API_URL`, so don't worry if you accidentally add one.

---

## Part 3: Verify Integration

1.  Open your new Vercel App URL.
2.  Go to the **Login Page**.
3.  Select **Officer Login**.
4.  Try face verification to confirm the two apps are talking!

### Endpoints to Test:
- **Health Check**: `GET https://your-backend-url/health` → Should return `{"status": "ok"}`
- **Root**: `GET https://your-backend-url/` → Should return `{"status": "FixCity Face Server Running ✅"}`
- **Verify Face**: `POST https://your-backend-url/verify-face` → Requires JSON body with `badge_id`, `image`, `user_type`

---

## Troubleshooting

**Issue**: "Face verification service error: 404"
- **Solution**: Make sure `FACE_API_URL` points to the correct backend URL without trailing slash
- **Verify**: Check that `/verify-face` endpoint exists and returns JSON

**Issue**: "Python server unavailable"
- **Solution**: The app will automatically fallback to Hugging Face Image Classification API if you have `HUGGINGFACE_API_KEY` set

**Issue**: "Reference image not found"
- **Solution**: Upload officer/technician face images to `/data/officer-faces/` or `/data/technician-faces/` in your backend deployment
