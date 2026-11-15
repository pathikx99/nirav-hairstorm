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

// Realistic hair strand gradients with fiber luster and natural undertones
const HAIR_STRAND_GRADIENTS: Record<UniversalLevel, string> = {
  1: "linear-gradient(135deg, #09090b 0%, #18181b 35%, #27272a 50%, #09090b 100%)",
  2: "linear-gradient(135deg, #1c140e 0%, #291c13 35%, #3d2b1f 50%, #1c140e 100%)",
  3: "linear-gradient(135deg, #26170e 0%, #3d2417 35%, #593522 50%, #26170e 100%)",
  4: "linear-gradient(135deg, #361f14 0%, #523120 35%, #6e432c 50%, #361f14 100%)",
  5: "linear-gradient(135deg, #4a2d1d 0%, #6e442d 35%, #8f5c3e 50%, #4a2d1d 100%)",
  6: "linear-gradient(135deg, #69442a 0%, #94633e 35%, #b58055 50%, #69442a 100%)",
  7: "linear-gradient(135deg, #875c39 0%, #b88554 35%, #d4a572 50%, #875c39 100%)",
  8: "linear-gradient(135deg, #a87948 0%, #d4a46a 35%, #edd095 50%, #a87948 100%)",
  9: "linear-gradient(135deg, #c79e65 0%, #ecd09b 35%, #fff1cb 50%, #c79e65 100%)",
  10: "linear-gradient(135deg, #e3c594 0%, #f7e6c4 35%, #ffffff 50%, #e3c594 100%)",
};

export function RealisticHairSwatch({
  level,
  selected = false,
  onClick,
  lightingMode: propLightingMode,
}: RealisticHairSwatchProps) {
  const { lightingMode: contextLightingMode } = useApp();
  const activeLight = propLightingMode || contextLightingMode || "DAYLIGHT";
  const name = LEVEL_NAMES[level] || `Level ${level}`;

  // Multi-lighting metamerism adaptation filters
  const getLightingFilter = () => {
    switch (activeLight) {
      case "WARM":
        return "sepia(0.2) saturate(1.25) brightness(1.03)";
      case "COOL":
        return "brightness(0.96) contrast(1.08) hue-rotate(10deg) saturate(0.9)";
      case "DAYLIGHT":
      default:
        return "brightness(1.02) contrast(1.02)";
    }
  };

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
          background: HAIR_STRAND_GRADIENTS[level],
          filter: getLightingFilter(),
        }}
      >
        {/* Silky Hair Fiber Sheen Overlay */}
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/40 via-transparent to-black/40" />
        
        {/* Hair Strand Flow Lines */}
        <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.2)_3px,transparent_4px)]" />

        {/* Lighting Atmosphere Tint */}
        {activeLight === "WARM" && (
          <div className="absolute inset-0 bg-amber-500/10 pointer-events-none mix-blend-overlay" />
        )}
        {activeLight === "COOL" && (
          <div className="absolute inset-0 bg-sky-500/10 pointer-events-none mix-blend-overlay" />
        )}

        {/* Level Badge Overlay */}
        <div className="absolute top-2 left-2 flex items-center justify-center h-8 w-8 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-white font-black text-sm shadow-md">
          {level}
        </div>

        {selected && (
          <div className="absolute top-2 right-2 flex items-center justify-center h-7 w-7 rounded-full bg-amber-400 text-neutral-950 font-black text-xs shadow-lg animate-pulse">
            ✓
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
        <span className="block text-[11px] text-amber-300 font-medium truncate mt-0.5">
          {name}
        </span>
      </div>
    </button>
  );
}
