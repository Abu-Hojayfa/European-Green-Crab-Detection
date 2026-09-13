export default function StatCard({ label, value, accent = "cyan" }) {
  return (
    <div className="rounded-2xl border border-[#29445a] bg-[#142c41] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>
      <p
        className={`mt-2 text-2xl font-bold ${
          accent === "teal" ? "text-teal-300"
          : accent === "red" ? "text-red-400"
          : "text-cyan-300"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
