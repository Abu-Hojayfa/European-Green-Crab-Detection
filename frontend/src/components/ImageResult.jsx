import { CheckCircle2, ScanSearch } from "lucide-react";
import StatCard from "./StatCard.jsx";

export default function ImageResult({ result }) {
  const predictions = result.predictions || [];
  const crabCount = result.count ?? predictions.length;

  return (
    <section className="space-y-4" aria-label="Image detection results">
      {result.annotatedImage && (
        <div className="overflow-hidden rounded-3xl border border-[#29445a] bg-[#091b2c]">
          <img
            src={result.annotatedImage}
            alt="Annotated image showing detected European crabs"
            className="max-h-[520px] w-full object-contain"
          />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="European crabs detected" value={crabCount} />
        <StatCard
          label="Analysis status"
          value={crabCount > 0 ? "Found" : "Clear"}
          accent="teal"
        />
      </div>

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
