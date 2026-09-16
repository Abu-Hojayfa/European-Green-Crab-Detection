import { useEffect, useRef, useState, useCallback } from "react";
import { CheckCircle2, ScanSearch, SlidersHorizontal, ShieldAlert } from "lucide-react";
import StatCard from "./StatCard.jsx";

const IS_EUROPEAN = (cls) => (cls || "").toLowerCase() === "european_crab";

/* ─── canvas drawing ─────────────────────────────────────── */
function drawBoxes(canvas, imageSrc, predictions) {
  if (!canvas || !imageSrc) return;
  const img = new window.Image();
  img.onload = () => {
    canvas.width  = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    if (!predictions?.length) return;

    let europeanIndex = 0;
    predictions.forEach((p) => {
      if (!IS_EUROPEAN(p.class)) return;
      europeanIndex++;

      const x   = p.x - p.width  / 2;
      const y   = p.y - p.height / 2;
      const pct = Math.round((p.confidence || 0) * 100);

      // box — data color
      ctx.strokeStyle = "#00D0FF";
      ctx.lineWidth   = Math.max(2, img.naturalWidth * 0.003);
      ctx.strokeRect(x, y, p.width, p.height);

      // box corners accents
      const cl = ctx.lineWidth * 3;
      ctx.lineWidth = ctx.lineWidth * 2;
      ctx.beginPath();
      ctx.moveTo(x - cl, y); ctx.lineTo(x, y); ctx.lineTo(x, y - cl);
      ctx.moveTo(x + p.width + cl, y); ctx.lineTo(x + p.width, y); ctx.lineTo(x + p.width, y - cl);
      ctx.moveTo(x - cl, y + p.height); ctx.lineTo(x, y + p.height); ctx.lineTo(x, y + p.height + cl);
      ctx.moveTo(x + p.width + cl, y + p.height); ctx.lineTo(x + p.width, y + p.height); ctx.lineTo(x + p.width, y + p.height + cl);
      ctx.stroke();

      // label background
      const fontSize = Math.max(12, img.naturalWidth * 0.016);
      const font  = `600 ${fontSize}px "Fira Code", ui-monospace, monospace`;
      ctx.font    = font;
      const label = `OBJ-${europeanIndex} [${pct}%]`;
      const tw    = ctx.measureText(label).width;
      const pad   = 6;
      const lh    = fontSize + 4;

      ctx.fillStyle = "rgba(3, 12, 20, 0.9)";
      ctx.beginPath();
      const lx = x;
      const ly = y - lh - pad;
      const lw = tw + pad * 2;
      const lhh = lh + pad;
      ctx.rect(lx, ly, lw, lhh);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeRect(lx, ly, lw, lhh);

      // label text
      ctx.fillStyle = "#00D0FF";
      ctx.fillText(label, x + pad, y - pad - 1);
    });
  };
  img.src = imageSrc;
}

/* ─── component ──────────────────────────────────────────── */
export default function ImageResult({ result, originalSrc }) {
  const [threshold, setThreshold] = useState(0.5);

  const allPredictions      = result.predictions || [];
  const filtered            = allPredictions.filter(p => (p.confidence || 0) >= threshold);
  const europeanPredictions = filtered.filter(p => IS_EUROPEAN(p.class));
  const otherPredictions    = filtered.filter(p => !IS_EUROPEAN(p.class));

  const groupedOtherPredictions = otherPredictions.reduce((acc, p) => {
    const className = p.class.replace(/_/g, " ");
    acc[className] = (acc[className] || 0) + 1;
    return acc;
  }, {});

  const canvasRef = useRef(null);

  useEffect(() => {
    drawBoxes(canvasRef.current, originalSrc, filtered);
  }, [originalSrc, filtered]);

  // Update CSS custom property for range track fill
  const handleThreshold = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setThreshold(val);
    e.target.style.setProperty("--range-progress", `${val * 100}%`);
  }, []);

  const sliderRef = useRef(null);
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.style.setProperty("--range-progress", `${threshold * 100}%`);
    }
  }, []);

  return (
    <section className="space-y-4" aria-label="Image detection results">

      {/* ── Confidence Slider ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border border-border-strong bg-surface-overlay/60 px-4 py-3">
        <div className="flex items-center gap-2 font-tech text-xs uppercase tracking-widest text-text-primary">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          CONFIDENCE LIMIT:
          <span className="tabular-nums text-accent">
            {Math.round(threshold * 100)}%
          </span>
        </div>
        <input
          ref={sliderRef}
          type="range" min="0" max="1" step="0.01" value={threshold}
          onChange={handleThreshold}
          className="w-full sm:w-52"
          aria-label="Confidence threshold"
        />
      </div>

      {/* ── Side-by-side images ── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="font-tech text-[10px] uppercase tracking-widest text-text-tertiary">
            [ RAW INPUT ]
          </p>
          <div className="overflow-hidden border border-border-strong bg-surface-input">
            {originalSrc
              ? <img src={originalSrc} alt="Original uploaded image" className="w-full object-contain" />
              : <div className="flex h-32 items-center justify-center font-tech text-xs text-text-ghost uppercase">NO PREVIEW</div>}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <p className="font-tech text-[10px] uppercase tracking-widest text-data">
            [ DETECTED · {europeanPredictions.length} TARGETS ]
          </p>
          <div className="overflow-hidden border border-border-strong bg-surface-input relative">

            {originalSrc
              ? <canvas ref={canvasRef} className="w-full object-contain relative z-10" style={{ display: "block" }} />
              : <div className="flex h-32 items-center justify-center font-tech text-xs text-text-ghost uppercase">NO IMAGE</div>}
          </div>
        </div>
      </div>

      {/* Screen-reader accessible detection summary */}
      <div className="sr-only" aria-live="polite">
        {europeanPredictions.length > 0
          ? `${europeanPredictions.length} European green crab${europeanPredictions.length > 1 ? "s" : ""} detected above ${Math.round(threshold * 100)}% confidence.`
          : `No European crabs detected above ${Math.round(threshold * 100)}% confidence.`}
        {Object.entries(groupedOtherPredictions).map(([cls, count]) =>
          `${count} ${cls} also detected.`
        ).join(" ")}
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="TARGETS FOUND" value={europeanPredictions.length} accent="data" />
        <StatCard
          label="INVASIVE STATUS"
          value={europeanPredictions.length > 0 ? "⚠ INVASIVE" : "✓ CLEAR"}
          accent={europeanPredictions.length > 0 ? "danger" : "accent"}
        />
      </div>

      {/* ── Detection list ── */}
      {filtered.length > 0 ? (
        <div className="border border-border-strong bg-surface-overlay/40 p-4 space-y-4">
          <div className="flex items-center gap-2 font-tech text-xs uppercase tracking-widest text-text-primary">
            <ScanSearch className="h-4 w-4 text-accent" />
            DETECTION LOG ({filtered.length})
          </div>

          {/* European crabs */}
          {europeanPredictions.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              <p className="flex items-center gap-2 font-tech text-[10px] font-bold uppercase tracking-widest text-data">
                <ShieldAlert className="h-3 w-3" /> EUROPEAN GREEN CRAB (INVASIVE)
              </p>
              {europeanPredictions.map((p, i) => (
                <div key={i} className="flex items-center justify-between border-l-2 border-data bg-data-muted px-3 py-2 font-tech text-xs uppercase text-text-primary">
                  <span>OBJ-{i + 1}</span>
                  <span className="tabular-nums text-data">
                    {Math.round((p.confidence || 0) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Other detections */}
          {Object.keys(groupedOtherPredictions).length > 0 && (
            <div className="space-y-2 pt-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              <p className="font-tech text-[10px] font-bold uppercase tracking-widest text-warning-text">
                OTHER DETECTIONS
              </p>
              {Object.entries(groupedOtherPredictions).map(([className, count], i) => (
                <div key={i} className="flex items-center justify-between border-l-2 border-warning-text bg-warning-muted px-3 py-2 font-tech text-xs uppercase text-text-primary min-w-0">
                  <span className="truncate min-w-0 mr-2">{className}</span>
                  <span className="tabular-nums text-warning-text">
                    x{count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-3 border border-accent/50 bg-accent-muted px-4 py-3 font-tech text-xs uppercase tracking-wider text-text-primary">
          <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
          NO DETECTIONS ABOVE {Math.round(threshold * 100)}% LIMIT.
        </div>
      )}
    </section>
  );
}
