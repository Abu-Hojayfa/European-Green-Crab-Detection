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
    if (!file.type.startsWith("image/"))
      return setError(`"${file.name}" is not an image. Please upload a JPG, PNG, or WEBP file.`);
    if (file.size > MAX_IMAGE_SIZE)
      return setError(`Image too large (${(file.size/1024/1024).toFixed(1)} MB). Maximum allowed size is 10 MB.`);
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

      {/* ── Branded header ── */}
      <header className="border-b border-white/5 bg-[#060e1a]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-4 sm:px-8 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
              <span className="text-lg">🦀</span>
            </span>
            <div>
              <p className="text-sm font-bold tracking-wide text-white">Crab Vision</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">European Green Crab Detector</p>
            </div>
          </div>
          <a
            href="https://github.com/Abu-Hojayfa"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-white"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            Abu-Hojayfa
          </a>
        </div>
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

      {/* ── Compact Info Section ── */}
      <section className="mx-auto w-full max-w-3xl px-4 sm:px-8 pb-8">
        <div className="rounded-2xl border border-white/5 bg-[#081525] p-5 text-sm text-slate-400 space-y-3">
          <p className="flex gap-3 text-slate-300">
            <span className="font-semibold text-emerald-400">Security & Privacy:</span> 
            Media is processed directly through your configured API endpoint.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
             <p className="flex gap-2">
                <span className="text-emerald-400">•</span> Unique tracking across video frames
             </p>
             <p className="flex gap-2">
                <span className="text-emerald-400">•</span> Live threshold adjustments
             </p>
             <p className="flex gap-2">
                <span className="text-emerald-400">•</span> Direct video URLs required
             </p>
          </div>
        </div>
      </section>

      <footer className="py-4 text-center text-xs text-slate-700">
        European Crab Detector · Secure browser-to-backend pipeline
      </footer>
    </div>
  );
}
