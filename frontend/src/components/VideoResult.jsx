import { Film, Layers3 } from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function VideoResult({ result, videoSrc }) {
  return (
    <section className="space-y-4" aria-label="Video processing results">
      <div className="overflow-hidden border border-border-strong bg-surface-base relative">

        <video controls className="aspect-video w-full relative z-20" src={videoSrc}>
          <track kind="captions" />
        </video>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="UNIQUE CRABS TRACKED"
          value={result.uniqueCrabCount ?? 0}
          accent="accent"
        />
        <StatCard
          label="FRAMES PROCESSED"
          value={(result.processedFrames ?? 0).toLocaleString()}
          accent="data"
        />
      </div>

      <div className="flex items-center gap-2 font-tech text-[10px] uppercase tracking-widest text-text-tertiary">
        <Film className="h-3 w-3 text-data" />
        <Layers3 className="h-3 w-3 text-data" />
        [ BACKEND TRACKING WORKFLOW COMPLETED ]
      </div>
    </section>
  );
}
