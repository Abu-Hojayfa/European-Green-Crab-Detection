import { CheckCircle2, ScanSearch } from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function ImageResult({ result, originalSrc }) {
  const predictions = result.predictions || [];
  const crabCount = result.count ?? predictions.length;

  return (
    <section className="space-y-4" aria-label="Image detection results">

      {/* ── Side-by-side full-width comparison ── */}
      <div className="grid grid-cols-2 gap-2">
        {/* Original */}
        <div className="flex flex-col gap-1.5">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Original
          </p>
          <div className="overflow-hidden rounded-2xl border border-[#29445a] bg-[#091b2c]">
            {originalSrc ? (
              <img
                src={originalSrc}
                alt="Original uploaded image"
                className="w-full object-contain"
                style={{ maxHeight: "none" }}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-slate-600 text-xs">
                No preview
              </div>
            )}
          </div>
        </div>

        {/* Detected */}
        <div className="flex flex-col gap-1.5">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Detected · {crabCount} crab{crabCount !== 1 ? "s" : ""}
          </p>
          <div className="overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#091b2c] ring-1 ring-cyan-400/20">
            {result.annotatedImage ? (
              <img
                src={result.annotatedImage}
                alt="Annotated image showing detected European crabs"
                className="w-full object-contain"
                style={{ maxHeight: "none" }}
              />
            ) : (
              <div className="flex h-32 items-center justify-center text-slate-600 text-xs">
                No annotated image
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="European crabs detected" value={crabCount} />
        <StatCard
          label="Analysis status"
          value={crabCount > 0 ? "Found" : "Clear"}
          accent="teal"
        />
      </div>

      {/* ── Per-detection confidence list ── */}
      {predictions.length > 0 ? (
        <div className="rounded-2xl border border-[#29445a] bg-[#142c41] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ScanSearch className="h-4 w-4 text-cyan-300" />
            Detection confidence
          </div>
          <div className="space-y-2">
            {predictions.map((prediction, index) => (
              <div
                className="flex items-center justify-between rounded-xl bg-[#1b3850] px-3 py-2 text-sm"
                key={`${prediction.class}-${index}`}
              >
                <span className="text-slate-300">
                  {(prediction.class || "european_crab").replace(/_/g, " ")}
                  <span className="ml-2 text-xs text-slate-500">#{index + 1}</span>
                </span>
                <span className="font-semibold text-cyan-300">
                  {Math.round((prediction.confidence || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-teal-300/30 bg-[#123c3e] p-4 text-teal-100">
          <CheckCircle2 className="h-5 w-5 text-teal-300" />
          No European crabs detected
        </div>
      )}
    </section>
  );
}
