"use client";

import { useState, useRef } from "react";
import { HairRegionInput } from "../../types/assessment";
import { useApp } from "../../context/AppContext";
import {
  segmentHairFromImageData,
  analyzeHairFromImageData,
  ClientHairPhotoAnalysis,
} from "../../services/clientHairPhotoService";

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
  const context = useApp();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ClientHairPhotoAnalysis | null>(null);

  if (!isOpen) return null;

  const handleProcessImage = (img: HTMLImageElement, dataUrl: string) => {
    setAnalyzing(true);
    try {
      const canvas = document.createElement("canvas");
      const maxDim = 800;
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, w, h);
      const imgData = ctx.getImageData(0, 0, w, h);

      const { hairMask, hairBounds } = segmentHairFromImageData(imgData);
      const result = analyzeHairFromImageData(imgData, hairMask, hairBounds);

      setPhotoPreview(dataUrl);
      setAnalysis(result);

      context.setClientPhoto(dataUrl, true);
      context.setClientHairAnalysis(result);
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const img = new Image();
      img.src = dataUrl;
      img.onload = () => handleProcessImage(img, dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSample = (samplePath: string) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = samplePath;
    img.onload = () => {
      handleProcessImage(img, samplePath);
      context.setClientPhoto(samplePath, false);
    };
  };

  const handleApply = () => {
    if (!analysis) return;
    onApplyPredictions(
      {
        observed_level: analysis.roots.level,
        observed_undertone: analysis.roots.tone,
        grey_percentage: analysis.roots.greyPercentage ?? 0,
        colourist_confirmed: true,
      },
      {
        observed_level: analysis.midLengths.level,
        observed_undertone: analysis.midLengths.tone,
        colourist_confirmed: true,
      },
      {
        observed_level: analysis.ends.level,
        observed_undertone: analysis.ends.tone,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <h3 id="photo-modal-title" className="text-base font-bold text-white flex items-center gap-2">
            <span>📷</span> Exact Customer Hair Photo Analysis
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
          {/* Upload Dropzone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-neutral-700 bg-neutral-950 p-6 text-center hover:border-amber-500 transition-colors cursor-pointer"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            {photoPreview ? (
              <div className="space-y-2">
                <img
                  src={photoPreview}
                  alt="Client Preview"
                  className="w-32 h-32 mx-auto rounded-xl object-cover border border-amber-500/50 shadow-md"
                />
                <p className="text-xs text-amber-400 font-bold">Photo Loaded • Click to change photo</p>
              </div>
            ) : (
              <>
                <span className="text-3xl block mb-2">📸</span>
                <p className="text-xs text-neutral-300 font-medium">
                  Click to select customer hair photo or drag & drop here
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Supports client selfies, portrait shots, and daylight captures.
                </p>
              </>
            )}

            {analyzing && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-400 font-bold">
                <div className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <span>Analyzing exact hair pixels and undertones...</span>
              </div>
            )}
          </div>

          {/* Quick Real Client Test Samples */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs">
            <span className="text-neutral-400 font-medium">Try Salon Client:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample("/models/model_front.jpg")}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold"
              >
                Front Client
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample("/models/model_back.jpg")}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-bold"
              >
                Back Client
              </button>
            </div>
          </div>

          {/* Real Analysis Results */}
          {analysis && (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                <span className="text-xs font-bold text-white">Measured Starting Levels</span>
                <span className="text-[10px] text-amber-400 font-mono">
                  {(analysis.roots.confidence * 100).toFixed(0)}% Confidence
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Roots</span>
                  <span className="font-bold text-white">Level {analysis.roots.level}</span>
                  <span className="block text-[10px] text-neutral-400">{analysis.roots.tone}</span>
                  {analysis.roots.greyPercentage !== undefined && (
                    <span className="block text-[10px] text-slate-300 font-mono mt-1">
                      {analysis.roots.greyPercentage}% Grey
                    </span>
                  )}
                </div>

                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Mid-Lengths</span>
                  <span className="font-bold text-white">Level {analysis.midLengths.level}</span>
                  <span className="block text-[10px] text-neutral-400">{analysis.midLengths.tone}</span>
                </div>

                <div className="rounded border border-neutral-800 p-2">
                  <span className="block text-[10px] text-neutral-500 uppercase font-bold">Ends</span>
                  <span className="font-bold text-white">Level {analysis.ends.level}</span>
                  <span className="block text-[10px] text-neutral-400">{analysis.ends.tone}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-neutral-800 px-4 py-2 text-xs text-neutral-300 hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!analysis}
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
