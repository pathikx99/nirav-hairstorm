"use client";

import { TONE_DETAILS, ToneFamily } from "../types/uhcr";

interface ToneChipProps {
  tone: ToneFamily;
  selected?: boolean;
  onClick?: (tone: ToneFamily) => void;
  showReflect?: boolean;
}

export function ToneChip({
  tone,
  selected = false,
  onClick,
  showReflect = true,
}: ToneChipProps) {
  const details = TONE_DETAILS[tone];

  return (
    <button
      type="button"
      onClick={() => onClick?.(tone)}
      className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
        selected
          ? "border-rose-500 bg-rose-500/10 text-white ring-1 ring-rose-500 shadow-sm"
          : "border-neutral-800 bg-neutral-900/60 text-neutral-300 hover:border-neutral-700 hover:bg-neutral-800/60"
      }`}
      aria-pressed={selected}
    >
      <span
        className="h-3.5 w-3.5 shrink-0 rounded-full border border-neutral-700 shadow-sm"
        style={{ backgroundColor: details.hex }}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <span className="font-semibold">{details.name}</span>
        {showReflect && (
          <span className="text-[10px] text-neutral-500 group-hover:text-neutral-400">
            {details.reflect}
          </span>
        )}
      </div>
    </button>
  );
}
