import { Film, Image, Link2 } from "lucide-react";

const tabs = [
  { id: "image", label: "Image", icon: Image },
  { id: "local-video", label: "Local video", icon: Film },
  { id: "video-url", label: "Video URL", icon: Link2 },
];

export default function InputTabs({ activeTab, onChange }) {
  return (
    <div
      className="grid grid-cols-3 gap-1 rounded-2xl border border-[#29445a] bg-[#091b2c] p-1"
      role="tablist"
      aria-label="Detection mode"
    >
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          role="tab"
          aria-selected={activeTab === id}
          onClick={() => onChange(id)}
          className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
            activeTab === id
              ? "bg-teal-300 text-slate-950 shadow-none"
              : "text-slate-400 hover:bg-[#17364d] hover:text-white"
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
