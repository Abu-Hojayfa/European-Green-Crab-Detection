const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001"
).replace(/\/$/, "");

/**
 * Build a full API URL for a given path.
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path) {
  return `${API_BASE_URL}${path}`;
}

/**
 * Build a full URL to a backend-hosted result file.
 * @param {string} path  e.g. "/results/abc.mp4"
 * @returns {string}
 */
export function resultFileUrl(path) {
  return new URL(path, `${API_BASE_URL}/`).href;
}

/**
 * Parse a fetch Response, throwing on non-OK status.
 * @param {Response} response
 * @returns {Promise<any>}
 */
async function parseResponse(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(
      body.message || body.error || "The backend could not complete this request."
    );
  }
  return body;
}

/**
 * Detect European crabs in an image.
 * @param {File} file
 * @param {AbortSignal} [signal]
 * @returns {Promise<{predictions: Array, count: number, annotatedImage: string}>}
 */
export async function detectImage(file, signal) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch(apiUrl("/api/images/detect"), {
    method: "POST",
    body: formData,
    signal,
  });
  return parseResponse(response);
}

/**
 * Create a video job by uploading a local file.
 * @param {File} file
 * @param {AbortSignal} [signal]
 * @returns {Promise<{jobId: string, status: string}>}
 */
export async function createLocalVideoJob(file, signal) {
  const formData = new FormData();
  formData.append("video", file);
  const response = await fetch(apiUrl("/api/video-jobs/local"), {
    method: "POST",
    body: formData,
    signal,
  });
  return parseResponse(response);
}

/**
 * Create a video job from a remote URL.
 * @param {string} url
 * @param {AbortSignal} [signal]
 * @returns {Promise<{jobId: string, status: string}>}
 */
export async function createVideoUrlJob(url, signal) {
  const response = await fetch(apiUrl("/api/video-jobs/url"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ videoUrl: url }),
    signal,
  });
  return parseResponse(response);
}

/**
 * Get the current status of a video job.
 * @param {string} jobId
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>}
 */
export async function getVideoJob(jobId, signal) {
  const response = await fetch(apiUrl(`/api/video-jobs/${jobId}`), { signal });
  return parseResponse(response);
}

/**
 * Poll a video job until it reaches a terminal state.
 * Uses exponential backoff: 2s → 4s → 8s → … → 15s cap.
 *
 * @param {string} jobId
 * @param {(job: Object) => void} onUpdate  called on every poll
 * @param {AbortSignal} [signal]
 * @returns {Promise<Object>} the terminal job object
 */
export async function pollVideoJob(jobId, onUpdate, signal) {
  let delay = 2000;
  const maxDelay = 15000;

  while (true) {
    const job = await getVideoJob(jobId, signal);
    onUpdate(job);

    if (job.status === "completed" || job.status === "failed") {
      return job;
    }

    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, delay);
      if (signal) {
        signal.addEventListener(
          "abort",
          () => {
            clearTimeout(timer);
            reject(signal.reason || new DOMException("Aborted", "AbortError"));
          },
          { once: true }
        );
      }
    });

    delay = Math.min(delay * 1.5, maxDelay);
  }
}
