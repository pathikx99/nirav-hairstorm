"use client";

import React, { useState } from "react";
import { HairRegionId, RegionColourConfig } from "../../features/avatar/types/avatar.types";
import { ToneFamily, UniversalLevel, UNIVERSAL_LEVEL_DETAILS, TONE_DETAILS } from "../../types/uhcr";
import { computeHairColorimetry } from "../../services/hairColorimetryService";

interface HairRegionControlsProps {
  regions: Record<HairRegionId, RegionColourConfig>;
  onChangeRegion: (region: HairRegionId, config: Partial<RegionColourConfig>) => void;
  onSyncFormulation?: () => void;
  formulationSynced?: boolean;
  className?: string;
}

const SELECTABLE_TONES: ToneFamily[] = [
  "NATURAL",
  "ASH",
  "PEARL",
  "BEIGE",
  "GOLD",
  "COPPER",
  "RED",
  "MAHOGANY",
  "VIOLET",
  "BLUE",
  "PINK",
];

export function HairRegionControls({
  regions,
  onChangeRegion,
  onSyncFormulation,
  formulationSynced,
  className = "",
}: HairRegionControlsProps) {
  const [activeTab, setActiveTab] = useState<HairRegionId>("roots");

  const activeConfig = regions[activeTab];
  const colorimetry = computeHairColorimetry(
    activeConfig.level,
    activeConfig.primaryTone,
    activeConfig.secondaryTone,
    activeConfig.intensity
  );

  const regionTitles: Record<HairRegionId, { label: string; icon: string; desc: string }> = {
    roots: { label: "Roots", icon: "🌱", desc: "Regrowth & base area (0–2 inches from scalp)" },
    mid_lengths: { label: "Mid-Lengths", icon: "✨", desc: "Main shaft & body cascade" },
    ends: { label: "Ends", icon: "💫", desc: "Distal tips & perimeter edge" },
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-black tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
          <span>🎨</span>
          <span>Hair Regions (Roots • Mid • Ends)</span>
        </label>

        {onSyncFormulation && (
          <button
            type="button"
            onClick={onSyncFormulation}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border transition-all flex items-center gap-1 ${
              formulationSynced
                ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            }`}
            title="Load predicted achievable shades from current formulation"
          >
            <span>{formulationSynced ? "✓" : "⚡"}</span>
            <span>{formulationSynced ? "Synced with Formula" : "Sync Formula"}</span>
          </button>
        )}
      </div>

      {/* Region Selector Tabs with Live Mini Swatches */}
      <div className="grid grid-cols-3 gap-2">
        {(["roots", "mid_lengths", "ends"] as HairRegionId[]).map((regId) => {
          const cfg = regions[regId];
          const c = computeHairColorimetry(cfg.level, cfg.primaryTone, cfg.secondaryTone, cfg.intensity);
          const isSelected = activeTab === regId;

          return (
            <button
              key={regId}
              type="button"
              onClick={() => setActiveTab(regId)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all ${
                isSelected
                  ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500/40 shadow-md"
                  : "border-neutral-800 bg-neutral-900/50 hover:border-neutral-700"
              }`}
            >
              <div
                className="h-6 w-6 rounded-lg border border-neutral-700 shadow-sm flex-shrink-0"
                style={{ backgroundColor: c.baseHex }}
              />
              <div className="min-w-0">
                <div className={`text-xs font-black truncate ${isSelected ? "text-amber-300" : "text-white"}`}>
                  {regionTitles[regId].label}
                </div>
                <div className="text-[10px] text-neutral-400 font-mono truncate">
                  L{cfg.level} • {cfg.primaryTone.slice(0, 3)}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Region Customizer Card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3.5 space-y-4">
        {/* Header Preview Banner */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div
              className="h-9 w-9 rounded-xl border border-neutral-700/80 shadow-inner"
              style={{ background: colorimetry.gradient }}
            />
            <div>
              <div className="text-xs font-black text-white flex items-center gap-1.5">
                <span>{regionTitles[activeTab].icon}</span>
                <span>{regionTitles[activeTab].label}:</span>
                <span className="text-amber-400">
                  Level {activeConfig.level} {UNIVERSAL_LEVEL_DETAILS[activeConfig.level].name}
                </span>
              </div>
              <div className="text-[10px] text-neutral-400">
                Tone: {TONE_DETAILS[activeConfig.primaryTone]?.name || activeConfig.primaryTone}
                {activeConfig.secondaryTone && ` / ${TONE_DETAILS[activeConfig.secondaryTone]?.name}`}
                {activeConfig.isBleached && " • Pre-Lightened"}
                {activeConfig.greyPercentage ? ` • ${activeConfig.greyPercentage}% Grey` : ""}
              </div>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono text-neutral-400 block">{colorimetry.baseHex.toUpperCase()}</span>
            <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">
              {colorimetry.sheenIntensity > 0.7 ? "High Luster" : "Velvet Matte"}
            </span>
          </div>
        </div>

        {/* Universal Level Depth Slider (1 to 10) */}
        <div>
          <div className="flex justify-between text-xs font-bold text-neutral-300 mb-1.5">
            <span>Depth Level</span>
            <span className="text-amber-400 font-mono">
              Level {activeConfig.level} ({UNIVERSAL_LEVEL_DETAILS[activeConfig.level].name})
            </span>
          </div>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={activeConfig.level}
            onChange={(e) =>
              onChangeRegion(activeTab, {
                level: parseInt(e.target.value, 10) as UniversalLevel,
              })
            }
            className="w-full accent-amber-500 h-2 bg-neutral-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-1">
            <span>1 (Black)</span>
            <span>4 (Brown)</span>
            <span>7 (Blonde)</span>
            <span>10 (Platinum)</span>
          </div>
        </div>

        {/* Primary Tone Selector */}
        <div>
          <label className="text-xs font-bold text-neutral-300 block mb-1.5">
            Primary Tone Reflect
          </label>
          <div className="flex flex-wrap gap-1.5">
            {SELECTABLE_TONES.map((tone) => {
              const toneMeta = TONE_DETAILS[tone];
              const isSelected = activeConfig.primaryTone === tone;

              return (
                <button
                  key={tone}
                  type="button"
                  onClick={() => onChangeRegion(activeTab, { primaryTone: tone })}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500 shadow-sm"
                      : "border-neutral-800 bg-neutral-900/80 text-neutral-400 hover:text-white hover:bg-neutral-800"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full border border-neutral-600"
                    style={{ backgroundColor: toneMeta?.hex || "#888" }}
                  />
                  <span>{toneMeta?.name || tone}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nuance & Canities Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Canities / Grey Hair % */}
          <div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
              <span>Canities (Grey Hair)</span>
              <span className="font-mono text-amber-400">{activeConfig.greyPercentage || 0}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={activeConfig.greyPercentage || 0}
              onChange={(e) =>
                onChangeRegion(activeTab, {
                  greyPercentage: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Pre-lightened / Bleached toggle */}
          <div className="flex items-center justify-between p-2 rounded-xl border border-neutral-800 bg-neutral-950/60">
            <div>
              <span className="text-xs font-bold text-neutral-200 block">Pre-Lightened Base</span>
              <span className="text-[10px] text-neutral-400">Enables high-lift vibrancy</span>
            </div>
            <button
              type="button"
              onClick={() => onChangeRegion(activeTab, { isBleached: !activeConfig.isBleached })}
              className={`w-10 h-5 flex items-center rounded-full p-0.5 transition-colors ${
                activeConfig.isBleached ? "bg-amber-500" : "bg-neutral-800"
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                  activeConfig.isBleached ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
