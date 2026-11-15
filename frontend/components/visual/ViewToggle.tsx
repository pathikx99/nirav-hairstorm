"use client";

import React from "react";
import { useApp, ViewAngle } from "../../context/AppContext";

interface ViewToggleProps {
  value?: ViewAngle;
  onChange?: (angle: ViewAngle) => void;
  className?: string;
}

export function ViewToggle({
  value,
  onChange,
  className = "",
}: ViewToggleProps) {
  const { viewAngle: contextViewAngle, setViewAngle: contextSetViewAngle } =
    useApp();

  const activeAngle = value ?? contextViewAngle;
  const handleToggle = (angle: ViewAngle) => {
    if (onChange) {
      onChange(angle);
    } else {
      contextSetViewAngle(angle);
    }
  };

  return (
    <div
      className={`inline-flex items-center p-1 rounded-2xl bg-neutral-950 border border-neutral-800 ${className}`}
    >
      <button
        type="button"
        onClick={() => handleToggle("FRONT")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          activeAngle === "FRONT"
            ? "bg-amber-500 text-neutral-950 shadow-md font-black"
            : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        <span>👤</span>
        <span>Front View</span>
      </button>

      <button
        type="button"
        onClick={() => handleToggle("BACK")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
          activeAngle === "BACK"
            ? "bg-amber-500 text-neutral-950 shadow-md font-black"
            : "text-neutral-400 hover:text-neutral-200"
        }`}
      >
        <span>🔄</span>
        <span>Back View</span>
      </button>
    </div>
  );
}
