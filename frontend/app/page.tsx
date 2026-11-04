import Link from "next/link";

export default function HomePage() {
  const principles = [
    {
      num: "01",
      title: "No Universal Shade Numbers",
      desc: "Manufacturer shade numbers are never treated as universal identifiers; original codes are preserved verbatim (e.g. 7/1 vs 7.1).",
    },
    {
      num: "04",
      title: "No Chemical Equivalence Assumption",
      desc: "Similar visual colour does not establish chemical or formulation equivalence across different manufacturers.",
    },
    {
      num: "06",
      title: "Unverified Data Invariant",
      desc: "Unverified data must never generate executable formulations. Missing information remains explicitly unknown.",
    },
    {
      num: "08",
      title: "Independent Region Assessment",
      desc: "Roots, mid-lengths, and ends are independently assessable and formulate distinct regional chemical requirements.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <span>✨</span> Baseline Architecture v1.0 — Initial Market: India
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Universal Hair Colour Intelligence Platform
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            Nirav Hairstorm bridges manufacturer-independent colour science (UHCR v1) with manufacturer-specific technical systems. Evaluate starting hair conditions, predict chemical feasibility, and generate deterministic, constraint-based formulations.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/starting-hair"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              Start Hair Assessment <span>→</span>
            </Link>
            <Link
              href="/target-colour"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-5 py-3 text-sm font-bold text-white transition-all"
            >
              Select Target Look
            </Link>
          </div>
        </div>
      </section>

      {/* Core Workflow Steps */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>⚡</span> Professional Colourist Workflow
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/starting-hair"
            className="group block rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition-all hover:border-amber-500/50 hover:bg-neutral-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-amber-400 transition-colors">
              Starting Hair Assessment
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Multi-zone inspection (roots, mid-lengths, ends). Record natural level, artificial dye history, white hair percentage, and fiber condition.
            </p>
          </Link>

          <Link
            href="/target-colour"
            className="group block rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition-all hover:border-amber-500/50 hover:bg-neutral-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400 font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-rose-400 transition-colors">
              Target Colour Definition
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Select universal depth (Level 1–10), primary reflect, secondary reflect, and intensity. Select Preferred Manufacturer or Cross-Brand mode.
            </p>
          </Link>

          <Link
            href="/formulation"
            className="group block rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 transition-all hover:border-amber-500/50 hover:bg-neutral-900"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 font-bold text-lg mb-4 group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-bold text-white text-base mb-1 group-hover:text-indigo-400 transition-colors">
              Formulation Intelligence
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Deterministic rule evaluation, safety audit contraindication checks, multi-stage mixing ratios, and side-by-side brand comparisons.
            </p>
          </Link>
        </div>
      </section>

      {/* Non-Negotiable Architecture Principles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>🔒</span> Architectural Integrity & Safety Constraints
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {principles.map((p) => (
            <div
              key={p.num}
              className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-4 space-y-1.5"
            >
              <span className="font-mono text-xs font-bold text-neutral-500">
                PRINCIPLE {p.num}
              </span>
              <h4 className="text-sm font-semibold text-neutral-200">
                {p.title}
              </h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
