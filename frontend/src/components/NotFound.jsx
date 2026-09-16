import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-base px-6 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent-text">
          404
        </p>
        <h1 className="mt-3 text-4xl font-bold text-text-primary">
          This page drifted away
        </h1>
        <p className="mt-3 text-text-secondary">
          The current carried it off. Let's get you back.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-semibold text-surface-base transition-colors hover:bg-accent-hover"
        >
          Return to detector
        </Link>
      </div>
    </main>
  );
}
