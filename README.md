# 🦀 Crab Vision — European Green Crab Detector

**[Live Demo](https://green-crab-detector.netlify.app/)** | **[Frontend Repo](https://github.com/Abu-Hojayfa/European-Green-Crab-Detection/tree/main/frontend)**

An AI-powered full-stack web application for detecting and counting **European green crabs** (*Carcinus maenas*) in images and tracking them uniquely across video footage. Built to support field researchers and environmental monitoring teams working on invasive species management.

---

## Features

- **Image Analysis** — Upload a photo and receive bounding boxes drawn directly on the image for every European crab detected, along with confidence scores.
- **Live Confidence Threshold** — Adjust the minimum detection confidence with a real-time slider. The canvas re-renders instantly — no re-uploads needed.
- **All-class Detection** — European crabs are highlighted in cyan with bounding boxes. Other detected classes are listed separately in amber. 
- **Video Tracking** — Upload a local video file or provide a direct URL. The Python worker tracks each crab uniquely across frames (counts each crab once).
- **Privacy-first** — Media is sent only to your own configured Roboflow endpoint. API keys live only on the backend.

---

## Architecture

This is a monorepo with two applications:

| Layer | Tech |
|---|---|
| **Frontend** | React + Vite + Tailwind CSS |
| **Backend** | Node.js + Express (single `server.js`) |
| **AI** | Roboflow Serverless Workflows |
| **Video Worker** | Python + OpenCV + `inference-sdk` |

### Directory Structure

```text
/
├── frontend/               # React SPA (Vite)
│   ├── src/
│   │   ├── components/     # UI components (ImageResult, VideoResult, etc.)
│   │   └── lib/api.js      # API client
│   ├── index.html          # Entry point with SEO meta tags
│   └── netlify.toml        # Netlify deploy config
│
├── backend/
│   ├── src/
│   │   └── server.js       # Single-file Express server (all routes + config)
│   ├── worker/
│   │   └── video_worker.py # Python video processor (tracking + counting)
│   ├── storage/
│   │   ├── uploads/        # Temporary upload staging (auto-deleted)
│   │   └── results/        # Processed video output (24hr retention)
│   └── Dockerfile
```

---

## Prerequisites

- **Node.js** v20+
- **npm** v10+
- **Python** 3.8+ (for video worker)
- **Roboflow API Key** with access to your workflow

---

## Setup

### 1. Install dependencies

```bash
npm run install:all
```

Then install Python dependencies:
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure environment

**Frontend** — create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Backend** — create `backend/.env`:
```env
# Required
ROBOFLOW_API_KEY=your_roboflow_api_key_here
ROBOFLOW_WORKFLOW_URL=https://serverless.roboflow.com/your-workspace/workflows/your-workflow-id

# Server
PORT=3001
FRONTEND_ORIGINS=http://localhost:5173

# Limits
PYTHON_COMMAND=python3
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=500
MAX_REMOTE_VIDEO_SIZE_MB=500
VIDEO_JOB_RETENTION_HOURS=24
VIDEO_PROCESSING_TIMEOUT_MINUTES=60
```

> ⚠️ Never commit real API keys. Both `.env` files are in `.gitignore`.

### 3. Run in development

```bash
npm run dev
```

Starts the backend (nodemon) and the Vite frontend simultaneously.

---

## API Reference

### Image Detection

```
POST /api/images/detect
Content-Type: multipart/form-data

image: <file>          # must be image/*, max 10 MB
```

**Response:**
```json
{
  "predictions": [
    { "class": "european_crab", "confidence": 0.88, "x": 159, "y": 395, "width": 102, "height": 91 }
  ],
  "count": 3,
  "annotatedImage": "data:image/jpeg;base64,..."
}
```

All classes returned — filtering by threshold and highlighting happens client-side.

### Video Jobs

```
POST /api/video-jobs/local        # multipart/form-data, video file, max 500 MB
POST /api/video-jobs/url          # JSON body { videoUrl: "https://..." }
GET  /api/video-jobs/:jobId       # Poll status: queued | running | completed | failed
```

### Health Check
```
GET /health   →  { status: "ok", timestamp: "..." }
```

---

## Validation & Security

| Check | Where |
|---|---|
| Image MIME type (`image/*`) | Backend multer `fileFilter` |
| Video MIME type (`video/*`) | Backend multer `fileFilter` |
| File size limits | Backend multer `limits` |
| Rate limiting (100 req/15 min) | Backend `express-rate-limit` |
| Invalid video URL | Backend 400 response |
| CORS origin restriction | Backend `cors` middleware |
| API key isolation | Backend only — never sent to frontend |

Invalid file types (PDFs, executables, etc.) are rejected immediately with a `400` error before any data is processed.

---

## Deployment

### Frontend — Netlify

The frontend is continuously deployed to Netlify: **[https://green-crab-detector.netlify.app/](https://green-crab-detector.netlify.app/)**

| Setting | Value |
|---|---|
| Base directory | `frontend` |
| Build command | `npm run build` |
| Publish directory | `dist` |
| Env var | `VITE_API_BASE_URL=https://european-green-crab-detection.onrender.com` |

### Backend — Docker / Render

```bash
cd backend
docker build -t crab-vision-backend .
docker run -p 3001:3001 --env-file .env crab-vision-backend
```

Set these environment variables on your hosting platform:
- `ROBOFLOW_API_KEY`
- `ROBOFLOW_WORKFLOW_URL`
- `FRONTEND_ORIGINS` (your Netlify URL)

---

## Known Limitations

> **Video counting accuracy** depends on representative footage. The unique-crab tracking relies on the Roboflow `inference-sdk` tracker. Validate results with known-quantity footage before field deployment.

> **In-memory job queue** — the video job registry lives in RAM. Server restarts clear all queued/running jobs. For production scale, replace with Redis/BullMQ and object storage (S3/GCS).
