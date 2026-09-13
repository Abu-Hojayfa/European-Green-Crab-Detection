import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { Readable } from "node:stream";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --- CONFIGURATION ---
const roboflowWorkflowUrl = process.env.ROBOFLOW_WORKFLOW_URL || "";
let roboflowWorkspace = "";
let roboflowWorkflow = "";
try {
  const urlParts = new URL(roboflowWorkflowUrl).pathname.split('/');
  roboflowWorkspace = urlParts[1];
  roboflowWorkflow = urlParts[3];
} catch (e) {
  console.warn("Could not parse ROBOFLOW_WORKFLOW_URL for worker args.");
}

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  roboflowApiKey: process.env.ROBOFLOW_API_KEY,
  roboflowWorkflowUrl,
  roboflowWorkspace,
  roboflowWorkflow,
  frontendOrigins: (process.env.FRONTEND_ORIGINS || "http://localhost:5173").split(",").map(o => o.trim()),
  pythonCommand: process.env.PYTHON_COMMAND || "python3",
  maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB, 10) || 10,
  maxVideoSizeMb: parseInt(process.env.MAX_VIDEO_SIZE_MB, 10) || 500,
  uploadsDir: path.resolve(__dirname, "../storage/uploads"),
  resultsDir: path.resolve(__dirname, "../storage/results"),
  workerScript: path.resolve(__dirname, "../worker/video_worker.py"),
};

if (!config.roboflowApiKey) console.warn("WARNING: ROBOFLOW_API_KEY is not set.");

await fs.mkdir(config.uploadsDir, { recursive: true });
await fs.mkdir(config.resultsDir, { recursive: true });

async function safeDelete(filePath) {
  try { await fs.unlink(filePath); } catch (e) {}
}

const app = express();
app.use(helmet());
app.use(cors({ origin: config.frontendOrigins }));
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use("/results", helmet.crossOriginResourcePolicy({ policy: "cross-origin" }), express.static(config.resultsDir, { maxAge: "1d" }));

// --- ROUTES ---
app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "european-crab-detector-backend", timestamp: new Date().toISOString() });
});

// Image Upload
const uploadImage = multer({
  dest: config.uploadsDir,
  limits: { fileSize: config.maxImageSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Invalid file type. Only images are allowed."));
  }
});
app.post("/api/images/detect", uploadImage.single("image"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No image file provided." });
  
  try {
    const buffer = await fs.readFile(req.file.path);
    const base64Image = buffer.toString("base64");

    const response = await fetch(config.roboflowWorkflowUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${config.roboflowApiKey}` },
      body: JSON.stringify({ inputs: { image: { type: "base64", value: base64Image } } }),
    });

    if (!response.ok) throw new Error("Image analysis failed.");

    const data = await response.json();

    // ── Log the raw Roboflow response (truncate base64 blobs for readability) ──
    const debugData = JSON.parse(JSON.stringify(data, (key, val) => {
      if (typeof val === "string" && val.length > 200) return `[base64 ~${Math.round(val.length / 1024)}KB]`;
      return val;
    }));
    console.log("[roboflow] Raw response:\n", JSON.stringify(debugData, null, 2));

    // Actual response shape: [{ predictions: { predictions: [...] }, crab_count: N, output_image: { type, value } }]
    const item = Array.isArray(data) ? data[0] : (data?.outputs?.[0] || data);

    // predictions can be an object with a nested predictions array
    const rawPredictions = item?.predictions?.predictions || item?.predictions || [];
    const predictions = (Array.isArray(rawPredictions) ? rawPredictions : [])
      .map(p => ({
        x: p.x, y: p.y, width: p.width, height: p.height,
        confidence: p.confidence,
        class: (p.class || p.class_name || "unknown").toLowerCase(),
        ...(p.tracker_id != null ? { tracker_id: p.tracker_id } : {}),
      }));

    // output_image can be { type: "base64", value: "..." } or a plain base64 string
    const rawImage = item?.output_image;
    let annotatedImage = null;
    if (rawImage) {
      const val = typeof rawImage === "object" ? rawImage.value : rawImage;
      annotatedImage = val ? (val.startsWith("data:") ? val : `data:image/jpeg;base64,${val}`) : null;
    }

    res.json({ predictions, count: predictions.length, annotatedImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error." });
  } finally {
    await safeDelete(req.file.path);
  }
});

// Video Jobs (In Memory Queue)
const jobs = new Map();

function enqueueJob(sourceVideoPath) {
  const jobId = randomUUID();
  jobs.set(jobId, { jobId, status: "queued", sourcePath: sourceVideoPath, createdAt: new Date().toISOString() });
  processJob(jobId);
  return jobId;
}

async function processJob(jobId) {
  const job = jobs.get(jobId);
  if (!job) return;
  job.status = "running";
  
  const resultFilename = `${jobId}.mp4`;
  const resultPath = path.join(config.resultsDir, resultFilename);

  try {
    const result = await new Promise((resolve, reject) => {
      let outputBuffer = "";
      const args = [config.workerScript, "--input", job.sourcePath, "--output", resultPath, "--workspace", config.roboflowWorkspace, "--workflow", config.roboflowWorkflow];
      const worker = spawn(config.pythonCommand, args, { env: { ...process.env, ROBOFLOW_API_KEY: config.roboflowApiKey } });

      worker.stdout.on("data", (data) => outputBuffer += data.toString());
      worker.stderr.on("data", (data) => console.error(`[worker] ${data}`));

      worker.on("close", (code) => {
        if (code !== 0) return reject(new Error("Video processing failed internally."));
        const lines = outputBuffer.trim().split("\n");
        try {
          resolve(JSON.parse(lines[lines.length - 1]));
        } catch (err) {
          reject(new Error("Failed to parse worker output."));
        }
      });
      worker.on("error", () => reject(new Error("Failed to start the video processing engine.")));
    });

    job.status = "completed";
    job.uniqueCrabCount = result.uniqueCrabCount;
    job.processedFrames = result.processedFrames;
    job.videoUrl = `/results/${resultFilename}`;
    job.completedAt = new Date().toISOString();
  } catch (err) {
    job.status = "failed";
    job.error = err.message;
    job.completedAt = new Date().toISOString();
    await safeDelete(resultPath);
  } finally {
    await safeDelete(job.sourcePath);
  }
}

// Upload Local Video
const uploadVideo = multer({
  dest: config.uploadsDir,
  limits: { fileSize: config.maxVideoSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) cb(null, true);
    else cb(new Error("Invalid file type. Only videos are allowed."));
  }
});
app.post("/api/video-jobs/local", uploadVideo.single("video"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No video file provided." });
  const jobId = enqueueJob(req.file.path);
  res.status(202).json({ jobId, status: "queued" });
});

// Upload Video via URL (Simplified)
app.post("/api/video-jobs/url", async (req, res) => {
  const { videoUrl } = req.body;
  if (!videoUrl || typeof videoUrl !== "string") return res.status(400).json({ error: "Missing videoUrl" });

  try {
    const response = await fetch(videoUrl);
    if (!response.ok) return res.status(400).json({ error: "Failed to download video." });

    const destPath = path.join(config.uploadsDir, `${randomUUID()}.mp4`);
    const writer = createWriteStream(destPath);
    await pipeline(Readable.fromWeb(response.body), writer);

    const jobId = enqueueJob(destPath);
    res.status(202).json({ jobId, status: "queued" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Invalid video URL or download failed." });
  }
});

// Get Job Status
app.get("/api/video-jobs/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({ error: "Job not found." });
  const { sourcePath, ...safeJob } = job;
  res.json(safeJob);
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File too large." });
  console.error("[unhandled]", err);
  res.status(500).json({ error: "Internal server error." });
});

// --- START SERVER ---
const server = app.listen(config.port, () => {
  console.log(`[server] Listening on port ${config.port}`);
});

// Cleanup old jobs every hour
setInterval(() => {
  const now = Date.now();
  for (const [jobId, job] of jobs.entries()) {
    if (now - new Date(job.createdAt).getTime() > 24 * 60 * 60 * 1000) {
      if (job.videoUrl) safeDelete(path.join(config.resultsDir, path.basename(job.videoUrl)));
      jobs.delete(jobId);
    }
  }
}, 60 * 60 * 1000);

process.on("SIGINT", () => server.close(() => process.exit(0)));
process.on("SIGTERM", () => server.close(() => process.exit(0)));
