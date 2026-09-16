import { Activity } from "lucide-react";

export default function LoadingState({ message, detail }) {
  return (
    <div
      className="border border-accent/50 bg-accent/10 p-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
          <Activity
            className="h-5 w-5 animate-pulse-subtle text-accent"
            aria-hidden="true"
          />
        </div>
        <div className="w-full">
          <p className="font-tech text-xs font-semibold tracking-widest text-accent uppercase">
            {message}
          </p>
          {detail && (
            <p className="mt-1 font-tech text-[10px] uppercase tracking-wider text-text-secondary">
              {detail}
            </p>
          )}
          <div className="mt-4 h-0.5 w-full bg-accent/20 overflow-hidden relative rounded-full">
            <div className="absolute top-0 left-0 h-full w-1/3 bg-accent rounded-full animate-indeterminate-progress"></div>
          </div>
        </div>
      </div>
    </div>
  );
}
