"use client";

import React from "react";
import { UniversalLevel } from "../../types/uhcr";
import { useApp } from "../../context/AppContext";

interface RealisticHairSwatchProps {
  level: UniversalLevel;
  selected?: boolean;
  onClick?: (level: UniversalLevel) => void;
  size?: "sm" | "md" | "lg";
  lightingMode?: "DAYLIGHT" | "WARM" | "COOL";
  isBleached?: boolean;
}

const LEVEL_NAMES: Record<UniversalLevel, string> = {
  1: "Jet Black",
  2: "Darkest Brown",
  3: "Dark Brown",
  4: "Medium Brown",
  5: "Light Brown",
  6: "Dark Blonde",
  7: "Medium Blonde",
  8: "Light Blonde",
  9: "Very Light Blonde",
  10: "Platinum Blonde",
};

const UNDERTONE_NAMES: Record<UniversalLevel, string> = {
  1: "Blue / Red",
  2: "Dark Red",
  3: "Deep Red",
  4: "Red",
  5: "Red-Orange",
  6: "Orange",
  7: "Yellow-Orange",
  8: "Yellow",
  9: "Pale Yellow",
  10: "Extra Pale Yellow",
};

// Calibrated realistic hair strand gradients matching real hair swatch depths (Levels 1-10)
const HAIR_STRAND_GRADIENTS: Record<UniversalLevel, string> = {
  1: "linear-gradient(135deg, #090807 0%, #141210 35%, #24201c 55%, #090807 100%)",
  2: "linear-gradient(135deg, #100d0b 0%, #1e1915 35%, #322a23 55%, #100d0b 100%)",
  3: "linear-gradient(135deg, #18120f 0%, #2c221e 35%, #44362e 55%, #18120f 100%)",
  4: "linear-gradient(135deg, #221812 0%, #3d2d24 35%, #5c4638 55%, #22180d 100%)",
  5: "linear-gradient(135deg, #30211a 0%, #543d32 35%, #7a5c4a 55%, #30211a 100%)",
  6: "linear-gradient(135deg, #463224 0%, #755742 35%, #9e7a5e 55%, #463224 100%)",
  7: "linear-gradient(135deg, #644c36 0%, #9e7b5c 35%, #c6a07a 55%, #644c36 100%)",
  8: "linear-gradient(135deg, #886c4c 0%, #c4a47c 35%, #e4c69e 55%, #886c4c 100%)",
  9: "linear-gradient(135deg, #aa8c66 0%, #e2c39a 35%, #f8e0be 55%, #aa8c66 100%)",
  10: "linear-gradient(135deg, #c4ac8e 0%, #f3dec2 35%, #fff4e1 55%, #c4ac8e 100%)",
};

// Bleached / Pre-lightened Raw Underlying Warm Undertones (Levels 1-10)
const UNDERTONE_STRAND_GRADIENTS: Record<UniversalLevel, string> = {
  1: "linear-gradient(135deg, #100302 0%, #220a06 35%, #3a120b 55%, #100302 100%)",
  2: "linear-gradient(135deg, #1c0603 0%, #380f08 35%, #56180e 55%, #1c0603 100%)",
  3: "linear-gradient(135deg, #300a04 0%, #58160a 35%, #802010 55%, #300a04 100%)",
  4: "linear-gradient(135deg, #461205 0%, #7c220c 35%, #aa3214 55%, #461205 100%)",
  5: "linear-gradient(135deg, #621e07 0%, #a63810 35%, #d44c18 55%, #621e07 100%)",
  6: "linear-gradient(135deg, #7a3209 0%, #c65415 35%, #ef7022 55%, #7a3209 100%)",
  7: "linear-gradient(135deg, #8e4c0c 0%, #de7c1a 35%, #ffa02e 55%, #8e4c0c 100%)",
  8: "linear-gradient(135deg, #9e6e12 0%, #e8a82a 35%, #ffcc48 55%, #9e6e12 100%)",
  9: "linear-gradient(135deg, #b29230 0%, #f2cf58 35%, #ffe47e 55%, #b29230 100%)",
  10: "linear-gradient(135deg, #c8bc6e 0%, #fbf0a8 35%, #fffad2 55%, #c8bc6e 100%)",
};

export function RealisticHairSwatch({
  level,
  selected = false,
  onClick,
  lightingMode: propLightingMode,
  isBleached = false,
}: RealisticHairSwatchProps) {
  const { lightingMode: contextLightingMode } = useApp();
  const activeLight = propLightingMode || contextLightingMode || "DAYLIGHT";
  const name = isBleached
    ? UNDERTONE_NAMES[level] || `Undertone ${level}`
    : LEVEL_NAMES[level] || `Level ${level}`;

  // Multi-lighting metamerism adaptation filters (calibrated, subtle, non-distorting)
  const getLightingFilter = () => {
    switch (activeLight) {
      case "WARM":
        return "sepia(0.06) saturate(1.05) brightness(0.98)";
      case "COOL":
        return "brightness(0.97) contrast(1.03) hue-rotate(4deg) saturate(0.96)";
      case "DAYLIGHT":
      default:
        return "brightness(1.0) contrast(1.0)";
    }
  };

  const swatchGradient = isBleached
    ? UNDERTONE_STRAND_GRADIENTS[level]
    : HAIR_STRAND_GRADIENTS[level];

  return (
    <button
      type="button"
      onClick={() => onClick?.(level)}
      className={`group relative flex flex-col items-center justify-between rounded-2xl border p-2.5 transition-all text-left w-full ${
        selected
          ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 scale-[1.03] shadow-lg shadow-amber-500/20"
          : "border-neutral-800 bg-neutral-900/70 hover:border-neutral-600 hover:bg-neutral-800"
      }`}
      aria-pressed={selected}
    >
      {/* Hair Swatch Visual Simulation */}
      <div
        className="relative w-full h-24 rounded-xl overflow-hidden shadow-inner border border-neutral-700/50 transition-all duration-300"
        style={{
          background: swatchGradient,
          filter: getLightingFilter(),
        }}
      >
        {/* Soft Hair Fiber Sheen Overlay (Tamed, realistic salon luster) */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/50" />
        
        {/* Hair Strand Flow Lines */}
        <div className="absolute inset-0 opacity-15 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.15)_3px,transparent_4px)]" />

        {/* Lighting Atmosphere Tint */}
        {activeLight === "WARM" && (
          <div className="absolute inset-0 bg-amber-500/5 pointer-events-none mix-blend-overlay" />
        )}
        {activeLight === "COOL" && (
          <div className="absolute inset-0 bg-sky-500/5 pointer-events-none mix-blend-overlay" />
        )}

        {/* Level Badge Overlay */}
        <div className="absolute top-2 left-2 flex items-center justify-center h-8 w-8 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-black text-sm shadow-md">
          {level}
        </div>

        {selected && (
          <div className="absolute top-2 right-2 flex items-center justify-center h-7 w-7 rounded-full bg-amber-400 text-neutral-950 font-black text-xs shadow-lg animate-pulse">
            ✓
          </div>
        )}

        {/* Bleached / Undertone Indicator Tag */}
        {isBleached && (
          <div className="absolute bottom-1 left-1.5 px-1.5 py-0.5 rounded bg-amber-500/90 text-[8px] font-black text-neutral-950 uppercase tracking-tighter">
            Undertone
          </div>
        )}

        {/* Ambient Light Indicator Tag */}
        <div className="absolute bottom-1 right-1.5 px-1.5 py-0.5 rounded bg-black/60 text-[9px] font-mono text-neutral-300 backdrop-blur-xs">
          {activeLight === "WARM" ? "💡 3000K" : activeLight === "COOL" ? "🏢 4000K" : "☀️ 6500K"}
        </div>
      </div>

      {/* Label under swatch */}
      <div className="mt-2.5 w-full text-center">
        <span className="block text-xs font-bold text-white tracking-wide">
          Level {level}
        </span>
        <span className={`block text-[11px] font-medium truncate mt-0.5 ${isBleached ? "text-amber-400 font-bold" : "text-amber-300"}`}>
          {name}
        </span>
      </div>
    </button>
  );
}
