"use client";

import React from "react";
import { AvatarLightingEnvironment } from "../../features/avatar/types/avatar.types";
import {
  LIGHTING_ORDER,
  LIGHTING_PROFILES,
} from "../../features/avatar/data/lightingProfiles";

interface LightingSelectorProps {
  currentLighting: AvatarLightingEnvironment;
  onSelectLighting: (lighting: AvatarLightingEnvironment) => void;
  className?: string;
}

export function LightingSelector({
  currentLighting,
  onSelectLighting,
  className = "",
}: LightingSelectorProps) {
  const currentProfile = LIGHTING_PROFILES[currentLighting] || LIGHTING_PROFILES.SALON;

  return (
    <div className={`space-y-2.5 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-black tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
          <span>💡</span>
          <span>Illuminant & Metamerism Simulation</span>
        </label>
        <span className="text-[11px] font-bold text-amber-400 font-mono">
          {currentProfile.cct} • CRI {currentProfile.cri}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {LIGHTING_ORDER.map((id) => {
          const profile = LIGHTING_PROFILES[id];
          const isSelected = currentLighting === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectLighting(id)}
              className={`flex flex-col text-left p-2.5 rounded-2xl border transition-all ${
                isSelected
                  ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-md"
                  : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700 hover:bg-neutral-800/40"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-base">{profile.icon}</span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                    isSelected ? "bg-amber-500 text-neutral-950" : "bg-neutral-800 text-neutral-400"
                  }`}
                >
                  {profile.cct}
                </span>
              </div>

              <span className={`text-xs font-black truncate ${isSelected ? "text-amber-300" : "text-white"}`}>
                {profile.name}
              </span>

              <span className="text-[10px] text-neutral-400 line-clamp-1 mt-0.5">
                {profile.illuminantStandard}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
