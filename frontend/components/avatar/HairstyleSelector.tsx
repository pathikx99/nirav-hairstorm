"use client";

import React from "react";
import { HairstyleId } from "../../features/avatar/types/avatar.types";
import {
  HAIRSTYLES_ORDER,
  HAIRSTYLES_REGISTRY,
} from "../../features/avatar/data/avatarRegistry";

interface HairstyleSelectorProps {
  currentHairstyle: HairstyleId;
  onSelectHairstyle: (id: HairstyleId) => void;
  className?: string;
}

export function HairstyleSelector({
  currentHairstyle,
  onSelectHairstyle,
  className = "",
}: HairstyleSelectorProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-black tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
          <span>💇‍♀️</span>
          <span>Hair Texture & Archetype</span>
        </label>
        <span className="text-[11px] font-bold text-amber-400">
          {HAIRSTYLES_REGISTRY[currentHairstyle].name} ({HAIRSTYLES_REGISTRY[currentHairstyle].typeCode})
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {HAIRSTYLES_ORDER.map((id) => {
          const meta = HAIRSTYLES_REGISTRY[id];
          const isSelected = currentHairstyle === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectHairstyle(id)}
              className={`group relative flex flex-col text-left rounded-2xl border p-2.5 transition-all text-xs ${
                isSelected
                  ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-lg shadow-amber-500/10"
                  : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800/50"
              }`}
            >
              {/* Hairstyle Preview Icon / Thumbnail */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">
                  {id === "straight" ? "🥢" : id === "wavy" ? "🌊" : id === "curly" ? "🌀" : "✨"}
                </span>
                <span
                  className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                    isSelected
                      ? "bg-amber-500 text-neutral-950"
                      : "bg-neutral-800 text-neutral-400 group-hover:text-neutral-300"
                  }`}
                >
                  {meta.typeCode}
                </span>
              </div>

              <span className={`font-black text-xs ${isSelected ? "text-amber-300" : "text-white"}`}>
                {meta.name}
              </span>

              <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                {meta.subtitle}
              </span>

              {/* Optical Parameters Badges */}
              <div className="mt-2 pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[9px] text-neutral-400 font-mono">
                <span>Sheen: {meta.specularExponent.toFixed(0)}</span>
                <span>Vol: {meta.volumeMultiplier.toFixed(2)}x</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
