"use client";

import React from "react";

interface VisualGreySelectorProps {
  value: number;
  onChange: (greyPct: number) => void;
}

const GREY_OPTIONS = [
  {
    pct: 0,
    label: "0%",
    sublabel: "No Grey",
    hairStyle: "linear-gradient(135deg, #09090b 0%, #1c1917 100%)",
  },
  {
    pct: 25,
    label: "25%",
    sublabel: "A Few Strands",
    hairStyle:
      "repeating-linear-gradient(90deg, #1c1917, #1c1917 6px, #e2e8f0 7px, #1c1917 8px)",
  },
  {
    pct: 50,
    label: "50%",
    sublabel: "Half Grey",
    hairStyle:
      "repeating-linear-gradient(90deg, #1c1917, #1c1917 3px, #e2e8f0 4px, #e2e8f0 6px)",
  },
  {
    pct: 100,
    label: "100%",
    sublabel: "Fully White",
    hairStyle: "linear-gradient(135deg, #cbd5e1 0%, #f8fafc 50%, #94a3b8 100%)",
  },
];

export function VisualGreySelector({ value, onChange }: VisualGreySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-bold text-white flex items-center gap-2">
          <span>👵</span> Grey Hair Percentage
        </label>
        <span className="text-xs font-mono font-bold text-amber-400">
          Selected: {value}%
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {GREY_OPTIONS.map((opt) => {
          const isSelected =
            (opt.pct === 0 && value === 0) ||
            (opt.pct === 25 && value > 0 && value <= 35) ||
            (opt.pct === 50 && value > 35 && value < 80) ||
            (opt.pct === 100 && value >= 80);

          return (
            <button
              key={opt.pct}
              type="button"
              onClick={() => onChange(opt.pct)}
              className={`group flex flex-col items-center rounded-2xl border p-3 transition-all text-center ${
                isSelected
                  ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 scale-[1.03] shadow-md shadow-amber-500/20"
                  : "border-neutral-800 bg-neutral-900/60 hover:border-neutral-700 hover:bg-neutral-800"
              }`}
            >
              {/* Hair visual representation */}
              <div
                className="w-full h-14 rounded-xl border border-neutral-700/60 shadow-inner overflow-hidden mb-2 relative"
                style={{ background: opt.hairStyle }}
              >
                {isSelected && (
                  <div className="absolute top-1 right-1 flex items-center justify-center h-5 w-5 rounded-full bg-amber-400 text-neutral-950 font-bold text-xs shadow">
                    ✓
                  </div>
                )}
              </div>

              <span className="text-xs font-bold text-white">
                {opt.label}
              </span>
              <span className="text-[10px] text-neutral-400">
                {opt.sublabel}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
