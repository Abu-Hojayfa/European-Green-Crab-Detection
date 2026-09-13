import { Film, Layers3 } from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function VideoResult({ result, videoSrc }) {
  return (
    <section className="space-y-4" aria-label="Video processing results">
      <div className="overflow-hidden rounded-3xl border border-[#29445a] bg-[#091b2c]">
        <video controls className="aspect-video w-full" src={videoSrc}>
          <track kind="captions" />
        </video>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard
          label="Unique crabs tracked"
          value={result.uniqueCrabCount ?? 0}
          accent="teal"
        />
        <StatCard
          label="Frames processed"
          value={(result.processedFrames ?? 0).toLocaleString()}
        />
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Film className="h-4 w-4 text-cyan-300" />
        <Layers3 className="h-4 w-4 text-cyan-300" />
        Tracking performed by the backend workflow
      </div>
    </section>
  );
}
