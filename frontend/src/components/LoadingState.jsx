import { LoaderCircle } from "lucide-react";

export default function LoadingState({ message, detail }) {
  return (
    <div
      className="flex items-start gap-3 rounded-2xl border border-cyan-300/20 bg-[#123047] p-4"
      role="status"
      aria-live="polite"
    >
      <LoaderCircle
        className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-cyan-300"
        aria-hidden="true"
      />
      <div>
        <p className="font-medium text-white">{message}</p>
        {detail && <p className="mt-1 text-sm text-slate-400">{detail}</p>}
      </div>
    </div>
  );
}
