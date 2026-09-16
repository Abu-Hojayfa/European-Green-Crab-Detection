import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="flex items-start gap-4 border border-danger/50 bg-danger-muted p-4 rounded-sm"
      role="alert"
      aria-live="assertive"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-danger"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="font-tech text-xs font-medium tracking-wide text-danger-text uppercase">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 border border-danger/30 bg-danger/10 px-3 py-1.5 font-tech text-[10px] uppercase tracking-wider text-danger-text transition-colors hover:bg-danger/20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-danger"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          [ SYSTEM RETRY ]
        </button>
      </div>
    </div>
  );
}
