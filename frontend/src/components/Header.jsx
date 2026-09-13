export default function Header() {
  return (
    <header className="mb-8">
      <div className="mb-4 h-1 w-16 rounded-full bg-cyan-300" />
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
        European Crab <span className="text-cyan-300">Detector</span>
      </h1>
      <p className="mt-4 max-w-xl text-base leading-7 text-slate-400 sm:text-lg">
        Detect European crabs in images or uniquely count them across video.
      </p>
    </header>
  );
}
