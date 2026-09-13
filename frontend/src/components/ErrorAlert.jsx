import { AlertCircle, RotateCcw } from "lucide-react";

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-red-300/30 bg-[#3a2025] p-4 text-red-100"
      role="alert"
      aria-live="assertive"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-300" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{message}</p>
        <button
          onClick={onRetry}
          className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-red-200 underline decoration-red-300/40 underline-offset-4 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" /> Try again
        </button>
      </div>
    </div>
  );
}
