export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-16 sm:px-10">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-medium text-emerald-300">
          Oromia State University
        </p>

        <h1 className="mt-4 text-4xl font-bold text-white sm:text-6xl">
          OSU Fleet Command Center
        </h1>

        <p className="mt-6 text-lg text-slate-300">
          This system will help OSU track buses and cars, manage drivers,
          and approve trip requests from one dashboard.
        </p>

        <section className="mt-12 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white">Project goal</h2>
          <p className="mt-2 text-slate-400">
            Build a working fleet management system, one lesson at a time.
          </p>
        </section>
      </div>
    </main>
  );
}