import { Link2 } from "lucide-react";

export default function VideoUrlForm({ value, onChange }) {
  return (
    <div className="bg-surface-input p-4 border border-border-default">
      <label
        htmlFor="video-url"
        className="mb-3 flex items-center gap-2 font-tech text-[10px] uppercase tracking-widest text-text-primary"
      >
        <span className="w-1.5 h-1.5 bg-accent"></span>
        TARGET VIDEO URL
      </label>
      <div className="relative">
        <Link2
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary"
          aria-hidden="true"
        />
        <input
          id="video-url"
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="HTTPS://..."
          className="w-full border border-border-strong bg-surface-raised py-3 pl-10 pr-4 font-tech text-xs uppercase tracking-wider text-text-primary placeholder:text-text-ghost transition-colors focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <p className="mt-3 font-tech text-[10px] uppercase leading-relaxed text-text-tertiary tracking-wider">
        REQUIRES DIRECT LINK TO MP4, MOV, WEBM, OR M4V FILE.{" "}
        <span className="text-danger-text">YOUTUBE/VIMEO PAGES NOT SUPPORTED.</span>
      </p>
    </div>
  );
}
