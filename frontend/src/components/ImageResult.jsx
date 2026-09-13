import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ScanSearch, SlidersHorizontal, ShieldAlert } from "lucide-react";
import StatCard from "./StatCard.jsx";

const IS_EUROPEAN = (cls) => (cls || "").toLowerCase() === "european_crab";

/* ─── canvas drawing ─────────────────────────────────────── */
function drawBoxes(canvas, imageSrc, predictions) {
  if (!canvas || !imageSrc) return;
  const img = new Image();
  img.onload = () => {
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    if (!predictions?.length) return;

    let europeanIndex = 0;
    predictions.forEach((p) => {
      if (!IS_EUROPEAN(p.class)) return;         // only European crabs get boxes
      europeanIndex++;

      const x   = p.x - p.width  / 2;
      const y   = p.y - p.height / 2;
      const pct = Math.round((p.confidence || 0) * 100);

      // box
      ctx.strokeStyle = "#22d3ee";               // cyan-400
      ctx.lineWidth   = Math.max(2, img.naturalWidth * 0.003);
      ctx.strokeRect(x, y, p.width, p.height);

      // label background
      const font  = `bold ${Math.max(11, img.naturalWidth * 0.018)}px Inter, system-ui, sans-serif`;
      ctx.font    = font;
      const label = `#${europeanIndex} · ${pct}%`;
      const tw    = ctx.measureText(label).width;
      const pad   = 5;
      const lh    = parseInt(font) + 4;
      ctx.fillStyle = "#0e7490";
      ctx.fillRect(x, y - lh - pad, tw + pad * 2, lh + pad);

      // label text
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + pad, y - pad - 2);
    });
  };
  img.src = imageSrc;
}

/* ─── component ──────────────────────────────────────────── */
export default function ImageResult({ result, originalSrc }) {
  const [threshold, setThreshold] = useState(0.3);

  const allPredictions      = result.predictions || [];
  const filtered            = allPredictions.filter(p => (p.confidence || 0) >= threshold);
  const europeanPredictions = filtered.filter(p => IS_EUROPEAN(p.class));
  const otherPredictions    = filtered.filter(p => !IS_EUROPEAN(p.class));

  const canvasRef = useRef(null);
  useEffect(() => {
    drawBoxes(canvasRef.current, originalSrc, filtered);
  }, [originalSrc, filtered]);

  return (
    <section className="space-y-5" aria-label="Image detection results">

      {/* ── Confidence Slider ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-white/8 bg-[#0d1f2e] px-4 py-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <SlidersHorizontal className="h-4 w-4 text-emerald-400" />
          Confidence threshold: <span className="text-emerald-400">{Math.round(threshold * 100)}%</span>
        </div>
        <input
          type="range" min="0" max="1" step="0.01" value={threshold}
          onChange={(e) => setThreshold(parseFloat(e.target.value))}
          className="w-full sm:w-48 accent-emerald-500"
          aria-label="Confidence threshold"
        />
      </div>

      {/* ── Side-by-side images ── */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">Original</p>
          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#060f1a]">
            {originalSrc
              ? <img src={originalSrc} alt="Original uploaded image" className="w-full object-contain" />
              : <div className="flex h-32 items-center justify-center text-slate-600 text-xs">No preview</div>}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-cyan-400">
            Detected · {europeanPredictions.length} european
          </p>
          <div className="overflow-hidden rounded-2xl border border-cyan-400/25 bg-[#060f1a] ring-1 ring-cyan-400/15">
            {originalSrc
              ? <canvas ref={canvasRef} className="w-full object-contain" style={{ display: "block" }} />
              : <div className="flex h-32 items-center justify-center text-slate-600 text-xs">No image</div>}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="European crabs found" value={europeanPredictions.length} />
        <StatCard
          label="Invasive status"
          value={europeanPredictions.length > 0 ? "⚠ Invasive detected" : "✓ Clear"}
          accent={europeanPredictions.length > 0 ? "red" : "teal"}
        />
      </div>

      {/* ── Detection list ── */}
      {filtered.length > 0 ? (
        <div className="rounded-2xl border border-white/8 bg-[#0d1f2e] p-4 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ScanSearch className="h-4 w-4 text-emerald-400" />
            All detections ({filtered.length})
          </div>

          {/* European crabs */}
          {europeanPredictions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3 w-3" /> European green crab (invasive)
              </p>
              {europeanPredictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-cyan-950/40 border border-cyan-400/15 px-3 py-2 text-sm">
                  <span className="text-cyan-100">Crab #{i + 1}</span>
                  <span className="font-semibold text-cyan-300">{Math.round((p.confidence || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          )}

          {/* Other detections */}
          {otherPredictions.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">Other detections</p>
              {otherPredictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-amber-950/30 border border-amber-400/15 px-3 py-2 text-sm">
                  <span className="text-amber-100">{p.class.replace(/_/g, " ")}</span>
                  <span className="font-semibold text-amber-300">{Math.round((p.confidence || 0) * 100)}%</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-950/30 p-4 text-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          No detections above {Math.round(threshold * 100)}% confidence.
        </div>
      )}
    </section>
  );
}
