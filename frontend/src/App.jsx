import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, Shield, Crosshair, Radar } from "lucide-react";
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

  // Keyboard shortcut (Cmd+U or Ctrl+U) to trigger upload
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
    setLoading(true); setError(""); setJobStatus("Uploading...");
    try {
      const job = activeTab === "local-video" && selectedVideo
        ? await createLocalVideoJob(selectedVideo, controller.signal)
        : await createVideoUrlJob(videoUrl.trim(), controller.signal);
      setJobStatus("Processing video...");
      const finalJob = await pollVideoJob(job.jobId, (u) => {
        if (u.status === "running") setJobStatus("Processing... This may take several minutes.");
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

  return (
    <div className="min-h-screen flex flex-col bg-surface-base">
      {/* ── Technical Header ── */}
      <header className="border-b border-border-default bg-surface-raised relative z-20">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center border border-accent/40 bg-accent/10">
              <Radar className="h-4 w-4 text-accent" />
            </span>
            <div>
              <p className="text-sm font-bold tracking-widest text-text-primary uppercase flex items-center gap-2">
                Crab Vision <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-subtle"></span>
              </p>
              <p className="font-tech text-[10px] text-text-secondary uppercase tracking-[0.2em]">EU-Green-Crab Det. V2.0</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden sm:flex items-center gap-1.5 font-tech text-[10px] text-text-tertiary uppercase tracking-wider">
              <Shield className="h-3 w-3 text-accent" />
              Secure-Pipe
            </span>
            <a
              href="https://github.com/Abu-Hojayfa"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 border border-border-default bg-surface-overlay px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent"
            >
              SYS-OP: Abu-Hojayfa
            </a>
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="relative flex flex-1 items-start lg:items-center justify-center px-4 py-8 lg:py-12">
        
        {/* Central Data Panel */}
        <div className="relative w-full max-w-4xl z-10 grid gap-6">

          {/* Controls Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border-strong pb-4">
            <div>
              <h1 className="font-tech text-sm text-accent uppercase tracking-widest mb-1 flex items-center gap-2">
                <Crosshair className="h-4 w-4" />
                Detection Parameters
              </h1>
              <p className="text-xs text-text-secondary font-tech uppercase tracking-wider">
                Select input feed for analysis
              </p>
            </div>
            <InputTabs activeTab={activeTab} onChange={selectTab} />
          </div>

          {/* ── IMAGE MODE ── */}
          {activeTab === "image" && !imageResult && (
            <div className="animate-fade-in-up space-y-4">
              <ImageUploader file={selectedImage} onFile={chooseImage} />
              <button
                disabled={!selectedImage || loading}
                onClick={detect}
                className="group relative flex w-full items-center justify-center gap-3 border border-accent bg-accent/10 px-4 py-3 font-tech text-xs uppercase tracking-[0.2em] text-accent transition-all hover:bg-accent hover:text-surface-base disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-raised disabled:text-text-tertiary"
              >
                {loading ? "[ DETECTING... ]" : "[ INITIATE DETECTION ]"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </div>
          )}

          {activeTab === "image" && imageResult && (
            <div className="animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between border-b border-border-strong pb-3">
                <div>
                  <h2 className="font-tech text-sm font-bold text-accent uppercase tracking-widest">Analysis Complete</h2>
                  <p className="font-tech text-[10px] text-text-secondary uppercase tracking-wider">Bounding boxes resolved</p>
                </div>
                <button
                  onClick={() => { reset(); setSelectedImage(null); }}
                  className="border border-border-default bg-surface-raised px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  [ RESET INPUT ]
                </button>
              </div>
              <ImageResult result={imageResult} originalSrc={imagePreviewUrl} />
            </div>
          )}

          {/* ── VIDEO MODES ── */}
          {activeTab !== "image" && !videoResult && (
            <div className="animate-fade-in-up space-y-4">
              {activeTab === "local-video"
                ? <LocalVideoUploader file={selectedVideo} previewUrl={videoPreviewUrl} onFile={chooseVideo} />
                : <VideoUrlForm value={videoUrl} onChange={(v) => { setVideoUrl(v); setError(""); }} />
              }
              <button
                disabled={(activeTab === "local-video" ? !selectedVideo : !videoUrl.trim()) || loading}
                onClick={submitVideo}
                className="group relative flex w-full items-center justify-center gap-3 border border-accent bg-accent/10 px-4 py-3 font-tech text-xs uppercase tracking-[0.2em] text-accent transition-all hover:bg-accent hover:text-surface-base disabled:cursor-not-allowed disabled:border-border-default disabled:bg-surface-raised disabled:text-text-tertiary"
              >
                {loading ? "[ PROCESSING... ]" : "[ INITIATE TRACKING ]"}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
              </button>
            </div>
          )}

          {activeTab !== "image" && videoResult && (
            <div className="animate-fade-in-up space-y-4">
              <div className="flex items-center justify-between border-b border-border-strong pb-3">
                <div>
                  <h2 className="font-tech text-sm font-bold text-accent uppercase tracking-widest">Tracking Complete</h2>
                  <p className="font-tech text-[10px] text-text-secondary uppercase tracking-wider">Video processed & encoded</p>
                </div>
                <button
                  onClick={() => { reset(); setSelectedVideo(null); setVideoUrl(""); }}
                  className="border border-border-default bg-surface-raised px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-text-secondary transition-colors hover:border-accent hover:text-accent"
                >
                  [ RESET INPUT ]
                </button>
              </div>
              <VideoResult result={videoResult} videoSrc={resultFileUrl(videoResult.videoUrl)} />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div aria-live="polite">
              <LoadingState
                message={activeTab === "image" ? "DETECTING GREEN CRABS..." : jobStatus ? jobStatus.toUpperCase() : "PROCESSING VIDEO..."}
                detail={activeTab === "image" ? "Analyzing visual data feed" : "Awaiting processing queue"}
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

      {/* ── Footer ── */}
      <footer className="border-t border-border-strong bg-surface-raised py-2 px-4 flex justify-between items-center text-[10px] font-tech text-text-ghost uppercase tracking-widest z-20">
        <span>CRAB VISION SYSTEM</span>
        <span>STATUS: ONLINE</span>
      </footer>
    </div>
  );
}
