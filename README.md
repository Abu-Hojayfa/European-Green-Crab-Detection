# European Crab Detector

A full-stack application for detecting European crabs in images and uniquely counting them across video files using AI computer vision.

## Architecture

This project is a monorepo containing two distinct applications:

- **`frontend/`**: A React Single Page Application built with Vite and Tailwind CSS.
- **`backend/`**: A Node.js Express server that manages uploads, interfaces with the Roboflow API for images, and spawns a Python worker for video processing.

### Directory Structure

```text
/
├── frontend/             # React SPA
│   ├── src/              # React components and API library
│   ├── public/           # Static assets
│   └── netlify.toml      # Netlify deployment configuration
│
├── backend/              # Express API
│   ├── src/              # Routes, services, and middleware
│   ├── worker/           # Python video processing worker
│   ├── storage/          # Temporary uploads and processed video results
│   └── Dockerfile        # Production Docker configuration
```

## Prerequisites

- **Node.js**: v20 or later
- **npm**: v10 or later
- **Python**: 3.8 or later (for the video worker)
- **OpenCV System Dependencies**: Required for the Python worker (e.g., `libgl1-mesa-glx` on Linux)
- **Roboflow API Key**: Required for the backend to access the tracking workflow.

## Local Installation

1. **Install Node dependencies** for the root, frontend, and backend:
   ```bash
   npm run install:all
   ```

2. **Install Python dependencies** for the backend worker:
   ```bash
   # Optional: Create a virtual environment first
   # python -m venv venv && source venv/bin/activate
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

## Environment Configuration

Copy the example environment files and fill in your details.

**Frontend** (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:3001
```

**Backend** (`backend/.env`):
```env
ROBOFLOW_API_KEY=your_roboflow_api_key_here
ROBOFLOW_WORKSPACE=your_workspace
ROBOFLOW_PROJECT=your_project
ROBOFLOW_VERSION=your_version
PORT=3001
FRONTEND_ORIGINS=http://localhost:5173
PYTHON_COMMAND=python3
MAX_IMAGE_SIZE_MB=10
MAX_VIDEO_SIZE_MB=500
MAX_REMOTE_VIDEO_SIZE_MB=500
VIDEO_JOB_RETENTION_HOURS=24
VIDEO_JOB_CONCURRENCY=1
VIDEO_PROCESSING_TIMEOUT_MINUTES=60
```
*Note: Never commit your real API keys to version control.*

## Development Commands

Run both the frontend and backend simultaneously in development mode:
```bash
npm run dev
```

Other available root scripts:
- `npm run build`: Builds the frontend for production.
- `npm run start:backend`: Starts the backend server.
- `npm run clean`: Removes all `node_modules` and build directories.

## API Overview

### Image API
- `POST /api/images/detect`
  - Accepts `multipart/form-data` with an `image` file.
  - Proxies to the Roboflow API and filters results to `european_crab`.
  - Returns normalized predictions and a base64 annotated image.

### Video-Job API
- `POST /api/video-jobs/local`
  - Accepts `multipart/form-data` with a `video` file.
  - Returns HTTP 202 with a `jobId`.
- `POST /api/video-jobs/url`
  - Accepts JSON with a `videoUrl` (SSRF protected).
  - Returns HTTP 202 with a `jobId`.
- `GET /api/video-jobs/:jobId`
  - Returns the current job status (`queued`, `running`, `completed`, `failed`).
  - If `completed`, returns the unique crab count and a URL to the processed video.

## Security Considerations

- **SSRF Protection**: The backend validates DNS resolution, rejects private IP ranges (including loopback and link-local), and enforces byte limits when downloading remote video URLs.
- **No Frontend Secrets**: The Roboflow API key is stored only on the backend.
- **Temporary Storage**: Uploaded source videos are deleted immediately after processing (pass or fail). Processed result videos are deleted after the configured retention period (default 24 hours).

## Deployment

### Netlify Frontend Deployment
Connect the repository to Netlify and use these settings:
- **Base directory**: `frontend`
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Environment variables**: Set `VITE_API_BASE_URL` to your deployed backend URL.

### Render/Docker Backend Deployment
Deploy the backend as a Docker service on Render (or similar):
- **Root Directory**: `backend`
- **Environment**: Docker
- **Environment variables**: Set `ROBOFLOW_API_KEY`, `ROBOFLOW_WORKSPACE`, `ROBOFLOW_PROJECT`, `ROBOFLOW_VERSION`, and `FRONTEND_ORIGINS` (to your Netlify URL).
- The provided `Dockerfile` installs Node, Python, ffmpeg, and all required system libraries.

## Current Limitations

> **Note on Video Counting:** The video tracking integration uses the `inference-sdk` WebRTC API. Full validation of the unique crab counting logic requires representative European crab footage and a valid Roboflow API key. Before trusting the counts in a production environment, test with known-quantity footage.

> **Note on Scaling:** The current video job queue uses an in-memory registry (`videoJobService.js`). For production environments with multiple backend instances, this must be replaced with a persistent datastore (like Redis/BullMQ) and object storage (like AWS S3) for the video files.
