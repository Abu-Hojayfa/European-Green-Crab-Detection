import { Film, UploadCloud, Check } from "lucide-react";
import { useRef, useState } from "react";

const accepted = "video/mp4,video/quicktime,video/webm,video/x-m4v";

export default function LocalVideoUploader({ file, previewUrl, onFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

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
        <div className="space-y-3">
          <div className="overflow-hidden border border-border-strong bg-surface-input relative">

            <video
              src={previewUrl}
              controls
              className="aspect-video max-h-[360px] w-full"
            >
              <track kind="captions" />
            </video>
          </div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-widest text-text-secondary transition-colors hover:text-accent-text"
          >
            <UploadCloud className="h-4 w-4 text-accent-text" />
            [{file.name}] · {(file.size / 1024 / 1024).toFixed(1)} MB · [CHANGE INPUT]
          </button>
        </div>
      ) : (
        <button
          type="button"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) onFile(dropped);
          }}
          onClick={() => inputRef.current?.click()}
          className={`group relative flex min-h-48 w-full flex-col items-center justify-center bg-surface-input px-6 text-center transition-all duration-200 ease-out border-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base ${
            dragOver
              ? "border-accent bg-surface-overlay"
              : "border-border-default hover:border-border-strong hover:bg-surface-overlay/50 border-dashed"
          }`}
        >
          
          <span className="mb-3 flex h-10 w-10 items-center justify-center border border-border-strong bg-surface-raised text-text-secondary transition-all duration-200 group-hover:border-accent/50 group-hover:text-accent">
            <Film className="h-5 w-5" />
          </span>
          <span className="font-tech text-sm uppercase tracking-widest text-text-primary">DROP VIDEO OR BROWSE</span>
          <span className="mt-1.5 font-tech text-[10px] uppercase tracking-wider text-text-tertiary">MP4, MOV, WEBM, M4V</span>
        </button>
      )}
    </div>
  );
}
