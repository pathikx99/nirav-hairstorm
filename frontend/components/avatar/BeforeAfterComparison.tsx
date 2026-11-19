"use client";

import React from "react";

interface BeforeAfterComparisonProps {
  mode: "split" | "toggle" | "off";
  splitRatio: number;
  showOriginal: boolean;
  onChangeMode: (mode: "split" | "toggle" | "off") => void;
  onChangeSplit: (ratio: number) => void;
  onToggleOriginal: (show: boolean) => void;
  className?: string;
}

export function BeforeAfterComparison({
  mode,
  splitRatio,
  showOriginal,
  onChangeMode,
  onChangeSplit,
  onToggleOriginal,
  className = "",
}: BeforeAfterComparisonProps) {
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-2.5 rounded-2xl border border-neutral-800 ${className}`}>
      {/* Mode Buttons */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-bold text-neutral-400 mr-1 hidden sm:inline">Compare:</span>
        <button
          type="button"
          onClick={() => {
            onChangeMode("off");
            onToggleOriginal(false);
          }}
          className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
            mode === "off" && !showOriginal
              ? "border-amber-500 bg-amber-500 text-neutral-950 shadow-sm"
              : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white"
          }`}
        >
          Result
        </button>

        <button
          type="button"
          onClick={() => {
            onChangeMode("split");
            onToggleOriginal(false);
          }}
          className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 ${
            mode === "split"
              ? "border-amber-500 bg-amber-500 text-neutral-950 shadow-sm"
              : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white"
          }`}
        >
          <span>⚖️</span>
          <span>Split View</span>
        </button>

        <button
          type="button"
          onMouseDown={() => onToggleOriginal(true)}
          onMouseUp={() => onToggleOriginal(false)}
          onTouchStart={() => onToggleOriginal(true)}
          onTouchEnd={() => onToggleOriginal(false)}
          onClick={() => {
            if (mode === "toggle") {
              onToggleOriginal(!showOriginal);
            } else {
              onChangeMode("toggle");
              onToggleOriginal(true);
            }
          }}
          className={`px-3 py-1 text-xs font-bold rounded-xl border transition-all ${
            showOriginal
              ? "border-amber-500 bg-amber-500/20 text-amber-300 ring-1 ring-amber-500"
              : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:text-white"
          }`}
          title="Hold or click to preview uncoloured natural base"
        >
          {showOriginal ? "Showing Before" : "Hold for Before"}
        </button>
      </div>

      {/* Split Slider when Split is Active */}
      {mode === "split" && (
        <div className="flex items-center gap-2 flex-1 max-w-xs ml-auto">
          <span className="text-[10px] font-bold text-neutral-400">Before</span>
          <input
            type="range"
            min="0.05"
            max="0.95"
            step="0.01"
            value={splitRatio}
            onChange={(e) => onChangeSplit(parseFloat(e.target.value))}
            className="w-full accent-amber-500 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-bold text-amber-400">After</span>
        </div>
      )}
    </div>
  );
}
