"use client";

import React, { useState } from "react";
import { SkinTone } from "../../constants/skinTones";
import { SkinCustomAdjustment } from "../../features/avatar/types/avatar.types";
import {
  getSkinToneMetadata,
  SKIN_TONE_ORDER,
  SKIN_TONE_PALETTE,
} from "../../features/avatar/data/skinTonePalette";

interface SkinToneSelectorProps {
  currentTone: SkinTone;
  customAdjustment: SkinCustomAdjustment;
  onSelectTone: (tone: SkinTone) => void;
  onChangeCustom: (custom: SkinCustomAdjustment) => void;
  className?: string;
}

export function SkinToneSelector({
  currentTone,
  customAdjustment,
  onSelectTone,
  onChangeCustom,
  className = "",
}: SkinToneSelectorProps) {
  const [showSliders, setShowSliders] = useState(false);
  const currentMeta = getSkinToneMetadata(currentTone);

  const handlePresetSelect = (tone: SkinTone) => {
    onSelectTone(tone);
    const meta = getSkinToneMetadata(tone);
    onChangeCustom({
      melaninDepth: meta.melaninDepth,
      warmth: meta.warmth,
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-black tracking-wider uppercase text-neutral-400 flex items-center gap-1.5">
          <span>✨</span>
          <span>Client Skin Tone (Monk Scale MST 01–10)</span>
        </label>
        <button
          type="button"
          onClick={() => setShowSliders(!showSliders)}
          className="text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
        >
          <span>{showSliders ? "Hide Fine-Tune" : "Fine-Tune Dermis"}</span>
          <span>{showSliders ? "▲" : "▼"}</span>
        </button>
      </div>

      {/* 10 Swatches Grid */}
      <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
        {SKIN_TONE_ORDER.map((toneId) => {
          const meta = SKIN_TONE_PALETTE[toneId];
          const isSelected = currentTone === toneId;

          return (
            <button
              key={toneId}
              type="button"
              onClick={() => handlePresetSelect(toneId)}
              className={`group flex flex-col items-center gap-1 p-1.5 rounded-xl border transition-all ${
                isSelected
                  ? "border-amber-500 bg-amber-500/20 ring-2 ring-amber-500/50 scale-105"
                  : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-800/60"
              }`}
              title={`${meta.name} (${meta.monkScale} / ${meta.fitzpatrick}) - ${meta.description}`}
            >
              {/* Color Swatch Circle */}
              <div
                className="h-6 w-6 rounded-full border border-neutral-700/80 shadow-inner transition-transform group-hover:scale-110"
                style={{ backgroundColor: meta.hex }}
              />
              <span className={`text-[9px] font-bold truncate max-w-full ${isSelected ? "text-amber-300" : "text-neutral-400"}`}>
                {meta.name.slice(0, 4)}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] bg-neutral-900/60 px-3 py-1.5 rounded-xl border border-neutral-800/80 text-neutral-300">
        <span>Selected: <strong className="text-white">{currentMeta.name}</strong> ({currentMeta.monkScale} • {currentMeta.fitzpatrick})</span>
        <span className="text-neutral-400 font-mono text-[10px]">CIELAB L* {currentMeta.lab[0]}</span>
      </div>

      {/* Fine-Tune Continuous Sliders */}
      {showSliders && (
        <div className="p-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 space-y-3 animate-in fade-in duration-150">
          <div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
              <span>Melanin Depth (Lightness L*)</span>
              <span className="font-mono text-amber-400">
                {(customAdjustment.melaninDepth * 100).toFixed(0)}%
              </span>
            </div>
            <input
              type="range"
              min="0.0"
              max="1.0"
              step="0.01"
              value={customAdjustment.melaninDepth}
              onChange={(e) =>
                onChangeCustom({
                  ...customAdjustment,
                  melaninDepth: parseFloat(e.target.value),
                })
              }
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[11px] font-bold text-neutral-300 mb-1">
              <span>Undertone Warmth / Coolness</span>
              <span className="font-mono text-amber-400">
                {customAdjustment.warmth > 0 ? `+${customAdjustment.warmth.toFixed(2)} Warm` : `${customAdjustment.warmth.toFixed(2)} Cool`}
              </span>
            </div>
            <input
              type="range"
              min="-1.0"
              max="1.0"
              step="0.02"
              value={customAdjustment.warmth}
              onChange={(e) =>
                onChangeCustom({
                  ...customAdjustment,
                  warmth: parseFloat(e.target.value),
                })
              }
              className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => handlePresetSelect(currentTone)}
              className="text-[10px] font-bold text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800"
            >
              Reset to Preset Values
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
