"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import { HairRegionInput } from "../../types/assessment";
import {
  computeHairColorimetry,
  applyMetamerism,
  getSalonShadeCode,
} from "../../services/hairColorimetryService";
import { LightingMode, useApp, ViewAngle } from "../../context/AppContext";
import {
  segmentHairFromImageData,
  analyzeHairFromImageData,
  renderRecoloredHairToCanvas,
  ClientHairPhotoAnalysis,
} from "../../services/clientHairPhotoService";
import { VisualCameraScanModal } from "./VisualCameraScanModal";

export type AvatarZone = "ROOTS" | "MID_LENGTHS" | "ENDS";

interface ZoneColors {
  base: string;
  shadow: string;
  highlight: string;
  gradient: string;
}

interface CustomerPhotoAvatarProps {
  level?: UniversalLevel;
  primaryTone?: ToneFamily;
  secondaryTone?: ToneFamily | null;
  intensity?: ToneIntensity;
  technique?: ApplicationTechnique;
  zoneMode?: boolean;
  activeRegion?: AvatarZone;
  onSelectRegion?: (region: AvatarZone) => void;
  rootsInput?: HairRegionInput;
  midLengthsInput?: HairRegionInput;
  endsInput?: HairRegionInput;
  customRootsLevel?: UniversalLevel | null;
  customRootsTone?: ToneFamily | null;
  customMidLevel?: UniversalLevel | null;
  customMidTone?: ToneFamily | null;
  customEndsLevel?: UniversalLevel | null;
  customEndsTone?: ToneFamily | null;
  customRootsColor?: string;
  customMidColor?: string;
  customEndsColor?: string;
  lightingMode?: LightingMode;
  viewAngle?: ViewAngle;
  onViewAngleChange?: (angle: ViewAngle) => void;
  onLevelChange?: (newLevel: UniversalLevel) => void;
  showControls?: boolean;
  showLevelSlider?: boolean;
  showComparisonSlider?: boolean;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function computeZoneColors(
  level: number,
  tone: ToneFamily = "NATURAL",
  greyPct: number = 0,
  intensity: ToneIntensity = "STANDARD"
): ZoneColors {
  const validLevel = (Math.max(1, Math.min(10, level)) || 5) as UniversalLevel;
  const c = computeHairColorimetry(validLevel, tone, null, intensity);

  if (!greyPct || greyPct <= 0) {
    return {
      base: c.baseHex,
      shadow: c.shadowHex,
      highlight: c.highlightHex,
      gradient: c.gradient,
    };
  }

  return {
    base: c.baseHex,
    shadow: c.shadowHex,
    highlight: c.highlightHex,
    gradient: c.gradient,
  };
}

export function CustomerPhotoAvatar({
  level = 7,
  primaryTone = "COPPER",
  secondaryTone = "GOLD",
  intensity = "STANDARD",
  technique,
  zoneMode = false,
  activeRegion,
  onSelectRegion,
  rootsInput,
  midLengthsInput,
  endsInput,
  customRootsLevel,
  customRootsTone,
  customMidLevel,
  customMidTone,
  customEndsLevel,
  customEndsTone,
  customRootsColor,
  customMidColor,
  customEndsColor,
  lightingMode: propLightingMode,
  viewAngle: propViewAngle,
  onViewAngleChange,
  onLevelChange,
  showControls = true,
  showLevelSlider = true,
  showComparisonSlider = true,
  className = "",
}: CustomerPhotoAvatarProps) {
  const context = useApp();

  const activeLighting = propLightingMode ?? context.lightingMode ?? "DAYLIGHT";
  const activeView = propViewAngle ?? context.viewAngle ?? "FRONT";
  const activeTech = technique ?? context.activeTechnique ?? "ALL_OVER";

  const clientPhotoSrc = context.clientPhoto || "/models/model_front.jpg";
  const isCustomPhoto = context.isCustomClientPhoto;

  // Canvas Refs
  const originalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const recoloredCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Cached segmentation data
  const hairMaskRef = useRef<Uint8ClampedArray | null>(null);
  const hairBoundsRef = useRef<{ minX: number; maxX: number; minY: number; maxY: number } | null>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [splitPos, setSplitPos] = useState<number>(100); // 100 = 100% recolored, 50 = split, 0 = 100% original
  const [isDraggingSplit, setIsDraggingSplit] = useState<boolean>(false);
  const [cameraModalOpen, setCameraModalOpen] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"SPLIT" | "RESULT" | "ORIGINAL">("RESULT");
  const [sampledInfo, setSampledInfo] = useState<{ level: number; tone: string; x: number; y: number } | null>(null);
  const [sensitivity, setSensitivity] = useState<number>(1.0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 1. Calculate Target Colors
  const targetColorimetry = computeHairColorimetry(
    level,
    primaryTone,
    secondaryTone,
    intensity
  );

  let rootsColors: ZoneColors;
  let midColors: ZoneColors;
  let endsColors: ZoneColors;

  if (zoneMode && rootsInput && midLengthsInput && endsInput) {
    rootsColors = computeZoneColors(
      rootsInput.observed_level || 4,
      (rootsInput.observed_undertone as ToneFamily) || "NATURAL",
      rootsInput.grey_percentage || 0
    );
    midColors = computeZoneColors(
      midLengthsInput.observed_level || 5,
      (midLengthsInput.observed_undertone as ToneFamily) || "NATURAL",
      midLengthsInput.grey_percentage || 0
    );
    endsColors = computeZoneColors(
      endsInput.observed_level || 6,
      (endsInput.observed_undertone as ToneFamily) || "NATURAL",
      endsInput.grey_percentage || 0
    );
  } else {
    if (activeTech === "SHADOW_ROOT") {
      const shadowLevel = Math.max(1, level - 2) as UniversalLevel;
      const shadowBase = computeHairColorimetry(shadowLevel, "NATURAL");
      rootsColors = {
        base: shadowBase.baseHex,
        shadow: shadowBase.shadowHex,
        highlight: shadowBase.highlightHex,
        gradient: shadowBase.gradient,
      };
      midColors = {
        base: targetColorimetry.baseHex,
        shadow: targetColorimetry.shadowHex,
        highlight: targetColorimetry.highlightHex,
        gradient: targetColorimetry.gradient,
      };
      endsColors = midColors;
    } else if (activeTech === "COLOR_MELT") {
      const shadowLevel = Math.max(1, level - 2) as UniversalLevel;
      const rootColor = computeHairColorimetry(shadowLevel, primaryTone);
      const endsLevel = Math.min(10, level + 1) as UniversalLevel;
      const endsColor = computeHairColorimetry(
        endsLevel,
        secondaryTone || primaryTone,
        null,
        "INTENSE"
      );

      rootsColors = {
        base: rootColor.baseHex,
        shadow: rootColor.shadowHex,
        highlight: rootColor.highlightHex,
        gradient: rootColor.gradient,
      };
      midColors = {
        base: targetColorimetry.baseHex,
        shadow: targetColorimetry.shadowHex,
        highlight: targetColorimetry.highlightHex,
        gradient: targetColorimetry.gradient,
      };
      endsColors = {
        base: endsColor.baseHex,
        shadow: endsColor.shadowHex,
        highlight: endsColor.highlightHex,
        gradient: endsColor.gradient,
      };
    } else {
      const uniform: ZoneColors = {
        base: targetColorimetry.baseHex,
        shadow: targetColorimetry.shadowHex,
        highlight: targetColorimetry.highlightHex,
        gradient: targetColorimetry.gradient,
      };
      rootsColors = uniform;
      midColors = uniform;
      endsColors = uniform;
    }
  }

  // Zone Overrides
  if (customRootsLevel && customRootsTone) {
    rootsColors = computeZoneColors(customRootsLevel, customRootsTone, 0, intensity);
  } else if (customRootsColor) {
    rootsColors.base = customRootsColor;
  }

  if (customMidLevel && customMidTone) {
    midColors = computeZoneColors(customMidLevel, customMidTone, 0, intensity);
  } else if (customMidColor) {
    midColors.base = customMidColor;
  }

  if (customEndsLevel && customEndsTone) {
    endsColors = computeZoneColors(customEndsLevel, customEndsTone, 0, intensity);
  } else if (customEndsColor) {
    endsColors.base = customEndsColor;
  }

  const currentZoneLevel: UniversalLevel =
    activeRegion === "ROOTS"
      ? ((customRootsLevel ?? (zoneMode ? rootsInput?.observed_level : level) ?? 7) as UniversalLevel)
      : activeRegion === "MID_LENGTHS"
      ? ((customMidLevel ?? (zoneMode ? midLengthsInput?.observed_level : level) ?? 7) as UniversalLevel)
      : activeRegion === "ENDS"
      ? ((customEndsLevel ?? (zoneMode ? endsInput?.observed_level : level) ?? 7) as UniversalLevel)
      : level;

  // 2. Load and Segment Client Photo
  useEffect(() => {
    let isCancelled = false;
    setIsLoading(true);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = clientPhotoSrc;

    img.onload = () => {
      if (isCancelled) return;
      sourceImageRef.current = img;

      // Draw onto original canvas at target resolution (e.g. 720x960 max for crisp details)
      const origCanvas = originalCanvasRef.current;
      const recolCanvas = recoloredCanvasRef.current;
      if (!origCanvas || !recolCanvas) return;

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

      origCanvas.width = w;
      origCanvas.height = h;
      recolCanvas.width = w;
      recolCanvas.height = h;

      const oCtx = origCanvas.getContext("2d", { willReadFrequently: true });
      if (!oCtx) return;
      oCtx.clearRect(0, 0, w, h);
      oCtx.drawImage(img, 0, 0, w, h);

      const imgData = oCtx.getImageData(0, 0, w, h);

      // Perform true pixel-based hair segmentation
      const { hairMask, hairBounds } = segmentHairFromImageData(imgData, sensitivity);
      hairMaskRef.current = hairMask;
      hairBoundsRef.current = hairBounds;

      // Perform colorimetry analysis on the client's hair
      const analysis = analyzeHairFromImageData(imgData, hairMask, hairBounds);
      context.setClientHairAnalysis(analysis);

      setIsLoading(false);
      renderRecolor();
    };

    img.onerror = () => {
      console.error("Failed to load customer image:", clientPhotoSrc);
      setIsLoading(false);
    };

    return () => {
      isCancelled = true;
    };
  }, [clientPhotoSrc, sensitivity]);

  // 3. Fast Recoloring Pass
  const renderRecolor = useCallback(() => {
    if (!originalCanvasRef.current || !recoloredCanvasRef.current) return;
    if (!hairMaskRef.current || !hairBoundsRef.current) return;

    renderRecoloredHairToCanvas(
      originalCanvasRef.current,
      recoloredCanvasRef.current,
      hairMaskRef.current,
      hairBoundsRef.current,
      {
        rootsColor: rootsColors.base,
        midColor: midColors.base,
        endsColor: endsColors.base,
        technique: activeTech,
        lightingMode: activeLighting,
      }
    );
  }, [rootsColors.base, midColors.base, endsColors.base, activeTech, activeLighting]);

  useEffect(() => {
    if (!isLoading) {
      renderRecolor();
    }
  }, [isLoading, renderRecolor]);

  // Handle Photo File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        context.setClientPhoto(dataUrl, true, activeView);
      }
    };
    reader.readAsDataURL(file);
  };

  // Eyedropper Hair Tap
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const origCanvas = originalCanvasRef.current;
    if (!container || !origCanvas) return;

    const rect = container.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const scaleX = origCanvas.width / rect.width;
    const scaleY = origCanvas.height / rect.height;

    const pixelX = Math.round(clickX * scaleX);
    const pixelY = Math.round(clickY * scaleY);

    const ctx = origCanvas.getContext("2d");
    if (!ctx) return;

    try {
      const pixel = ctx.getImageData(pixelX, pixelY, 1, 1).data;
      const [r, g, b] = [pixel[0], pixel[1], pixel[2]];
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      let lvl: UniversalLevel = 1;
      if (lum >= 222) lvl = 10;
      else if (lum >= 188) lvl = 9;
      else if (lum >= 152) lvl = 8;
      else if (lum >= 122) lvl = 7;
      else if (lum >= 95) lvl = 6;
      else if (lum >= 72) lvl = 5;
      else if (lum >= 52) lvl = 4;
      else if (lum >= 35) lvl = 3;
      else if (lum >= 22) lvl = 2;

      setSampledInfo({
        level: lvl,
        tone: `rgb(${r}, ${g}, ${b})`,
        x: clickX,
        y: clickY,
      });

      // Clear after 3.5 seconds
      setTimeout(() => setSampledInfo(null), 3500);
    } catch {
      // ignore
    }
  };

  // Split Slider Touch / Mouse Drag
  const handleSplitDrag = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setSplitPos(pos);
  };

  // Metamerism badge
  let lightingBadge = "☀️ 6500K Daylight";
  if (activeLighting === "WARM") lightingBadge = "💡 3000K Warm Salon";
  else if (activeLighting === "COOL") lightingBadge = "🏢 4000K Cool Indoor";

  const shadeInfo = getSalonShadeCode(level, primaryTone, secondaryTone);

  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 via-neutral-950 to-neutral-900 p-4 sm:p-5 shadow-2xl overflow-hidden w-full ${className}`}
    >
      {/* Background Salon Atmosphere Glow */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: rootsColors.base }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: endsColors.highlight }}
      />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between w-full mb-2.5 z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs text-amber-400 border border-amber-500/30">
            {isCustomPhoto ? "👤" : "✨"}
          </span>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
              {isCustomPhoto ? "Customer Hair Real Image" : "Salon Client Hair Simulation"}
            </span>
            <span className="text-[9px] text-neutral-400 font-mono">
              {isCustomPhoto ? "Live Customer Photo Active" : "Sample Client Photo • Tap Camera to Replace"}
            </span>
          </div>
        </div>

        {/* Top Controls: Camera + Upload + Lighting Badge */}
        <div className="flex items-center gap-1.5">
          {/* Snap Camera Button */}
          <button
            type="button"
            onClick={() => setCameraModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-black shadow-md transition-all active:scale-95"
            title="Snap client hair with live camera"
          >
            <span>📸</span>
            <span className="hidden sm:inline">Camera</span>
          </button>

          {/* Upload Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold border border-neutral-700 transition-all active:scale-95"
            title="Upload client photo file"
          >
            <span>📁</span>
            <span className="hidden sm:inline">Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Lighting Mode Pill */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-300">
            <span>{lightingBadge}</span>
          </div>
        </div>
      </div>

      {/* Technique & Comparison Mode Pill */}
      <div className="relative z-10 w-full mb-3 rounded-2xl border border-amber-500/25 bg-neutral-900/90 px-3 py-1.5 shadow-md flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="text-sm">🪄</span>
          <p className="font-bold text-white text-[11px] sm:text-xs truncate">
            {shadeInfo.code} • {shadeInfo.name} ({activeTech.replace("_", " ")})
          </p>
        </div>

        {/* View Mode Toggle: Result / Before-After Split / Original */}
        {showComparisonSlider && (
          <div className="flex items-center gap-1 bg-neutral-950/80 p-0.5 rounded-xl border border-neutral-800 text-[10px] font-bold shrink-0">
            <button
              type="button"
              onClick={() => {
                setViewMode("SPLIT");
                setSplitPos(50);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                viewMode === "SPLIT"
                  ? "bg-amber-500 text-neutral-950 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Split View
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("RESULT");
                setSplitPos(100);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                viewMode === "RESULT"
                  ? "bg-amber-500 text-neutral-950 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              After
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("ORIGINAL");
                setSplitPos(0);
              }}
              className={`px-2 py-0.5 rounded-lg transition-all ${
                viewMode === "ORIGINAL"
                  ? "bg-amber-500 text-neutral-950 font-black"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Before
            </button>
          </div>
        )}
      </div>

      {/* Main Real Customer Photo Viewport */}
      <div
        ref={containerRef}
        onClick={handleCanvasClick}
        onMouseMove={(e) => {
          if (isDraggingSplit) handleSplitDrag(e.clientX);
        }}
        onMouseUp={() => setIsDraggingSplit(false)}
        onTouchMove={(e) => {
          if (isDraggingSplit && e.touches[0]) handleSplitDrag(e.touches[0].clientX);
        }}
        onTouchEnd={() => setIsDraggingSplit(false)}
        className="relative w-full max-w-sm sm:max-w-md h-[420px] sm:h-[460px] select-none rounded-2xl overflow-hidden bg-black/90 shadow-2xl flex items-center justify-center cursor-crosshair group"
      >
        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-neutral-950/80 backdrop-blur-sm">
            <div className="w-9 h-9 rounded-full border-3 border-amber-500 border-t-transparent animate-spin mb-2" />
            <span className="text-xs font-mono text-amber-300">Processing Hair Strands...</span>
          </div>
        )}

        {/* 1. Original Image Canvas (Bottom layer) */}
        <canvas
          ref={originalCanvasRef}
          className="absolute inset-0 w-full h-full object-contain"
        />

        {/* 2. Recolored Image Canvas (Top layer, clipped by splitPos) */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${splitPos}%` }}
        >
          <canvas
            ref={recoloredCanvasRef}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Interactive Split Divider Handle (When viewMode is SPLIT) */}
        {viewMode === "SPLIT" && (
          <div
            className="absolute top-0 bottom-0 z-20 w-1 bg-amber-400 cursor-ew-resize flex items-center justify-center shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ left: `${splitPos}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
          >
            <div className="w-7 h-7 rounded-full bg-amber-500 border-2 border-white shadow-xl flex items-center justify-center text-[10px] font-black text-neutral-950">
              ↔
            </div>
          </div>
        )}

        {/* Split Labels */}
        {viewMode === "SPLIT" && (
          <>
            <span className="absolute bottom-3 left-3 z-10 px-2 py-1 rounded-md bg-black/75 backdrop-blur-xs text-[10px] font-bold text-neutral-300 border border-white/10">
              Before (Original)
            </span>
            <span className="absolute bottom-3 right-3 z-10 px-2 py-1 rounded-md bg-amber-500/90 backdrop-blur-xs text-[10px] font-black text-neutral-950 shadow-md">
              After (Formulated)
            </span>
          </>
        )}

        {/* Interactive 3-Zone Hair Pins */}
        {onSelectRegion && !isLoading && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Zone 1: Roots Pin */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRegion("ROOTS");
              }}
              className={`pointer-events-auto absolute left-[48%] top-[16%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                activeRegion === "ROOTS"
                  ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                  : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
              }`}
              title="Zone 1: Roots (Scalp Regrowth)"
            >
              1
            </button>

            {/* Zone 2: Mid-Lengths Pin */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRegion("MID_LENGTHS");
              }}
              className={`pointer-events-auto absolute left-[32%] top-[42%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                activeRegion === "MID_LENGTHS"
                  ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                  : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
              }`}
              title="Zone 2: Mid-Lengths"
            >
              2
            </button>

            {/* Zone 3: Ends Pin */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectRegion("ENDS");
              }}
              className={`pointer-events-auto absolute left-[30%] top-[70%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                activeRegion === "ENDS"
                  ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                  : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
              }`}
              title="Zone 3: Hair Ends / Tips"
            >
              3
            </button>
          </div>
        )}

        {/* Eyedropper Sample Tooltip Popup */}
        {sampledInfo && (
          <div
            className="absolute z-30 -translate-x-1/2 -translate-y-full mb-2 px-3 py-1.5 rounded-xl bg-neutral-950 border border-amber-500 text-white shadow-2xl text-[11px] pointer-events-none flex items-center gap-2"
            style={{ left: sampledInfo.x, top: sampledInfo.y }}
          >
            <span
              className="w-3 h-3 rounded-full border border-white/40"
              style={{ backgroundColor: sampledInfo.tone }}
            />
            <span>
              Sampled: <strong>Level {sampledInfo.level}</strong>
            </span>
          </div>
        )}

        {/* Floating Top-Right Shade Level Badge */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-xl z-20">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
            style={{ backgroundColor: targetColorimetry.baseHex }}
          />
          <span className="font-black text-amber-400">
            {shadeInfo.code}
          </span>
        </div>
      </div>

      {/* 3-Zone Tactile Switcher Cards (when zoneMode is active) */}
      {zoneMode && (
        <div className="grid grid-cols-3 gap-2 w-full mt-2.5 z-10">
          <button
            type="button"
            onClick={() => onSelectRegion?.("ROOTS")}
            className={`flex flex-col items-center rounded-2xl p-2 border transition-all text-left ${
              activeRegion === "ROOTS"
                ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                style={{ backgroundColor: rootsColors.base }}
              />
              <span className="text-xs font-black text-white">1. Roots</span>
            </div>
            <span className="text-[10px] text-neutral-300 font-bold">
              L{rootsInput?.observed_level || 4}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRegion?.("MID_LENGTHS")}
            className={`flex flex-col items-center rounded-2xl p-2 border transition-all text-left ${
              activeRegion === "MID_LENGTHS"
                ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                style={{ backgroundColor: midColors.base }}
              />
              <span className="text-xs font-black text-white">2. Middle</span>
            </div>
            <span className="text-[10px] text-neutral-300 font-bold">
              L{midLengthsInput?.observed_level || 5}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectRegion?.("ENDS")}
            className={`flex flex-col items-center rounded-2xl p-2 border transition-all text-left ${
              activeRegion === "ENDS"
                ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
                : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
                style={{ backgroundColor: endsColors.base }}
              />
              <span className="text-xs font-black text-white">3. Ends</span>
            </div>
            <span className="text-[10px] text-neutral-300 font-bold">
              L{endsInput?.observed_level || 6}
            </span>
          </button>
        </div>
      )}

      {/* Depth Level Stepper & Slider */}
      {!zoneMode && showLevelSlider && onLevelChange && (
        <div className="w-full mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
              <span>🎚️</span> Depth Level: <strong className="text-amber-400">Level {currentZoneLevel}</strong>
            </span>
            <span className="text-[10px] text-neutral-400 font-mono">
              {targetColorimetry.undertoneSummaryEn}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onLevelChange(Math.max(1, currentZoneLevel - 1) as UniversalLevel)}
              disabled={currentZoneLevel <= 1}
              className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-black flex items-center justify-center transition-all"
              title="Darker Level (-)"
            >
              -
            </button>

            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={currentZoneLevel}
              onChange={(e) => onLevelChange(Number(e.target.value) as UniversalLevel)}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <button
              type="button"
              onClick={() => onLevelChange(Math.min(10, currentZoneLevel + 1) as UniversalLevel)}
              disabled={currentZoneLevel >= 10}
              className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-black flex items-center justify-center transition-all"
              title="Lighter Level (+)"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* Live Camera Scanner Modal */}
      <VisualCameraScanModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onApply={(roots, mid, ends) => {
          // Handled inside camera modal
          setCameraModalOpen(false);
        }}
      />
    </div>
  );
}
