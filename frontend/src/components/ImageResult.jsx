import { useEffect, useRef } from "react";
import { CheckCircle2, ScanSearch } from "lucide-react";
import StatCard from "./StatCard.jsx";

const BOX_COLOR = "#22d3ee";   // cyan-400
const LABEL_BG  = "#0e7490";   // cyan-800
const FONT      = "bold 13px Inter, system-ui, sans-serif";

function drawBoxes(canvas, imageSrc, predictions) {
  if (!canvas || !imageSrc || !predictions?.length) return;
  const img = new Image();
  img.onload = () => {
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    predictions.forEach((p, i) => {
      const x = p.x - p.width  / 2;
      const y = p.y - p.height / 2;
      const pct = Math.round((p.confidence || 0) * 100);

      // Box
      ctx.strokeStyle = BOX_COLOR;
      ctx.lineWidth   = Math.max(2, img.naturalWidth * 0.003);
      ctx.strokeRect(x, y, p.width, p.height);

      // Label background
      ctx.font = FONT;
      const label = `#${i + 1} · ${pct}%`;
      const tw    = ctx.measureText(label).width;
      const pad   = 5;
      const lh    = 18;
      ctx.fillStyle = LABEL_BG;
      ctx.fillRect(x, y - lh - pad, tw + pad * 2, lh + pad);

      // Label text
      ctx.fillStyle = "#fff";
      ctx.fillText(label, x + pad, y - pad - 2);
    });
  };
  img.src = imageSrc;
}

export default function ImageResult({ result, originalSrc }) {
  const predictions = result.predictions || [];
  const crabCount   = result.count ?? predictions.length;
  const canvasRef   = useRef(null);

  useEffect(() => {
    if (originalSrc && predictions.length > 0) {
      drawBoxes(canvasRef.current, originalSrc, predictions);
    } else if (canvasRef.current && originalSrc) {
      // No predictions: just draw the plain image
      const img = new Image();
      img.onload = () => {
        canvasRef.current.width  = img.naturalWidth;
        canvasRef.current.height = img.naturalHeight;
        canvasRef.current.getContext("2d").drawImage(img, 0, 0);
      };
      img.src = originalSrc;
    }
  }, [originalSrc, predictions]);

  return (
    <section className="space-y-5" aria-label="Image detection results">

      {/* ── Canvas-drawn comparison ── */}
      <div className="grid grid-cols-2 gap-3">
        {/* Original */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Original
          </p>
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#060f1a]">
            {originalSrc
              ? <img src={originalSrc} alt="Original" className="w-full object-contain" />
              : <div className="flex h-32 items-center justify-center text-slate-600 text-xs">No preview</div>
            }
          </div>
        </div>

        {/* Detected — canvas with drawn boxes */}
        <div className="flex flex-col gap-2">
          <p className="text-center text-[10px] font-bold uppercase tracking-widest text-emerald-400">
            Detected · {crabCount} crab{crabCount !== 1 ? "s" : ""}
          </p>
          <div className="overflow-hidden rounded-2xl border border-emerald-400/30 bg-[#060f1a] ring-1 ring-emerald-400/20">
            {originalSrc
              ? <canvas ref={canvasRef} className="w-full object-contain" style={{ display: "block" }} />
              : <div className="flex h-32 items-center justify-center text-slate-600 text-xs">No image</div>
            }
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="European crabs detected" value={crabCount} />
        <StatCard label="Analysis status" value={crabCount > 0 ? "Found" : "Clear"} accent="teal" />
      </div>

      {/* ── Per-detection list ── */}
      {predictions.length > 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#0d1f2e] p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200">
            <ScanSearch className="h-4 w-4 text-emerald-400" />
            Detections
          </div>
          <div className="space-y-2">
            {predictions.map((p, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2 text-sm"
              >
                <span className="text-slate-300">
                  European crab <span className="ml-1 text-xs text-slate-500">#{i + 1}</span>
                </span>
                <span className="font-semibold text-emerald-400">
                  {Math.round((p.confidence || 0) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-300/20 bg-emerald-950/40 p-4 text-emerald-100">
          <CheckCircle2 className="h-5 w-5 text-emerald-400" />
          No European crabs detected in this image.
        </div>
      )}
    </section>
  );
}
