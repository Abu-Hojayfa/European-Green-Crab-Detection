export default function StatCard({ label, value, accent = "data" }) {
  const accentStyles = {
    data:    "text-data",
    accent:  "text-accent",
    danger:  "text-danger",
  };

  return (
    <div className={`border border-border-default bg-surface-overlay/30 px-4 py-3 ${accentStyles[accent] || accentStyles.data}`}>
      <p className="font-tech text-[10px] uppercase tracking-[0.2em] text-text-secondary">
        {label}
      </p>
      <p className="mt-1 font-tech text-2xl font-bold tracking-tight">
        {value}
      </p>
    </div>
  );
}
