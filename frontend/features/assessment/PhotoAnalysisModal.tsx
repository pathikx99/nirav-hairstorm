"use client";

import { useState } from "react";
import { HairRegionInput } from "../../types/assessment";
import { UniversalLevel, ToneFamily } from "../../types/uhcr";

interface PhotoAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPredictions: (
    roots: Partial<HairRegionInput>,
    midLengths: Partial<HairRegionInput>,
    ends: Partial<HairRegionInput>
  ) => void;
}

export function PhotoAnalysisModal({
  isOpen,
  onClose,
  onApplyPredictions,
}: PhotoAnalysisModalProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [simulatedResults, setSimulatedResults] = useState<{
    roots: { level: UniversalLevel; tone: ToneFamily; confidence: number };
    midLengths: { level: UniversalLevel; tone: ToneFamily; confidence: number };
    ends: { level: UniversalLevel; tone: ToneFamily; confidence: number };
  } | null>(null);

  if (!isOpen) return null;

  const handleSimulateUpload = () => {
    setAnalyzing(true);
    setTimeout(() => {
      setSimulatedResults({
        roots: { level: 4, tone: "RED", confidence: 0.88 },
        midLengths: { level: 6, tone: "COPPER", confidence: 0.79 },
        ends: { level: 7, tone: "GOLD", confidence: 0.84 },
      });
      setAnalyzing(false);
    }, 1200);
  };

  const handleApply = () => {
    if (!simulatedResults) return;
    onApplyPredictions(
      {
        observed_level: simulatedResults.roots.level,
        observed_undertone: simulatedResults.roots.tone,
        colourist_confirmed: true,
      },
      {
        observed_level: simulatedResults.midLengths.level,
        observed_undertone: simulatedResults.midLengths.tone,
        colourist_confirmed: true,
      },
      {
        observed_level: simulatedResults.ends.level,
        observed_undertone: simulatedResults.ends.tone,
        colourist_confirmed: true,
      }
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photo-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3 mb-4">
          <h3 id="photo-modal-title" className="text-base font-bold text-white flex items-center gap-2">
            <span>📷</span> Photo-Assisted Hair Assessment
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white text-lg p-1"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-neutral-700 bg-neutral-950 p-6 text-center hover:border-amber-500 transition-colors">
            <span className="text-3xl block mb-2">📸</span>
            <p className="text-xs text-neutral-300 font-medium">
              Drag & drop client hair photo, or click to upload
            </p>
            <p className="text-[11px] text-neutral-500 mt-1">
              Supports natural daylight capture. Controlled white balance recommended.
            </p>
            <button
              type="button"
              onClick={handleSimulateUpload}
              disabled={analyzing}
              className="mt-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-xs font-semibold text-white transition-colors"
            >
              {analyzing ? "Analyzing Zones with Vision Model..." : "Simulate Demo Hair Photo"}
            </button>
          </div>

          {simulatedResults && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-xs font-bold text-white">AI Predicted Zones</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  Principle 9: Requires Human Confirmation
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Roots</span>
                  <span className="font-bold text-white">Level {simulatedResults.roots.level}</span>
                  <span className="block text-[10px] text-neutral-400">{simulatedResults.roots.tone}</span>
                  <span className="block text-[10px] text-emerald-400 font-mono mt-1">
                    {(simulatedResults.roots.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>

                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Mid-Lengths</span>
                  <span className="font-bold text-white">Level {simulatedResults.midLengths.level}</span>
                  <span className="block text-[10px] text-neutral-400">{simulatedResults.midLengths.tone}</span>
                  <span className="block text-[10px] text-emerald-400 font-mono mt-1">
                    {(simulatedResults.midLengths.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>

                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Ends</span>
                  <span className="font-bold text-white">Level {simulatedResults.ends.level}</span>
                  <span className="block text-[10px] text-neutral-400">{simulatedResults.ends.tone}</span>
                  <span className="block text-[10px] text-emerald-400 font-mono mt-1">
                    {(simulatedResults.ends.confidence * 100).toFixed(0)}% conf
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-neutral-400 leading-normal">
                Applying predictions will populate the starting assessment form with confirmed status.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!simulatedResults}
              onClick={handleApply}
              className="rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-4 py-2 text-xs font-bold text-neutral-950 transition-colors"
            >
              Confirm & Apply to Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
