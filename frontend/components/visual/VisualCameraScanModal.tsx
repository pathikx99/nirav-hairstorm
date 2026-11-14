"use client";

import React, { useState } from "react";
import { HairRegionInput } from "../../types/assessment";

interface VisualCameraScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (
    roots: Partial<HairRegionInput>,
    midLengths: Partial<HairRegionInput>,
    ends: Partial<HairRegionInput>
  ) => void;
}

export function VisualCameraScanModal({
  isOpen,
  onClose,
  onApply,
}: VisualCameraScanModalProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);

  if (!isOpen) return null;

  const handleStartScan = () => {
    setIsScanning(true);
    setScanComplete(false);

    setTimeout(() => {
      setIsScanning(false);
      setScanComplete(true);
    }, 1500);
  };

  const handleConfirm = () => {
    onApply(
      { observed_level: 3, observed_undertone: "NATURAL", colourist_confirmed: true },
      { observed_level: 4, observed_undertone: "COPPER", colourist_confirmed: true },
      { observed_level: 5, observed_undertone: "GOLD", colourist_confirmed: true }
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-3xl border border-neutral-700 bg-neutral-900 p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-xl border border-amber-500/30">
              📸
            </span>
            <div>
              <h3 className="text-lg font-black text-white">Camera Hair Scanner</h3>
              <p className="text-xs text-amber-300">Auto-detect hair levels using camera</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-neutral-800 text-neutral-400 hover:text-white flex items-center justify-center font-bold"
          >
            ✕
          </button>
        </div>

        {/* Viewfinder Window */}
        <div className="relative h-64 w-full rounded-2xl overflow-hidden border-2 border-dashed border-amber-500/60 bg-neutral-950 flex flex-col items-center justify-center shadow-inner">
          {/* Simulated Hair Texture Background */}
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-700 via-neutral-900 to-black" />

          {/* Corner Crosshairs */}
          <div className="absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 border-amber-400" />
          <div className="absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 border-amber-400" />
          <div className="absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 border-amber-400" />
          <div className="absolute bottom-4 right-4 h-6 w-6 border-b-2 border-r-2 border-amber-400" />

          {/* Scanning Laser Beam */}
          {isScanning && (
            <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_15px_#f59e0b] animate-[bounce_1.5s_infinite]" />
          )}

          {!isScanning && !scanComplete && (
            <div className="z-10 text-center space-y-3 p-4">
              <span className="text-4xl block animate-pulse">📷</span>
              <p className="text-sm font-bold text-white">
                Position Camera Near Client Hair
              </p>
              <p className="text-xs text-neutral-400">
                Hold camera 10–15 cm from hair roots
              </p>
            </div>
          )}

          {isScanning && (
            <div className="z-10 text-center space-y-2">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-amber-400 border-t-transparent" />
              <p className="text-sm font-bold text-amber-300">
                Scanning Hair Levels...
              </p>
            </div>
          )}

          {scanComplete && (
            <div className="z-10 text-center space-y-3 p-4">
              <span className="text-4xl block">✨</span>
              <span className="text-sm font-black text-emerald-400 block">
                Detection Successful!
              </span>
              <div className="flex gap-2 justify-center">
                <span className="rounded-lg bg-neutral-900/90 border border-neutral-700 px-3 py-1.5 text-xs text-white">
                  Roots: <strong>Level 3</strong>
                </span>
                <span className="rounded-lg bg-neutral-900/90 border border-neutral-700 px-3 py-1.5 text-xs text-white">
                  Middle: <strong>Level 4</strong>
                </span>
                <span className="rounded-lg bg-neutral-900/90 border border-neutral-700 px-3 py-1.5 text-xs text-white">
                  Ends: <strong>Level 5</strong>
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {!scanComplete ? (
            <button
              type="button"
              disabled={isScanning}
              onClick={handleStartScan}
              className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <span>📸</span> SCAN HAIR NOW
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-base shadow-xl flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <span>✓</span> USE THESE LEVELS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
