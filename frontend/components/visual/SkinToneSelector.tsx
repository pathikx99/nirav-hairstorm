"use client";

import React from "react";
import { SKIN_TONES, SkinTone } from "../../constants/skinTones";
import { useApp } from "../../context/AppContext";

interface SkinToneSelectorProps {
  value?: SkinTone;
  onChange?: (tone: SkinTone) => void;
  className?: string;
  compact?: boolean;
}

export function SkinToneSelector({
  value,
  onChange,
  className = "",
  compact = false,
}: SkinToneSelectorProps) {
  const { skinTone: contextSkinTone, setSkinTone: contextSetSkinTone } = useApp();

  const activeTone = value ?? contextSkinTone;
  const handleSelect = (tone: SkinTone) => {
    if (onChange) {
      onChange(tone);
    } else {
      contextSetSkinTone(tone);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-neutral-800 bg-neutral-900/80 p-2.5 sm:p-3 ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
          <span>🧑</span>
          <span>Skin Tone</span>
        </span>
        <span className="text-[10px] font-mono text-amber-400 capitalize">
          {SKIN_TONES.find((s) => s.id === activeTone)?.label}
        </span>
      </div>

      <div className="flex items-center justify-between gap-1 sm:gap-1.5">
        {SKIN_TONES.map((tone) => {
          const isSelected = activeTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              onClick={() => handleSelect(tone.id)}
              className={`relative flex flex-col items-center justify-center transition-all ${
                isSelected
                  ? "scale-110 z-10"
                  : "hover:scale-105 opacity-80 hover:opacity-100"
              }`}
              title={`${tone.label} Skin Tone`}
              aria-label={`${tone.label} Skin Tone`}
            >
              <div
                className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full shadow-md transition-all ${
                  isSelected
                    ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-105"
                    : "border border-white/20"
                }`}
                style={{ backgroundColor: tone.preview }}
              />
              {!compact && (
                <span
                  className={`text-[8px] sm:text-[9px] mt-1 font-semibold transition-colors ${
                    isSelected ? "text-amber-400 font-bold" : "text-neutral-400"
                  }`}
                >
                  {tone.label.slice(0, 3)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
