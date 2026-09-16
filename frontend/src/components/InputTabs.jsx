import { Film, Image, Link2 } from "lucide-react";

const tabs = [
  { id: "image", label: "IMAGE", icon: Image },
  { id: "local-video", label: "VIDEO", icon: Film },
  { id: "video-url", label: "URL", icon: Link2 },
];

export default function InputTabs({ activeTab, onChange }) {
  return (
    <div
      className="flex flex-wrap bg-surface-raised border border-border-default font-tech"
      role="tablist"
      aria-label="Detection mode"
    >
      {tabs.map(({ id, label, icon: Icon }) => {
        const isActive = activeTab === id;
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(id)}
            className={`relative flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] tracking-widest uppercase transition-colors focus-visible:outline-none ${
              isActive
                ? "bg-accent/10 text-accent shadow-[inset_0_-2px_0_0_var(--color-accent)]"
                : "text-text-secondary hover:bg-surface-overlay hover:text-text-primary"
            }`}
          >
            <Icon className="h-3 w-3" aria-hidden="true" />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
