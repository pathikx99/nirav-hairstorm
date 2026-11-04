"use client";

import { CandidateShadeMatch } from "../../types/manufacturer";

interface CrossBrandCompareTableProps {
  candidates: CandidateShadeMatch[];
}

export function CrossBrandCompareTable({
  candidates,
}: CrossBrandCompareTableProps) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center text-neutral-400">
        No candidate matches found matching the target criteria.
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/80 shadow-sm">
      <div className="border-b border-neutral-800 bg-neutral-950/80 px-5 py-3 flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white">Cross-Brand Candidate Shades</h3>
          <p className="text-[11px] text-neutral-400">
            Ranked by multi-dimensional UHCR distance metric ($D = w_L D_L + w_T D_T + w_I D_I + w_C D_C$)
          </p>
        </div>
        <span className="rounded bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-400">
          Chemical Equivalence: NOT ESTABLISHED
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-[11px] uppercase tracking-wider text-neutral-400">
            <tr>
              <th scope="col" className="px-4 py-3">Manufacturer</th>
              <th scope="col" className="px-4 py-3">Original Code</th>
              <th scope="col" className="px-4 py-3">Shade Name</th>
              <th scope="col" className="px-4 py-3">UHCR Mapping</th>
              <th scope="col" className="px-4 py-3">Distance (D)</th>
              <th scope="col" className="px-4 py-3">Match Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {candidates.map((c, idx) => {
              const isWella = c.manufacturer.toLowerCase().includes("wella");
              const confidenceColors = {
                HIGH: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                MEDIUM: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                LOW: "bg-neutral-800 text-neutral-300 border-neutral-700",
                INSUFFICIENT: "bg-rose-500/20 text-rose-300 border-rose-500/30",
              }[c.confidence];

              return (
                <tr key={idx} className="hover:bg-neutral-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-[10px] font-bold ${
                        isWella
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                      }`}
                    >
                      {c.manufacturer}
                    </span>
                    <span className="block text-[10px] text-neutral-500 mt-0.5">
                      {c.product_line}
                    </span>
                  </td>

                  {/* Verbatim shade notation preserved: 7/1 vs 7.1 */}
                  <td className="px-4 py-3 font-mono font-bold text-white text-sm">
                    {c.shade_code}
                  </td>

                  <td className="px-4 py-3 font-medium text-neutral-200">
                    {c.shade_name}
                  </td>

                  <td className="px-4 py-3 font-mono text-[11px]">
                    L{c.universal_mapping.level} {c.universal_mapping.primary_tone}
                    {c.universal_mapping.secondary_tone ? `/${c.universal_mapping.secondary_tone}` : ""}
                  </td>

                  <td className="px-4 py-3 font-mono">
                    <span className="text-neutral-200 font-semibold">
                      {c.composite_distance.toFixed(4)}
                    </span>
                    <span className="block text-[10px] text-neutral-500">
                      ΔL: {c.level_distance.toFixed(2)} | ΔT: {c.tone_distance.toFixed(2)}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <span className={`inline-block rounded border px-2 py-0.5 text-[10px] font-bold ${confidenceColors}`}>
                      {c.confidence}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
