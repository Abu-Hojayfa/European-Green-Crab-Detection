import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#061321] px-6 text-center text-white">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">404</p>
        <h1 className="mt-3 text-4xl font-bold">This page drifted away</h1>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-emerald-500 hover:bg-emerald-400 px-5 py-3 font-semibold text-white transition"
        >
          Return to detector
        </Link>
      </div>
    </main>
  );
}
