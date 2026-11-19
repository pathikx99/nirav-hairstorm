"use client";

import React from "react";
import { AvatarView } from "../../features/avatar/types/avatar.types";

interface AvatarViewSwitcherProps {
  currentView: AvatarView;
  onViewChange: (view: AvatarView) => void;
  className?: string;
}

export function AvatarViewSwitcher({
  currentView,
  onViewChange,
  className = "",
}: AvatarViewSwitcherProps) {
  return (
    <div className={`inline-flex items-center rounded-2xl bg-neutral-900/90 p-1 border border-neutral-800 shadow-lg backdrop-blur-md ${className}`}>
      <button
        type="button"
        onClick={() => onViewChange("front")}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
          currentView === "front"
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black shadow-md shadow-amber-500/25"
            : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
        }`}
        aria-pressed={currentView === "front"}
      >
        <span>👤</span>
        <span>Front View</span>
      </button>

      <button
        type="button"
        onClick={() => onViewChange("back")}
        className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
          currentView === "back"
            ? "bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 font-black shadow-md shadow-amber-500/25"
            : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
        }`}
        aria-pressed={currentView === "back"}
      >
        <span>🔄</span>
        <span>Back Cascade</span>
      </button>
    </div>
  );
}
