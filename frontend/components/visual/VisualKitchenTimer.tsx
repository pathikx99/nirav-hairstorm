"use client";

import React, { useEffect, useState } from "react";

interface VisualKitchenTimerProps {
  initialMinutes: number;
}

export function VisualKitchenTimer({ initialMinutes }: VisualKitchenTimerProps) {
  const [prevInitialMinutes, setPrevInitialMinutes] = useState(initialMinutes);
  const [secondsLeft, setSecondsLeft] = useState(initialMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  if (initialMinutes !== prevInitialMinutes) {
    setPrevInitialMinutes(initialMinutes);
    setSecondsLeft(initialMinutes * 60);
    setIsRunning(false);
  }

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, secondsLeft]);

  const toggleRun = () => {
    if (!isRunning && secondsLeft === 0) {
      setSecondsLeft(initialMinutes * 60);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(initialMinutes * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds = initialMinutes * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsLeft) / totalSeconds) * 100 : 0;

  return (
    <div className="flex flex-col items-center rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-6 shadow-2xl text-center w-full">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">⏱️</span>
        <div>
          <h3 className="text-base font-black text-white">Application Timer</h3>
          <p className="text-xs text-neutral-400">Track salon processing time</p>
        </div>
      </div>

      {/* Circular Clock Display */}
      <div className="relative flex items-center justify-center h-48 w-48 my-2">
        {/* SVG Progress Ring */}
        <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke="#262626"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="transparent"
            stroke={isRunning ? "#f59e0b" : "#10b981"}
            strokeWidth="8"
            strokeDasharray="264"
            strokeDashoffset={264 - (264 * progressPercent) / 100}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        {/* Time Text Inside */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black font-mono tracking-tight text-white">
            {formattedTime}
          </span>
          <span className="text-xs font-bold text-amber-400 mt-1 uppercase tracking-wider">
            {isRunning ? "Ticking ⏳" : secondsLeft === 0 ? "🔔 TIME'S UP!" : "Ready"}
          </span>
        </div>
      </div>

      {/* Giant Start / Pause Buttons */}
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-4">
        <button
          type="button"
          onClick={toggleRun}
          className={`py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 ${
            isRunning
              ? "bg-rose-500 hover:bg-rose-400 text-white"
              : "bg-amber-500 hover:bg-amber-400 text-neutral-950"
          }`}
        >
          <span>{isRunning ? "⏸️" : "▶️"}</span>
          <span>{isRunning ? "PAUSE" : "START"}</span>
        </button>

        <button
          type="button"
          onClick={resetTimer}
          className="py-3.5 px-4 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
        >
          <span>🔄</span> RESET
        </button>
      </div>
    </div>
  );
}
