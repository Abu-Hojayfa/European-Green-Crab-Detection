import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight } from "lucide-react";
import InputTabs from "@/components/InputTabs.jsx";
import ImageUploader from "@/components/ImageUploader.jsx";
import LocalVideoUploader from "@/components/LocalVideoUploader.jsx";
import VideoUrlForm from "@/components/VideoUrlForm.jsx";
import LoadingState from "@/components/LoadingState.jsx";
import ErrorAlert from "@/components/ErrorAlert.jsx";
import ImageResult from "@/components/ImageResult.jsx";
import VideoResult from "@/components/VideoResult.jsx";
import {
  detectImage,
  createLocalVideoJob,
  createVideoUrlJob,
  pollVideoJob,
  resultFileUrl,
} from "@/lib/api.js";

const MAX_IMAGE_SIZE   = 10 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 45_000;
const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/quicktime", "video/webm", "video/x-m4v"];

export default function App() {
  const [activeTab,       setActiveTab]       = useState("image");
  const [selectedImage,   setSelectedImage]   = useState(null);
  const [selectedVideo,   setSelectedVideo]   = useState(null);
  const [videoUrl,        setVideoUrl]        = useState("");
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState("");
  const [imageResult,     setImageResult]     = useState(null);
  const [videoResult,     setVideoResult]     = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [jobStatus,       setJobStatus]       = useState("");

  const abortRef = useRef(null);

  useEffect(() => {
    if (!selectedImage) { setImagePreviewUrl(""); return; }
    const url = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedImage]);

  useEffect(() => {
    if (!selectedVideo) { setVideoPreviewUrl(""); return; }
    const url = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);

  useEffect(() => () => { if (abortRef.current) abortRef.current.abort(); }, []);

  const cancelPending = useCallback(() => {
    if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
  }, []);

  const selectTab = useCallback((tab) => {
    cancelPending();
    setActiveTab(tab); setError(""); setImageResult(null);
    setVideoResult(null); setLoading(false); setJobStatus("");
  }, [cancelPending]);

  const reset = useCallback(() => {
    cancelPending();
    setError(""); setImageResult(null); setVideoResult(null);
    setLoading(false); setJobStatus("");
  }, [cancelPending]);

  const chooseImage = useCallback((file) => {
    reset();
    if (!file.type.startsWith("image/")) return setError("Please choose a supported image file.");
    if (file.size > MAX_IMAGE_SIZE)        return setError("Image too large. Max 10 MB.");
    setSelectedImage(file);
  }, [reset]);

  const chooseVideo = useCallback((file) => {
    reset();
    if (!ALLOWED_VIDEO_TYPES.includes(file.type))
      return setError("Please choose an MP4, MOV, WebM, or M4V video.");
    setSelectedVideo(file);
  }, [reset]);

  const detect = useCallback(async () => {
    if (!selectedImage) return;
    cancelPending();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);
    setLoading(true); setError("");
    try {
      setImageResult(await detectImage(selectedImage, controller.signal));
    } catch (err) {
      if (err?.name === "AbortError") setError("Request timed out. Please try again.");
      else setError(err instanceof Error ? err.message : "Detection failed. Please try again.");
    } finally {
      window.clearTimeout(timeout); setLoading(false); abortRef.current = null;
    }
  }, [selectedImage, cancelPending]);

  const processVideo = useCallback(async () => {
    cancelPending();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true); setError(""); setJobStatus("Uploading…");
    try {
      const job = activeTab === "local-video" && selectedVideo
        ? await createLocalVideoJob(selectedVideo, controller.signal)
        : await createVideoUrlJob(videoUrl.trim(), controller.signal);
      setJobStatus("Processing video…");
      const finalJob = await pollVideoJob(job.jobId, (u) => {
        if (u.status === "running") setJobStatus("Processing… This may take several minutes.");
      }, controller.signal);
      if (finalJob.status === "failed") setError(finalJob.error || "Video processing failed.");
      else setVideoResult(finalJob);
    } catch (err) {
      if (!(err?.name === "AbortError")) setError(err instanceof Error ? err.message : "Video processing failed.");
    } finally {
      setLoading(false); setJobStatus(""); abortRef.current = null;
    }
  }, [activeTab, selectedVideo, videoUrl, cancelPending]);

  const submitVideo = useCallback(() => {
    if (activeTab === "local-video" && !selectedVideo) return;
    if (activeTab === "video-url" && !/^https?:\/\//i.test(videoUrl.trim()))
      return setError("Enter a valid URL beginning with http:// or https://.");
    processVideo();
  }, [activeTab, selectedVideo, videoUrl, processVideo]);

  const hasResult = imageResult || videoResult;

  return (
    <div className="min-h-screen bg-[#050d18] text-slate-100 flex flex-col">

      {/* ── Compact top nav ── */}
      <header className="flex items-center gap-3 px-6 py-4 border-b border-white/5">
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="text-sm font-bold tracking-wide text-white">European Crab Detector</span>
        <span className="ml-auto text-xs text-slate-600">Powered by Roboflow</span>
      </header>

      {/* ── Main content ── */}
      <main className="flex flex-1 items-start justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-3xl space-y-5">

          {/* Mode tabs */}
          <InputTabs activeTab={activeTab} onChange={selectTab} />

          {/* ── IMAGE MODE ── */}
          {activeTab === "image" && !imageResult && (
            <div className="rounded-2xl border border-white/8 bg-[#0c1929] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">Analyse an image</h2>
                <p className="mt-1 text-sm text-slate-500">Upload a photo — the model will detect every European crab.</p>
              </div>
              <ImageUploader file={selectedImage} onFile={chooseImage} />
              <button
                disabled={!selectedImage || loading}
                onClick={detect}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {loading ? "Detecting…" : "Detect European Crabs"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {activeTab === "image" && imageResult && (
            <div className="rounded-2xl border border-white/8 bg-[#0c1929] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Detection complete</h2>
                  <p className="text-sm text-slate-500">Bounding boxes drawn from model predictions.</p>
                </div>
                <button
                  onClick={() => { reset(); setSelectedImage(null); }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-emerald-400/40 hover:text-white"
                >
                  New image
                </button>
              </div>
              <ImageResult result={imageResult} originalSrc={imagePreviewUrl} />
            </div>
          )}

          {/* ── VIDEO MODES ── */}
          {activeTab !== "image" && !videoResult && (
            <div className="rounded-2xl border border-white/8 bg-[#0c1929] p-6 space-y-5">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {activeTab === "local-video" ? "Track a local video" : "Track from a URL"}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {activeTab === "local-video"
                    ? "Each crab is tracked across frames — counted only once."
                    : "Provide a direct public video URL to process."}
                </p>
              </div>
              {activeTab === "local-video"
                ? <LocalVideoUploader file={selectedVideo} previewUrl={videoPreviewUrl} onFile={chooseVideo} />
                : <VideoUrlForm value={videoUrl} onChange={(v) => { setVideoUrl(v); setError(""); }} />
              }
              <button
                disabled={(activeTab === "local-video" ? !selectedVideo : !videoUrl.trim()) || loading}
                onClick={submitVideo}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3.5 font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {loading ? "Processing…" : activeTab === "local-video" ? "Count Unique Crabs" : "Process Video URL"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}

          {activeTab !== "image" && videoResult && (
            <div className="rounded-2xl border border-white/8 bg-[#0c1929] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Tracking complete</h2>
                  <p className="text-sm text-slate-500">Processed video ready to review.</p>
                </div>
                <button
                  onClick={() => { reset(); setSelectedVideo(null); setVideoUrl(""); }}
                  className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:border-emerald-400/40 hover:text-white"
                >
                  New video
                </button>
              </div>
              <VideoResult result={videoResult} videoSrc={resultFileUrl(videoResult.videoUrl)} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div aria-live="polite">
              <LoadingState
                message={activeTab === "image" ? "Detecting European crabs…" : jobStatus || "Processing video…"}
                detail={activeTab === "image" ? "Analysing your image securely." : "This may take several minutes. Keep this page open."}
              />
            </div>
          )}

          {/* Error */}
          {error && (
            <div aria-live="assertive">
              <ErrorAlert message={error} onRetry={activeTab === "image" ? detect : submitVideo} />
            </div>
          )}
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-slate-700">
        European Crab Detector · Secure browser-to-backend pipeline
      </footer>
    </div>
  );
}
