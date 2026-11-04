"use client";

import { UNIVERSAL_LEVEL_DETAILS, UniversalLevel } from "../types/uhcr";

interface LevelSwatchProps {
  level: UniversalLevel;
  selected?: boolean;
  onClick?: (level: UniversalLevel) => void;
  size?: "sm" | "md" | "lg";
}

export function LevelSwatch({
  level,
  selected = false,
  onClick,
  size = "md",
}: LevelSwatchProps) {
  const details = UNIVERSAL_LEVEL_DETAILS[level];

  const sizeClasses = {
    sm: "h-8 px-2 text-xs",
    md: "h-11 px-3 text-sm",
    lg: "h-14 px-4 text-base",
  }[size];

  const swatchDimensions = {
    sm: "h-4 w-4",
    md: "h-6 w-6",
    lg: "h-7 w-7",
  }[size];

  return (
    <button
      type="button"
      onClick={() => onClick?.(level)}
      className={`group relative flex items-center justify-between rounded-lg border transition-all ${sizeClasses} ${
        selected
          ? "border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20 ring-1 ring-amber-500"
          : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/60"
      }`}
      aria-pressed={selected}
      title={`Level ${level}: ${details.name} — ${details.desc}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`rounded-md border border-neutral-700/50 shadow-inner ${swatchDimensions}`}
          style={{ backgroundColor: details.hex }}
          aria-hidden="true"
        />
        <div className="text-left">
          <span className="font-semibold text-white">L{level}</span>
          <span className="ml-1.5 text-neutral-400 group-hover:text-neutral-300">
            {details.name}
          </span>
        </div>
      </div>

      {selected && (
        <span className="text-amber-400 text-xs font-bold" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}
