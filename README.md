# 🏙️ FixCity — Smart City Issue Reporting & Resolution Platform

FixCity is a smart city complaint & maintenance management platform where **citizens can report public issues**, and **officers/technicians can assign and resolve them efficiently**.

🚀 Live Website: https://fixcity-chi.vercel.app/

---

## ✨ Key Features

### 👤 Citizen Portal
- ✅ Report city issues (potholes, garbage, streetlight, water leakage, etc.)
- ✅ Upload issue image + auto / manual location details
- ✅ Track report status: `Pending → In Progress → Resolved`
- ✅ View assigned technician details (when assigned)
- ✅ Delete reports (only when status is `pending`)

### 🧑‍💼 Officer Dashboard
- ✅ View complaints submitted by citizens
- ✅ Assign reports to technicians
- ✅ Update report status + add resolution notes
- ✅ Prioritize tasks by urgency and category

### 🧑‍🔧 Technician Dashboard
- ✅ View assigned tasks
- ✅ Mark issues as resolved
- ✅ Updates reflect instantly for citizens + officers

### 🔐 Face Verification Login (AI)
- ✅ Face verification integrated for Officer/Technician login
- ✅ Uses InsightFace embeddings + similarity matching
- ✅ Deployed via Hugging Face Spaces FastAPI backend

---

## 🧠 Tech Stack

### Frontend
- **Next.js (App Router)**
- **TypeScript**
- **Tailwind CSS**
- **Lucide Icons**

### Backend & Database
- **Supabase** (Database + Storage)

### AI (Face Verification)
- **FastAPI**
- **InsightFace (Buffalo Model)**
- Hosted on **Hugging Face Spaces (Docker Space)**

---

## 🔁 Workflow (How FixCity Works)

1. A citizen submits a report with image + location  
2. The report is stored in **Supabase**  
3. Officer reviews reports and assigns a technician  
4. Technician receives the job in their dashboard  
5. Once resolved, the status updates for:
   - ✅ Citizen
   - ✅ Officer
   - ✅ Technician

---

## 🔑 Environment Variables

Create a `.env.local` file in your Next.js root project and add:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Face verification backend URL
FACE_API_URL=https://your-face-api-url
