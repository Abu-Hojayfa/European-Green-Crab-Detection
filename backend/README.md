# European Crab Detector Backend

The Node.js Express API and Python worker for detecting European crabs.

## Features
- Base64 image proxy to Roboflow Workflows
- Video job queue with Python WebRTC frame processing
- SSRF-protected video downloading

## Requirements
- Node.js 20+
- Python 3+
- ffmpeg (if needed for transcoding, though OpenCV handles basic mp4v)
- OpenCV system dependencies

## Running Locally

1. `npm install`
2. `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and add your `ROBOFLOW_API_KEY`.
4. `npm run dev`

## Docker
Run the Docker build from within the `backend` directory:
```bash
docker build -t european-crab-detector-backend .
docker run -p 3001:3001 --env-file .env european-crab-detector-backend
```
