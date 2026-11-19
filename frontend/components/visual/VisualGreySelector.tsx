"use client";

import React from "react";

interface VisualGreySelectorProps {
  value: number;
  onChange: (greyPct: number) => void;
}

const GREY_PRESETS = [
  {
    pct: 0,
    label: "0%",
    title: "Pure Pigment",
    sublabel: "No White Hairs",
    // Deep black-brown natural hair fiber luster
    gradient: "linear-gradient(135deg, #09090b 0%, #171513 35%, #26211c 55%, #09090b 100%)",
  },
  {
    pct: 25,
    label: "25%",
    title: "A Few Strands",
    sublabel: "Early Salt & Pepper",
    // Scattered fine silver micro-filaments on dark base
    gradient:
      "linear-gradient(135deg, #101014 0%, #222026 30%, #e2e8f0 32%, #141318 36%, #28252d 70%, #f1f5f9 72%, #101014 100%)",
  },
  {
    pct: 50,
    label: "50%",
    title: "Salt & Pepper",
    sublabel: "Half White Canities",
    // Balanced alternating translucent silver-white and pigmented fibers
    gradient:
      "linear-gradient(135deg, #18171d 0%, #e2e8f0 20%, #1e1d24 35%, #f8fafc 52%, #18171d 68%, #cbd5e1 85%, #0f0e13 100%)",
  },
  {
    pct: 75,
    label: "75%",
    title: "Mostly Silver",
    sublabel: "Heavy White Regrowth",
    // Predominantly silver-white with subtle dark depth
    gradient:
      "linear-gradient(135deg, #cbd5e1 0%, #f8fafc 25%, #33313b 35%, #ffffff 55%, #e2e8f0 75%, #1e1d24 88%, #f8fafc 100%)",
  },
  {
    pct: 100,
    label: "100%",
    title: "Pure Snow White",
    sublabel: "Total Canities (No Melanin)",
    // Pure translucent amelanotic silver-white fibers with crystalline shine
    gradient:
      "linear-gradient(135deg, #e2e8f0 0%, #ffffff 35%, #f1f5f9 55%, #e2e8f0 80%, #ffffff 100%)",
  },
];

export function VisualGreySelector({ value, onChange }: VisualGreySelectorProps) {
  // Trichological chemical rule based on exact white hair percentage
  const getChemicalRule = () => {
    if (value === 0) {
      return {
        type: "success" as const,
        icon: "✓",
        badge: "0% White • Pure Pigment",
        text: "100% Fashion shade can be applied directly. No natural base blending required.",
      };
    }
    if (value < 30) {
      return {
        type: "info" as const,
        icon: "ℹ️",
        badge: `${value}% White • Low White Coverage`,
        text: "Under 30% white: Fashion shade covers well with 20 Vol (6%). Natural base is optional.",
      };
    }
    if (value <= 50) {
      return {
        type: "warning" as const,
        icon: "⚠️",
        badge: `${value}% White • Blend 25% Base`,
        text: "30%–50% White: Add 25% Natural Base (/0 or /00) + 75% Fashion shade with 20 Vol (6%) developer to guarantee solid coverage.",
      };
    }
    if (value < 80) {
      return {
        type: "warning" as const,
        icon: "⚠️",
        badge: `${value}% White • Blend 50% Base (1:1)`,
        text: "50%–80% White: Blend 50% Natural Base (/0 or /00) + 50% Fashion shade with 20 Vol (6%) developer. Equal parts required to prevent translucent results.",
      };
    }
    return {
      type: "alert" as const,
      icon: "🛑",
      badge: `${value}% White • Resistant Canities`,
      text: "80%–100% White: Double-Pigment Intense Natural Base (/00) + 20 Vol (6%) mandatory. Pre-softening or 1:1 mixing required for 100% solid opacity.",
    };
  };

  const rule = getChemicalRule();

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5 shadow-lg space-y-4">
      {/* Header with Title and Live Diagnostic Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
        <div>
          <label className="text-sm font-black text-white flex items-center gap-2">
            <span>👵</span>
            <span>White & Grey Hair Diagnostic (Canities)</span>
          </label>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            Real human white hair lacks melanin completely. Adjust slider to match customer ratio.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="text-xs font-mono font-black text-amber-300 bg-amber-500/15 border border-amber-500/30 px-3 py-1 rounded-xl shadow-xs">
            {value}% White Hairs
          </span>
        </div>
      </div>

      {/* Preset Visual Cards (0%, 25%, 50%, 75%, 100%) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {GREY_PRESETS.map((opt) => {
          const isSelected =
            (opt.pct === 0 && value === 0) ||
            (opt.pct === 25 && value > 0 && value <= 35) ||
            (opt.pct === 50 && value > 35 && value <= 65) ||
            (opt.pct === 75 && value > 65 && value < 90) ||
            (opt.pct === 100 && value >= 90);

          return (
            <button
              key={opt.pct}
              type="button"
              onClick={() => onChange(opt.pct)}
              className={`group flex flex-col items-center rounded-2xl border p-2.5 transition-all text-center cursor-pointer relative ${
                isSelected
                  ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 scale-[1.02] shadow-md shadow-amber-500/20"
                  : "border-neutral-800 bg-neutral-950/80 hover:border-neutral-700 hover:bg-neutral-800/60"
              }`}
            >
              {/* Hair visual representation swatch */}
              <div
                className="w-full h-12 rounded-xl border border-white/20 shadow-inner overflow-hidden mb-2 relative"
                style={{ background: opt.gradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-white/20 pointer-events-none" />
                {isSelected && (
                  <div className="absolute top-1 right-1 flex items-center justify-center h-4 w-4 rounded-full bg-amber-400 text-neutral-950 font-black text-[9px] shadow-sm">
                    ✓
                  </div>
                )}
              </div>

              <span className="text-xs font-black text-white block">
                {opt.label}
              </span>
              <span className="text-[10px] font-bold text-amber-300 block truncate w-full">
                {opt.title}
              </span>
              <span className="text-[9px] text-neutral-400 block truncate w-full">
                {opt.sublabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Smooth Precision Slider (0% to 100% in 5% increments) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
          <span>0% (Virgin Black/Brown)</span>
          <span className="text-amber-400 font-bold">Fine Tuning: {value}%</span>
          <span>100% (Solid Silver White)</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400"
        />
      </div>

      {/* Salon Formulation Rule Callout */}
      <div
        className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
          rule.type === "alert"
            ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
            : rule.type === "warning"
            ? "bg-amber-500/10 border-amber-500/30 text-amber-200"
            : "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
        }`}
      >
        <span className="text-base shrink-0">{rule.icon}</span>
        <div className="space-y-0.5">
          <span className="font-black uppercase tracking-wider text-[10px] block">
            {rule.badge}
          </span>
          <p className="text-[11px] leading-relaxed text-neutral-300">
            {rule.text}
          </p>
        </div>
      </div>
    </div>
  );
}
