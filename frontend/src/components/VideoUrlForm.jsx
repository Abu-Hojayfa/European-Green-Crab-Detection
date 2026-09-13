import { Link2 } from "lucide-react";

export default function VideoUrlForm({ value, onChange }) {
  return (
    <div>
      <label htmlFor="video-url" className="mb-2 block text-sm font-semibold text-slate-200">
        Public video URL
      </label>
      <div className="relative">
        <Link2
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
          aria-hidden="true"
        />
        <input
          id="video-url"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://example.com/european-crabs.mp4"
          className="w-full rounded-2xl border border-[#3a5a70] bg-[#091b2c] py-4 pl-12 pr-4 text-white placeholder:text-slate-600 focus:border-cyan-300/60 focus:outline-none focus:ring-2 focus:ring-cyan-300/20"
        />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-500">
        Enter a direct link to an MP4, MOV, WebM, or M4V file.{" "}
        YouTube, Vimeo, and other video webpage links are <strong className="text-slate-400">not</strong> direct
        video files and are not supported.
      </p>
    </div>
  );
}
