import { Film, UploadCloud } from "lucide-react";
import { useRef } from "react";

const accepted = "video/mp4,video/quicktime,video/webm,video/x-m4v";

export default function LocalVideoUploader({ file, previewUrl, onFile }) {
  const inputRef = useRef(null);

  return (
    <div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept={accepted}
        aria-label="Choose a video file"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
      {file ? (
        <div className="overflow-hidden rounded-3xl border border-[#29445a] bg-[#091b2c]">
          <video
            src={previewUrl}
            controls
            className="aspect-video max-h-[360px] w-full"
          >
            <track kind="captions" />
          </video>
        </div>
      ) : (
        <button
          type="button"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const dropped = e.dataTransfer.files[0];
            if (dropped) onFile(dropped);
          }}
          onClick={() => inputRef.current?.click()}
          className="group flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#3a5a70] bg-[#142c41] px-6 text-center transition hover:border-cyan-300/60 hover:bg-[#1b3850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300">
            <Film className="h-7 w-7" />
          </span>
          <span className="font-semibold text-white">Drop a video here or browse</span>
          <span className="mt-2 text-sm text-slate-500">MP4, MOV, WebM, M4V</span>
        </button>
      )}
      {file && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="mt-3 flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <UploadCloud className="h-4 w-4 text-teal-300" />
          {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB · Choose another
        </button>
      )}
    </div>
  );
}
