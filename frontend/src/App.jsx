import { useEffect, useRef, useState, useCallback } from "react";
import { ArrowRight, Check, Info, ShieldCheck, Sparkles } from "lucide-react";
import Header from "@/components/Header.jsx";
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

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const IMAGE_TIMEOUT_MS = 45_000;
const ALLOWED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
];

export default function App() {
  const [activeTab, setActiveTab] = useState("image");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [imageResult, setImageResult] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState("");
  const [jobStatus, setJobStatus] = useState("");

  const abortRef = useRef(null);

  // Revoke object URLs properly
  useEffect(() => {
    if (!selectedVideo) {
      setVideoPreviewUrl("");
      return;
    }
    const url = URL.createObjectURL(selectedVideo);
    setVideoPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedVideo]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const cancelPending = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  const selectTab = useCallback((tab) => {
    cancelPending();
    setActiveTab(tab);
    setError("");
    setImageResult(null);
    setVideoResult(null);
    setLoading(false);
    setJobStatus("");
  }, [cancelPending]);

  const reset = useCallback(() => {
    cancelPending();
    setError("");
    setImageResult(null);
    setVideoResult(null);
    setLoading(false);
    setJobStatus("");
  }, [cancelPending]);

  const chooseImage = useCallback(
    (file) => {
      reset();
      if (!file.type.startsWith("image/")) {
        return setError("Please choose a supported image file.");
      }
      if (file.size > MAX_IMAGE_SIZE) {
        return setError("This image is too large. Please choose a file under 10 MB.");
      }
      setSelectedImage(file);
    },
    [reset]
  );

  const chooseVideo = useCallback(
    (file) => {
      reset();
      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        return setError("Please choose an MP4, MOV, WebM, or M4V video.");
      }
      setSelectedVideo(file);
    },
    [reset]
  );

  const detect = useCallback(async () => {
    if (!selectedImage) return;
    cancelPending();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), IMAGE_TIMEOUT_MS);

    setLoading(true);
    setError("");
    try {
      const result = await detectImage(selectedImage, controller.signal);
      setImageResult(result);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        setError("The image request timed out. Please try again.");
      } else {
        setError(err instanceof Error ? err.message : "Image detection failed. Please try again.");
      }
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
      abortRef.current = null;
    }
  }, [selectedImage, cancelPending]);

  const processVideo = useCallback(async () => {
    cancelPending();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setJobStatus("Uploading…");

    try {
      let job;
      if (activeTab === "local-video" && selectedVideo) {
        job = await createLocalVideoJob(selectedVideo, controller.signal);
      } else {
        job = await createVideoUrlJob(videoUrl.trim(), controller.signal);
      }

      setJobStatus("Processing video…");

      const finalJob = await pollVideoJob(
        job.jobId,
        (update) => {
          if (update.status === "running") {
            setJobStatus("Processing video… This may take several minutes.");
          }
        },
        controller.signal
      );

      if (finalJob.status === "failed") {
        setError(finalJob.error || "Video processing failed. Please try again.");
      } else {
        setVideoResult(finalJob);
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Video processing failed. Please try again.");
      }
    } finally {
      setLoading(false);
      setJobStatus("");
      abortRef.current = null;
    }
  }, [activeTab, selectedVideo, videoUrl, cancelPending]);

  const submitVideo = useCallback(() => {
    if (activeTab === "local-video" && !selectedVideo) return;
    if (activeTab === "video-url" && !/^https?:\/\//i.test(videoUrl.trim())) {
      return setError("Enter a valid direct video URL beginning with http:// or https://.");
    }
    processVideo();
  }, [activeTab, selectedVideo, videoUrl, processVideo]);

  return (
    <main className="flex min-h-screen items-center bg-[#061321] text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-12 lg:py-16">
        <Header />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,.9fr)] lg:items-start">
          {/* Left panel */}
          <section
            className="rounded-[2rem] border border-[#29445a] bg-[#10263a] p-4 shadow-xl shadow-black/20 sm:p-6"
            aria-label="Detection controls"
          >
            <InputTabs activeTab={activeTab} onChange={selectTab} />
            <div className="mt-6">
              {/* === IMAGE MODE === */}
              {activeTab === "image" && !imageResult && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Analyze an image</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Upload a clear image and our workflow will mark every European crab.
                    </p>
                  </div>
                  <ImageUploader file={selectedImage} onFile={chooseImage} />
                  <button
                    disabled={!selectedImage || loading}
                    onClick={detect}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102337]"
                  >
                    {loading ? "Detecting European crabs…" : "Detect European Crabs"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {activeTab === "image" && imageResult && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Detection complete</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Annotated results from your image.
                    </p>
                  </div>
                  <ImageResult result={imageResult} />
                  <button
                    onClick={() => { reset(); setSelectedImage(null); }}
                    className="w-full rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    Choose another image
                  </button>
                </div>
              )}

              {/* === VIDEO MODES === */}
              {activeTab !== "image" && !videoResult && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">
                      {activeTab === "local-video"
                        ? "Track a local video"
                        : "Track from a video URL"}
                    </h2>
                    <p className="mt-1 text-sm text-slate-400">
                      {activeTab === "local-video"
                        ? "Follow each crab across frames for a unique count."
                        : "Send a public direct video file to the tracking workflow."}
                    </p>
                  </div>

                  {activeTab === "local-video" ? (
                    <LocalVideoUploader
                      file={selectedVideo}
                      previewUrl={videoPreviewUrl}
                      onFile={chooseVideo}
                    />
                  ) : (
                    <VideoUrlForm
                      value={videoUrl}
                      onChange={(value) => {
                        setVideoUrl(value);
                        setError("");
                      }}
                    />
                  )}

                  <button
                    disabled={
                      (activeTab === "local-video" ? !selectedVideo : !videoUrl.trim()) ||
                      loading
                    }
                    onClick={submitVideo}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-5 py-4 font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#102337]"
                  >
                    {loading
                      ? "Processing and tracking video…"
                      : activeTab === "local-video"
                        ? "Count Unique European Crabs"
                        : "Process Video URL"}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}

              {activeTab !== "image" && videoResult && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-white">Tracking complete</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Your processed video is ready to review.
                    </p>
                  </div>
                  <VideoResult
                    result={videoResult}
                    videoSrc={resultFileUrl(videoResult.videoUrl)}
                  />
                  <button
                    onClick={() => { reset(); setSelectedVideo(null); setVideoUrl(""); }}
                    className="w-full rounded-2xl border border-white/10 px-5 py-3 font-semibold text-slate-300 transition hover:border-cyan-300/40 hover:text-white"
                  >
                    Process another video
                  </button>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="mt-5" aria-live="polite">
                  <LoadingState
                    message={
                      activeTab === "image"
                        ? "Detecting European crabs…"
                        : jobStatus || "Processing and tracking video…"
                    }
                    detail={
                      activeTab === "image"
                        ? "Your image is being analyzed securely."
                        : "This may take several minutes. Keep this page open."
                    }
                  />
                </div>
              )}

              {/* Error display */}
              {error && (
                <div className="mt-5" aria-live="assertive">
                  <ErrorAlert
                    message={error}
                    onRetry={activeTab === "image" ? detect : submitVideo}
                  />
                </div>
              )}
            </div>
          </section>

          {/* Right sidebar */}
          <aside className="space-y-4 lg:w-full lg:max-w-md lg:justify-self-center lg:pt-20">
            <div className="rounded-[2rem] border border-[#29445a] bg-[#10263a] p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-300/10 text-teal-300">
                  <Sparkles className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-white">Built for field teams</p>
                  <p className="text-sm text-slate-500">Fast, focused, private</p>
                </div>
              </div>
              <div className="mt-6 space-y-4 text-sm text-slate-400">
                <p className="flex gap-3">
                  <Check className="h-5 w-5 shrink-0 text-teal-300" />
                  Backend-powered image and video analysis
                </p>
                <p className="flex gap-3">
                  <Check className="h-5 w-5 shrink-0 text-teal-300" />
                  Unique tracking counts the same crab once
                </p>
                <p className="flex gap-3">
                  <ShieldCheck className="h-5 w-5 shrink-0 text-teal-300" />
                  Your media is sent only to your configured API
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-2xl border border-[#1b5264] bg-[#123047] p-4 text-sm leading-6 text-slate-400">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              Video URLs must point directly to a file. YouTube, Vimeo, Drive viewing pages, and
              other webpage links are not supported.
            </div>
          </aside>
        </div>

        <footer className="mt-10 text-center text-xs text-slate-600">
          European Crab Detector · Secure browser-to-backend workflow
        </footer>
      </div>
    </main>
  );
}
