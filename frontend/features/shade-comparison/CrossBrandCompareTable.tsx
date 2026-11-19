"use client";

import React from "react";
import { CandidateShadeMatch } from "../../types/manufacturer";

interface CrossBrandCompareTableProps {
  candidates: CandidateShadeMatch[];
  selectedShadeCode?: string | null;
  onSelectCandidate?: (candidate: CandidateShadeMatch) => void;
}

export function CrossBrandCompareTable({
  candidates,
  selectedShadeCode,
  onSelectCandidate,
}: CrossBrandCompareTableProps) {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400 space-y-2">
        <span className="text-2xl">🔍</span>
        <p className="text-sm font-semibold text-white">No cross-brand candidate matches found.</p>
        <p className="text-xs text-neutral-500">Ensure manufacturer catalogues are published in market IN.</p>
      </div>
    );
  }

  // Display top 10
  const top10 = candidates.slice(0, 10);

  const getBrandBadge = (mfg: string) => {
    const lower = mfg.toLowerCase();
    if (lower.includes("wella")) {
      return {
        label: "Wella",
        className: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      };
    }
    if (lower.includes("l'oréal") || lower.includes("loreal")) {
      return {
        label: "L'Oréal",
        className: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40",
      };
    }
    if (lower.includes("schwarzkopf")) {
      return {
        label: "Schwarzkopf",
        className: "bg-rose-500/20 text-rose-300 border-rose-500/40",
      };
    }
    if (lower.includes("alfaparf")) {
      return {
        label: "Alfaparf Milano",
        className: "bg-teal-500/20 text-teal-300 border-teal-500/40",
      };
    }
    if (lower.includes("proads")) {
      return {
        label: "Proads",
        className: "bg-purple-500/20 text-purple-300 border-purple-500/40",
      };
    }
    return {
      label: mfg,
      className: "bg-neutral-800 text-neutral-300 border-neutral-700",
    };
  };

  const getAccuracyStyle = (pct: number) => {
    if (pct >= 95) {
      return {
        badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
        label: `${pct}% Perfect Match`,
      };
    }
    if (pct >= 85) {
      return {
        badgeClass: "bg-teal-500/20 text-teal-300 border-teal-500/40",
        label: `${pct}% High Match`,
      };
    }
    if (pct >= 75) {
      return {
        badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/40",
        label: `${pct}% Compatible`,
      };
    }
    return {
      badgeClass: "bg-neutral-800 text-neutral-300 border-neutral-700",
      label: `${pct}% Nuanced Match`,
    };
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-900/90 shadow-2xl space-y-4">
      {/* Header */}
      <div className="border-b border-neutral-800 bg-neutral-950/80 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base">🔄</span>
            <h3 className="text-base font-black text-white tracking-tight">
              Top 10 Cross-Brand Matches & Substitution Mixtures
            </h3>
            <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
              {top10.length} Available
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Ranked by multi-dimensional UHCR distance ($D$). If out of stock, tap &quot;Use This Formula&quot; to switch brands instantly.
          </p>
        </div>

        <span className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-1 text-[11px] font-mono text-neutral-400">
          UHCR Standard v1.0
        </span>
      </div>

      {/* Desktop & Tablet Table View */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-neutral-300">
          <thead className="border-b border-neutral-800 bg-neutral-950 text-[11px] uppercase tracking-wider text-neutral-400 font-mono">
            <tr>
              <th scope="col" className="px-4 py-3"># Rank</th>
              <th scope="col" className="px-4 py-3">Brand & Line</th>
              <th scope="col" className="px-4 py-3">Shade Code</th>
              <th scope="col" className="px-4 py-3">Shade Name</th>
              <th scope="col" className="px-4 py-3">Accuracy Level</th>
              <th scope="col" className="px-4 py-3">Mixing & Substitution Recipe</th>
              <th scope="col" className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {top10.map((c, idx) => {
              const brand = getBrandBadge(c.manufacturer);
              const accuracy = c.accuracy_percentage ?? Math.max(50, Math.min(100, Math.round((1.0 - 1.25 * c.composite_distance) * 100)));
              const accStyle = getAccuracyStyle(accuracy);
              const isSelected = selectedShadeCode === c.shade_code;

              const fallbackRecipe = `Mix 60g ${c.shade_code} with ${c.recommended_developer || "20 Vol Developer"} (${c.mixing_ratio || "1:1"} ratio) for ${c.processing_time_minutes || 35} min.`;
              const recipeText = c.substitution_recipe || fallbackRecipe;

              return (
                <tr
                  key={idx}
                  className={`hover:bg-neutral-800/40 transition-colors ${
                    isSelected ? "bg-amber-500/10 border-l-2 border-l-amber-500" : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3.5 font-mono text-neutral-400 font-bold">
                    #{idx + 1}
                  </td>

                  {/* Brand & Line */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block rounded-lg px-2.5 py-0.5 text-[11px] font-bold border ${brand.className}`}
                    >
                      {brand.label}
                    </span>
                    <span className="block text-[10px] text-neutral-400 mt-1 truncate max-w-[140px]">
                      {c.product_line}
                    </span>
                  </td>

                  {/* Verbatim Code */}
                  <td className="px-4 py-3.5 font-mono font-black text-white text-sm">
                    {c.shade_code}
                  </td>

                  {/* Shade Name & Mapping */}
                  <td className="px-4 py-3.5">
                    <span className="font-semibold text-neutral-200 block text-xs">
                      {c.shade_name}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      Level {c.universal_mapping.level} {c.universal_mapping.primary_tone}
                      {c.universal_mapping.secondary_tone ? `/${c.universal_mapping.secondary_tone}` : ""}
                    </span>
                  </td>

                  {/* Accuracy Badge */}
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] font-bold ${accStyle.badgeClass}`}
                    >
                      <span>🎯</span>
                      <span>{accStyle.label}</span>
                    </span>
                    <span className="block text-[10px] text-neutral-500 mt-1 font-mono">
                      $D = {c.composite_distance.toFixed(3)}$
                    </span>
                  </td>

                  {/* Substitution Recipe */}
                  <td className="px-4 py-3.5 max-w-[280px]">
                    <p className="text-[11px] text-neutral-300 font-medium leading-relaxed bg-black/40 rounded-xl p-2 border border-neutral-800">
                      {recipeText}
                    </p>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3.5 text-right">
                    {onSelectCandidate ? (
                      <button
                        type="button"
                        onClick={() => onSelectCandidate(c)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all cursor-pointer ${
                          isSelected
                            ? "bg-emerald-500 text-neutral-950 shadow-md"
                            : "bg-amber-500 hover:bg-amber-400 text-neutral-950 hover:scale-105 active:scale-95"
                        }`}
                      >
                        {isSelected ? "✓ Active" : "🥣 Use Formula"}
                      </button>
                    ) : (
                      <span className="text-[10px] text-neutral-500 font-mono">Verified</span>
                    )}
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
