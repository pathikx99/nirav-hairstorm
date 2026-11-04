"use client";

import { LevelSwatch } from "../../components/LevelSwatch";
import { UniversalLevel } from "../../types/uhcr";

interface LevelSelectorProps {
  selectedLevel: UniversalLevel;
  onChange: (level: UniversalLevel) => void;
}

export function LevelSelector({ selectedLevel, onChange }: LevelSelectorProps) {
  const levels: UniversalLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <span>🎯</span> Target Universal Depth Level (UHCR 1–10)
        </h3>
        <span className="text-xs font-mono font-bold text-amber-400">
          Target: Level {selectedLevel}
        </span>
      </div>
      <p className="text-xs text-neutral-400 mb-4">
        Standardised universal depth independent of manufacturer numbers.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        {levels.map((lvl) => (
          <LevelSwatch
            key={lvl}
            level={lvl}
            selected={selectedLevel === lvl}
            onClick={onChange}
            size="md"
          />
        ))}
      </div>
    </div>
  );
}
