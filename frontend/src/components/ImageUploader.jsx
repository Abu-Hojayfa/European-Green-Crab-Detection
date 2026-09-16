import { ImagePlus, UploadCloud, Check } from "lucide-react";
import { useRef, useState } from "react";

export default function ImageUploader({ file, onFile }) {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  return (
    <div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        aria-label="Choose an image file"
        onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
      />
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
            : file
              ? "border-border-strong bg-surface-overlay/50"
              : "border-border-default hover:border-border-strong hover:bg-surface-overlay/50 border-dashed"
        }`}
      >
        
        <span className={`mb-3 flex h-10 w-10 items-center justify-center border transition-all duration-200 ${
          file
            ? "border-accent bg-accent/10 text-accent"
            : "border-border-strong bg-surface-raised text-text-secondary group-hover:border-accent/50 group-hover:text-accent"
        }`}>
          {file ? <Check className="h-5 w-5" /> : <ImagePlus className="h-5 w-5" />}
        </span>
        <span className="font-tech text-sm uppercase tracking-widest text-text-primary">
          {file ? file.name : "DROP IMAGE OR BROWSE"}
        </span>
        <span className="mt-1.5 font-tech text-[10px] uppercase tracking-wider text-text-tertiary">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(1)} MB · CLICK TO CHANGE`
            : "JPG, PNG, WEBP · MAX 10 MB"}
        </span>
      </button>
    </div>
  );
}
