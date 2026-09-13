import { ImagePlus, UploadCloud } from "lucide-react";
import { useRef } from "react";

export default function ImageUploader({ file, onFile }) {
  const inputRef = useRef(null);

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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = e.dataTransfer.files[0];
          if (dropped) onFile(dropped);
        }}
        onClick={() => inputRef.current?.click()}
        className="group flex min-h-56 w-full flex-col items-center justify-center rounded-3xl border border-dashed border-[#3a5a70] bg-[#142c41] px-6 text-center transition hover:border-cyan-300/60 hover:bg-[#1b3850] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
      >
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-300 transition group-hover:scale-105">
          <ImagePlus className="h-7 w-7" />
        </span>
        <span className="font-semibold text-white">
          {file ? file.name : "Drop an image here or browse"}
        </span>
        <span className="mt-2 text-sm text-slate-500">JPG, PNG, WEBP · Click to select</span>
      </button>
      {file && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <UploadCloud className="h-4 w-4 text-teal-300" />
          {(file.size / 1024 / 1024).toFixed(2)} MB selected
        </p>
      )}
    </div>
  );
}
