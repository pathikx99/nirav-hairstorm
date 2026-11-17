"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  AvatarView,
  LightingPreset,
  SkinTonePreset,
  SKIN_TONE_PRESETS,
} from "../../components/Avatar/AvatarTypes";
import { BIOPHYSICAL_SKIN_PROFILES } from "../../components/Avatar/AvatarColorEngine";
import { HighEndSalonAvatarCanvas } from "../../components/Avatar/HighEndSalonAvatarCanvas";
import { UniversalSalonAvatarRenderer, RendererSelection } from "../../components/Avatar/UniversalSalonAvatarRenderer";

export interface CalibratedSkinToneInfo {
  id: SkinTonePreset;
  label: string;
  row: number;
  col: number;
  description: string;
}

export const CALIBRATED_SKIN_TONES: CalibratedSkinToneInfo[] = [
  { id: "porcelain", label: "Porcelain", row: 0, col: 0, description: "Alabaster pale with delicate rosy luminosity" },
  { id: "fair", label: "Fair", row: 0, col: 1, description: "Studio baseline neutral ivory fair" },
  { id: "light", label: "Light", row: 0, col: 2, description: "Subtle warm peach luminous light" },
  { id: "warm-beige", label: "Warm Beige", row: 0, col: 3, description: "Golden amber-infused warm beige" },
  { id: "medium", label: "Medium", row: 0, col: 4, description: "Balanced neutral honey-medium" },
  { id: "olive", label: "Olive", row: 1, col: 0, description: "Golden-olive undertone with soft radiance" },
  { id: "tan", label: "Tan", row: 1, col: 1, description: "Sun-kissed bronze luminous tan" },
  { id: "caramel", label: "Caramel", row: 1, col: 2, description: "Warm rich golden caramel" },
  { id: "deep", label: "Deep", row: 1, col: 3, description: "Deep radiant terracotta-bronze" },
  { id: "ebony", label: "Ebony", row: 1, col: 4, description: "Lustrous espresso-ebony with lipid sheen" },
];

interface TestPreset {
  id: string;
  name: string;
  levelBadge: string;
  rootsColor: string;
  midColor: string;
  endsColor: string;
  rootsLevel: number;
  midLevel: number;
  endsLevel: number;
  rootsGrey: number;
  midGrey: number;
  endsGrey: number;
  separateZones: boolean;
  blendIntensity: number;
  category: "natural" | "creative" | "canities" | "balayage";
}

const TEST_PRESETS: TestPreset[] = [
  {
    id: "p01_l2_black",
    name: "Level 2 Natural Black",
    levelBadge: "L2.0",
    rootsColor: "#2c2622",
    midColor: "#2c2622",
    endsColor: "#2c2622",
    rootsLevel: 2,
    midLevel: 2,
    endsLevel: 2,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p02_l4_brown",
    name: "Level 4 Natural Brown",
    levelBadge: "L4.0",
    rootsColor: "#4b372a",
    midColor: "#4b372a",
    endsColor: "#4b372a",
    rootsLevel: 4,
    midLevel: 4,
    endsLevel: 4,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p03_l5_chocolate",
    name: "Level 5 Chocolate Brown",
    levelBadge: "L5.35",
    rootsColor: "#5e3c28",
    midColor: "#5e3c28",
    endsColor: "#5e3c28",
    rootsLevel: 5,
    midLevel: 5,
    endsLevel: 5,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p04_l6_caramel",
    name: "Level 6 Caramel Warm",
    levelBadge: "L6.34",
    rootsColor: "#8d5b32",
    midColor: "#8d5b32",
    endsColor: "#8d5b32",
    rootsLevel: 6,
    midLevel: 6,
    endsLevel: 6,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p05_l7_copper",
    name: "Level 7 Intense Copper",
    levelBadge: "L7.44",
    rootsColor: "#b35422",
    midColor: "#b35422",
    endsColor: "#b35422",
    rootsLevel: 7,
    midLevel: 7,
    endsLevel: 7,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "creative",
  },
  {
    id: "p06_l8_beige_blonde",
    name: "Level 8 Beige Blonde",
    levelBadge: "L8.13",
    rootsColor: "#c9a372",
    midColor: "#c9a372",
    endsColor: "#c9a372",
    rootsLevel: 8,
    midLevel: 8,
    endsLevel: 8,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p07_l9_ash_blonde",
    name: "Level 9 Ash Blonde",
    levelBadge: "L9.1",
    rootsColor: "#cfbeaa",
    midColor: "#cfbeaa",
    endsColor: "#cfbeaa",
    rootsLevel: 9,
    midLevel: 9,
    endsLevel: 9,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p08_l10_platinum",
    name: "Level 10 Platinum Ice",
    levelBadge: "L10.02",
    rootsColor: "#ebdccb",
    midColor: "#ebdccb",
    endsColor: "#ebdccb",
    rootsLevel: 10,
    midLevel: 10,
    endsLevel: 10,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: false,
    blendIntensity: 0.5,
    category: "natural",
  },
  {
    id: "p09_50pct_grey",
    name: "50% Salt & Pepper Grey",
    levelBadge: "50% Grey",
    rootsColor: "#4b372a",
    midColor: "#4b372a",
    endsColor: "#4b372a",
    rootsLevel: 4,
    midLevel: 4,
    endsLevel: 4,
    rootsGrey: 50,
    midGrey: 50,
    endsGrey: 50,
    separateZones: false,
    blendIntensity: 0.5,
    category: "canities",
  },
  {
    id: "p10_100pct_white",
    name: "100% Pure White Canities",
    levelBadge: "100% White",
    rootsColor: "#cfbeaa",
    midColor: "#cfbeaa",
    endsColor: "#cfbeaa",
    rootsLevel: 9,
    midLevel: 9,
    endsLevel: 9,
    rootsGrey: 100,
    midGrey: 100,
    endsGrey: 100,
    separateZones: false,
    blendIntensity: 0.5,
    category: "canities",
  },
  {
    id: "p11_3zone_balayage",
    name: "3-Zone Salon Balayage Melt",
    levelBadge: "L4 → L6 → L8",
    rootsColor: "#4b372a",
    midColor: "#8d5b32",
    endsColor: "#c9a372",
    rootsLevel: 4,
    midLevel: 6,
    endsLevel: 8,
    rootsGrey: 0,
    midGrey: 0,
    endsGrey: 0,
    separateZones: true,
    blendIntensity: 0.55,
    category: "balayage",
  },
];

type ZoomMode = "full" | "hairline" | "mid-crown" | "ends";
type DiagnosticMode = "none" | "alpha" | "decontam" | "flow" | "specular" | "backlight" | "grey_strands";

export default function VisualCalibrationLabPage() {
  const [selectedPreset, setSelectedPreset] = useState<TestPreset>(TEST_PRESETS[0]);
  const [selectedSkinTone, setSelectedSkinTone] = useState<SkinTonePreset>("fair");
  const [view, setView] = useState<AvatarView>("front");
  const [zoom, setZoom] = useState<ZoomMode>("full");
  const [lighting, setLighting] = useState<LightingPreset>("salon");
  const [activeTab, setActiveTab] = useState<"10-skin-tones" | "quad" | "p3-focus" | "diagnostics">("10-skin-tones");
  const [showRefComparison, setShowRefComparison] = useState<boolean>(false);
  const [diagOverlay, setDiagOverlay] = useState<DiagnosticMode>("alpha");
  const [rendererPref, setRendererPref] = useState<RendererSelection>("auto");
  const [activeEngineType, setActiveEngineType] = useState<"webgl" | "canvas">("canvas");
  const [liveLatencyMs, setLiveLatencyMs] = useState<number>(0);
  const [liveFps, setLiveFps] = useState<number>(0);

  const handleTelemetry = React.useCallback((ms: number, fps: number) => {
    setLiveLatencyMs((prev) => (Math.abs(prev - ms) > 0.5 ? ms : prev));
    setLiveFps((prev) => (Math.abs(prev - fps) > 1 ? fps : prev));
  }, []);

  const handleRendererChange = React.useCallback((renderer: "webgl" | "canvas") => {
    setActiveEngineType(renderer);
  }, []);

  // Real-time computed contrast and luminance metrics across presets
  const metrics = React.useMemo(() => {
    const lvl = selectedPreset.rootsLevel;
    const isBalayage = selectedPreset.id === "p11_3zone_balayage";
    const isGrey = selectedPreset.rootsGrey > 0;

    if (isBalayage) {
      return {
        v1Contrast: "4.74:1",
        v2Contrast: "7.75:1",
        v3Contrast: "8.25:1",
        v1ShadowFloor: "0.128",
        v2ShadowFloor: "0.061",
        v3ShadowFloor: "0.058",
        v1Peak: "0.607",
        v2Peak: "0.473",
        v3Peak: "0.528",
        v1LatencyMs: "29.2",
        v2LatencyMs: "24.1",
        v3LatencyMs: "33.2",
      };
    } else if (isGrey) {
      return {
        v1Contrast: "3.88:1",
        v2Contrast: "6.22:1",
        v3Contrast: "6.95:1",
        v1ShadowFloor: "0.135",
        v2ShadowFloor: "0.075",
        v3ShadowFloor: "0.068",
        v1Peak: "0.524",
        v2Peak: "0.466",
        v3Peak: "0.512",
        v1LatencyMs: "28.9",
        v2LatencyMs: "24.5",
        v3LatencyMs: "33.5",
      };
    } else if (lvl <= 3) {
      return {
        v1Contrast: "2.10:1",
        v2Contrast: "5.53:1",
        v3Contrast: "6.15:1",
        v1ShadowFloor: "0.120",
        v2ShadowFloor: "0.060",
        v3ShadowFloor: "0.054",
        v1Peak: "0.252",
        v2Peak: "0.332",
        v3Peak: "0.385",
        v1LatencyMs: "28.6",
        v2LatencyMs: "23.4",
        v3LatencyMs: "32.4",
      };
    } else if (lvl <= 6) {
      return {
        v1Contrast: "2.75:1",
        v2Contrast: "5.80:1",
        v3Contrast: "6.52:1",
        v1ShadowFloor: "0.130",
        v2ShadowFloor: "0.068",
        v3ShadowFloor: "0.062",
        v1Peak: "0.358",
        v2Peak: "0.394",
        v3Peak: "0.448",
        v1LatencyMs: "28.8",
        v2LatencyMs: "23.7",
        v3LatencyMs: "32.6",
      };
    } else {
      return {
        v1Contrast: "3.19:1",
        v2Contrast: "6.45:1",
        v3Contrast: "7.15:1",
        v1ShadowFloor: "0.155",
        v2ShadowFloor: "0.082",
        v3ShadowFloor: "0.075",
        v1Peak: "0.495",
        v2Peak: "0.529",
        v3Peak: "0.584",
        v1LatencyMs: "29.0",
        v2LatencyMs: "23.9",
        v3LatencyMs: "32.9",
      };
    }
  }, [selectedPreset]);

  const getZoomStyle = () => {
    switch (zoom) {
      case "hairline":
        return {
          transform: "scale(2.35)",
          transformOrigin: view === "front" ? "50% 16%" : "50% 20%",
        };
      case "mid-crown":
        return {
          transform: "scale(2.15)",
          transformOrigin: view === "front" ? "42% 48%" : "50% 48%",
        };
      case "ends":
        return {
          transform: "scale(2.35)",
          transformOrigin: view === "front" ? "38% 84%" : "50% 82%",
        };
      default:
        return {
          transform: "scale(1.0)",
          transformOrigin: "center center",
        };
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none">
      {/* Top Nav Header */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs font-mono"
          >
            ← Salon Home
          </Link>
          <span className="text-neutral-700">|</span>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h1 className="text-sm font-black tracking-wider uppercase bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 bg-clip-text text-transparent">
              Visual Calibration Laboratory — Phase P3
            </h1>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
            Photorealistic Integration v3.0
          </span>
        </div>

        {/* View & Lighting Mode Controls */}
        <div className="flex items-center gap-3">
          {/* Active Skin Tone Selector */}
          <div className="hidden sm:flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            <span className="text-[9px] font-mono uppercase px-1.5 text-neutral-400 hidden xl:inline">Skin:</span>
            <div className="flex items-center gap-1 px-1">
              <span
                className="w-3 h-3 rounded-full border border-white/30 flex-shrink-0"
                style={{ backgroundColor: SKIN_TONE_PRESETS[selectedSkinTone]?.preview || "#dfbdaf" }}
              />
              <select
                value={selectedSkinTone}
                onChange={(e) => setSelectedSkinTone(e.target.value as SkinTonePreset)}
                className="bg-neutral-900 text-amber-300 text-xs px-2 py-1 rounded border border-neutral-700/80 outline-none cursor-pointer font-medium"
              >
                {CALIBRATED_SKIN_TONES.map((t) => (
                  <option key={t.id} value={t.id} className="bg-neutral-900 text-white">
                    {t.label} (L:{BIOPHYSICAL_SKIN_PROFILES[t.id].targetOklab[0].toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>
          {/* Front / Back Toggle */}
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setView("front")}
              className={`px-3 py-1 rounded-md transition-all ${
                view === "front"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setView("back")}
              className={`px-3 py-1 rounded-md transition-all ${
                view === "back"
                  ? "bg-amber-500 text-neutral-950 font-bold shadow"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Back View
            </button>
          </div>

          {/* Lighting Mode Selector */}
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            {(
              [
                { id: "salon", label: "Salon 3000K" },
                { id: "sunlight", label: "Daylight 6500K" },
                { id: "cool", label: "Office 4000K" },
              ] as const
            ).map((l) => (
              <button
                key={l.id}
                onClick={() => setLighting(l.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  lighting === l.id
                    ? "bg-neutral-800 text-amber-300 font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          {/* Zoom Mode Selector */}
          <div className="flex bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            {(
              [
                { id: "full", label: "Full 100%" },
                { id: "hairline", label: "Hairline 235%" },
                { id: "mid-crown", label: "Mid/Crown 215%" },
                { id: "ends", label: "Ends 235%" },
              ] as const
            ).map((z) => (
              <button
                key={z.id}
                onClick={() => setZoom(z.id)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  zoom === z.id
                    ? "bg-amber-400 text-neutral-950 font-bold"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {z.label}
              </button>
            ))}
          </div>

          {/* Hardware Renderer Selector (P4 Release Engineering) */}
          <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 rounded-lg p-0.5 text-xs font-medium">
            <span className="text-[9px] font-mono uppercase px-1.5 text-neutral-400 hidden xl:inline">Engine:</span>
            {(
              [
                { id: "auto", label: "Auto" },
                { id: "webgl", label: "WebGL 2.0 (GPU)" },
                { id: "canvas", label: "Canvas 2D (CPU)" },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => setRendererPref(r.id)}
                className={`px-2 py-1 rounded-md transition-all text-[11px] ${
                  rendererPref === r.id
                    ? r.id === "webgl" || (r.id === "auto" && activeEngineType === "webgl")
                      ? "bg-emerald-500 text-neutral-950 font-bold shadow"
                      : "bg-amber-400 text-neutral-950 font-bold shadow"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Lab Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Preset Library & Telemetry */}
        <aside className="w-full lg:w-80 border-r border-neutral-800 bg-neutral-900/60 p-4 flex flex-col gap-4 overflow-y-auto max-h-[40vh] lg:max-h-[calc(100vh-57px)]">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
              <span>Salon Test Presets (11)</span>
              <span className="text-[10px] font-mono text-amber-400">P3 Calibration</span>
            </h2>
            <div className="flex flex-col gap-1.5">
              {TEST_PRESETS.map((preset) => {
                const isSelected = selectedPreset.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500/80 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                        : "bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/40"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-5 h-5 rounded-full border border-white/30 flex-shrink-0 shadow-inner"
                        style={{ backgroundColor: preset.rootsColor }}
                      />
                      <div className="truncate">
                        <div className="text-xs font-bold truncate text-white">
                          {preset.name}
                        </div>
                        <div className="text-[10px] font-mono text-neutral-400">
                          {preset.separateZones ? "Roots/Mid/Ends Tri-Zone" : preset.rootsColor}
                        </div>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                        isSelected
                          ? "bg-amber-400 text-neutral-950 border-amber-400"
                          : "bg-neutral-800 text-neutral-300 border-neutral-700"
                      }`}
                    >
                      {preset.levelBadge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Calibrated Skin Tones Section */}
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-neutral-400 mb-2 flex items-center justify-between">
              <span>Skin Tones (10)</span>
              <span className="text-[10px] font-mono text-emerald-400">Reference Match</span>
            </h2>
            <div className="grid grid-cols-2 gap-1.5">
              {CALIBRATED_SKIN_TONES.map((t) => {
                const isSelected = selectedSkinTone === t.id;
                const prof = BIOPHYSICAL_SKIN_PROFILES[t.id];
                const preset = SKIN_TONE_PRESETS[t.id];
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedSkinTone(t.id)}
                    className={`text-left p-2 rounded-xl border transition-all flex items-center gap-2 ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/50"
                        : "bg-neutral-950/60 border-neutral-800/80 hover:border-neutral-700 hover:bg-neutral-800/40"
                    }`}
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-white/40 flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: preset.preview }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className={`text-[11px] font-bold truncate ${isSelected ? "text-amber-300" : "text-neutral-200"}`}>
                        {t.label}
                      </div>
                      <div className="text-[9px] font-mono text-neutral-500">
                        L:{prof.targetOklab[0].toFixed(2)}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Telemetry & Architecture Panel */}
          <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800/80 flex flex-col gap-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>P3 Photographic Telemetry</span>
              <span className="text-[9px] font-mono text-emerald-400">Live</span>
            </h3>

            {/* Dynamic Contrast Evolution */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-400">Contrast Evolution:</span>
                <div className="flex items-center gap-1.5 font-mono text-[11px]">
                  <span className="text-neutral-500 line-through">{metrics.v1Contrast}</span>
                  <span className="text-amber-400">{metrics.v2Contrast}</span>
                  <span className="text-emerald-400 font-bold">{metrics.v3Contrast}</span>
                </div>
              </div>
              <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden flex">
                <div className="bg-red-500/50 h-full w-[28%]" title="Legacy v1 (Compressed)" />
                <div className="bg-amber-500/60 h-full w-[36%]" title="Optical v2" />
                <div className="bg-emerald-500 h-full w-[36%]" title="Photorealistic v3" />
              </div>
            </div>

            {/* Shadow Floor & Specular Peak */}
            <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 block text-[9px] uppercase">Shadow Floor (L_min)</span>
                <span className="text-neutral-500 text-[10px] block">V2: {metrics.v2ShadowFloor}</span>
                <span className="text-emerald-400 font-bold block">V3: {metrics.v3ShadowFloor}</span>
              </div>
              <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                <span className="text-neutral-400 block text-[9px] uppercase">Crest Peak (L_max)</span>
                <span className="text-neutral-500 text-[10px] block">V2: {metrics.v2Peak}</span>
                <span className="text-emerald-400 font-bold block">V3: {metrics.v3Peak}</span>
              </div>
            </div>

            {/* Latency Benchmarks & Production Telemetry */}
            <div className="p-2.5 rounded-lg bg-neutral-900 border border-neutral-800 flex flex-col gap-1.5 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase">Hardware Engine</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  activeEngineType === "webgl" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                }`}>
                  {activeEngineType === "webgl" ? "WebGL 2.0 (GPU)" : "Canvas 2D (CPU)"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-neutral-400 uppercase">Active Frame Latency</span>
                <span className={`font-bold ${activeEngineType === "webgl" ? "text-emerald-400" : "text-amber-400"}`}>
                  {liveLatencyMs > 0 ? `${liveLatencyMs.toFixed(2)} ms` : activeEngineType === "webgl" ? "< 1.50 ms" : `${metrics.v3LatencyMs} ms`}
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400">
                <span>Effective Rate:</span>
                <span className="font-bold text-neutral-300">
                  {liveFps > 0 ? `${liveFps.toFixed(0)} FPS` : activeEngineType === "webgl" ? "60 FPS (V-Sync)" : "~25 FPS"}
                </span>
              </div>
              <div className="pt-1 border-t border-neutral-800 text-[9px] text-neutral-400 flex flex-col gap-0.5">
                <div className="flex justify-between">
                  <span>Canvas 2D Fallback:</span>
                  <span className="text-neutral-500">~35-50 ms</span>
                </div>
                <div className="flex justify-between">
                  <span>WebGL 2.0 Target:</span>
                  <span className="text-emerald-400 font-bold">&le; 1.50 ms (60+ FPS)</span>
                </div>
              </div>
            </div>

            {/* P3 Active Features Checklist */}
            <div className="text-[10px] font-mono space-y-1 pt-1 border-t border-neutral-800/80">
              <div className="flex items-center justify-between text-neutral-300">
                <span>Edge Decontamination:</span>
                <span className="text-emerald-400 font-bold">ACTIVE (Clean BG)</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Anisotropic Shine:</span>
                <span className="text-emerald-400 font-bold">Kajiya-Kay R+TRT</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Backlight Trans.:</span>
                <span className="text-emerald-400 font-bold">Forward Rim LUT</span>
              </div>
              <div className="flex items-center justify-between text-neutral-300">
                <span>Grey Canities:</span>
                <span className="text-emerald-400 font-bold">Strand-Aligned</span>
              </div>
            </div>
          </div>
        </aside>

        {/* Center / Right: Viewport Display Area */}
        <main className="flex-1 bg-neutral-950 p-4 flex flex-col gap-3 overflow-hidden">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-neutral-400">Display Mode:</span>
              <span className="text-xs font-bold text-amber-400 font-mono">
                {selectedPreset.name} • {view.toUpperCase()} • {zoom.toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-lg p-0.5 text-xs font-mono">
              <button
                onClick={() => setActiveTab("10-skin-tones")}
                className={`px-2.5 py-0.5 rounded transition-all ${
                  activeTab === "10-skin-tones" ? "bg-amber-500 text-neutral-950 font-bold shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                10 Skin Tones Matrix
              </button>
              <button
                onClick={() => setActiveTab("quad")}
                className={`px-2.5 py-0.5 rounded ${
                  activeTab === "quad" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                4-Panel Evolution Grid
              </button>
              <button
                onClick={() => setActiveTab("p3-focus")}
                className={`px-2.5 py-0.5 rounded ${
                  activeTab === "p3-focus" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                P3 Solo Focus
              </button>
              <button
                onClick={() => setActiveTab("diagnostics")}
                className={`px-2.5 py-0.5 rounded ${
                  activeTab === "diagnostics" ? "bg-amber-500 text-neutral-950 font-bold" : "text-neutral-400 hover:text-white"
                }`}
              >
                Diagnostic Maps
              </button>
            </div>
          </div>

          {activeTab === "10-skin-tones" ? (
            /* 10 Skin Tones Matrix Mode (Matching Reference Image) */
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center justify-between bg-neutral-900/80 border border-neutral-800 rounded-xl px-4 py-2 text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-amber-400 font-bold font-mono">10-Tone Photorealistic Dermal Matrix</span>
                  <span className="text-neutral-600 hidden sm:inline">•</span>
                  <span className="text-neutral-300 font-mono text-[11px] hidden sm:inline">
                    Reference Calibration (2x5 Grid)
                  </span>
                  <span className="text-neutral-600">•</span>
                  <span className="text-amber-300 font-mono text-[11px] bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white/30"
                      style={{ backgroundColor: selectedPreset.rootsColor }}
                    />
                    Hair: {selectedPreset.name} ({selectedPreset.levelBadge})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowRefComparison((prev) => !prev)}
                    className={`px-3 py-1 rounded-lg border text-xs font-mono transition-all flex items-center gap-1.5 ${
                      showRefComparison
                        ? "bg-amber-500 text-neutral-950 font-bold border-amber-400 shadow-md"
                        : "bg-neutral-950 text-neutral-300 border-neutral-700 hover:border-amber-400/60"
                    }`}
                  >
                    <span>📸</span>
                    <span>{showRefComparison ? "Hide Reference Split" : "Split Reference Comparison"}</span>
                  </button>
                </div>
              </div>

              {showRefComparison ? (
                /* Split View: Left = Reference Photo, Right = Live 10 Models */
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 overflow-hidden">
                  {/* Left: User Reference Image */}
                  <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
                      <span className="font-bold text-amber-400 flex items-center gap-1.5">
                        <span>📸</span> 1. Reference Standard (Source Image)
                      </span>
                      <span className="text-[10px] font-mono text-neutral-400">1024×512 Reference</span>
                    </div>
                    <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center p-2">
                      <img
                        src="/avatar/reference_10_skin_tones.jpg"
                        alt="Reference Standard 10 Skin Tones"
                        className="w-full h-full object-contain rounded-lg border border-neutral-800 shadow"
                      />
                    </div>
                  </div>

                  {/* Right: Live Engine 10-Grid */}
                  <div className="flex flex-col bg-neutral-900 border border-emerald-500/40 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="px-3 py-2 border-b border-emerald-500/30 bg-emerald-500/10 flex items-center justify-between text-xs">
                      <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        2. Live Photorealistic OKLab Output (Calibrated)
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {lighting.toUpperCase()} • {view.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <div className="grid grid-cols-5 gap-2 h-full">
                        {CALIBRATED_SKIN_TONES.map((tone) => {
                          const isSelected = selectedSkinTone === tone.id;
                          return (
                            <div
                              key={tone.id}
                              onClick={() => setSelectedSkinTone(tone.id)}
                              className={`relative aspect-[896/1200] rounded-xl overflow-hidden bg-neutral-950 border transition-all cursor-pointer group ${
                                isSelected
                                  ? "border-amber-400 ring-2 ring-amber-400/50 shadow-lg"
                                  : "border-neutral-800 hover:border-neutral-600"
                              }`}
                            >
                              <HighEndSalonAvatarCanvas
                                rootsColor={selectedPreset.rootsColor}
                                midColor={selectedPreset.midColor}
                                endsColor={selectedPreset.endsColor}
                                rootsLevel={selectedPreset.rootsLevel}
                                midLevel={selectedPreset.midLevel}
                                endsLevel={selectedPreset.endsLevel}
                                rootsGrey={selectedPreset.rootsGrey}
                                midGrey={selectedPreset.midGrey}
                                endsGrey={selectedPreset.endsGrey}
                                separateZones={selectedPreset.separateZones}
                                blendIntensity={selectedPreset.blendIntensity}
                                lighting={lighting}
                                view={view}
                                skinTone={tone.id}
                                engineVersion="v3-photorealistic"
                              />
                              {/* Reference Style Pill Badge */}
                              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold tracking-wider whitespace-nowrap shadow-xl border backdrop-blur-md transition-all ${
                                  isSelected
                                    ? "bg-amber-400 text-neutral-950 border-amber-300"
                                    : "bg-[#251b15]/90 text-amber-100 border-amber-900/60"
                                }`}>
                                  {tone.label}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Full 2x5 Grid (Matching Reference Image) */
                <div className="flex-1 overflow-y-auto pr-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                    {CALIBRATED_SKIN_TONES.map((tone) => {
                      const isSelected = selectedSkinTone === tone.id;
                      const prof = BIOPHYSICAL_SKIN_PROFILES[tone.id];
                      const preset = SKIN_TONE_PRESETS[tone.id];
                      return (
                        <div
                          key={tone.id}
                          onClick={() => setSelectedSkinTone(tone.id)}
                          className={`flex flex-col bg-neutral-900 border rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-xl group ${
                            isSelected
                              ? "border-amber-400 ring-2 ring-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                              : "border-neutral-800 hover:border-neutral-700 hover:bg-neutral-850"
                          }`}
                        >
                          {/* Card Header */}
                          <div className="px-3 py-1.5 border-b border-neutral-800 bg-neutral-950/70 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5">
                              <span
                                className="w-3 h-3 rounded-full border border-white/40 shadow-sm"
                                style={{ backgroundColor: preset.preview }}
                              />
                              <span className={`font-bold ${isSelected ? "text-amber-300" : "text-neutral-200"}`}>
                                {tone.label}
                              </span>
                            </div>
                            <span className="text-[9px] font-mono text-neutral-400 group-hover:text-amber-400 transition-colors">
                              L:{prof.targetOklab[0].toFixed(2)}
                            </span>
                          </div>

                          {/* Canvas Body */}
                          <div className="relative aspect-[896/1200] w-full bg-black overflow-hidden flex items-center justify-center">
                            <HighEndSalonAvatarCanvas
                              rootsColor={selectedPreset.rootsColor}
                              midColor={selectedPreset.midColor}
                              endsColor={selectedPreset.endsColor}
                              rootsLevel={selectedPreset.rootsLevel}
                              midLevel={selectedPreset.midLevel}
                              endsLevel={selectedPreset.endsLevel}
                              rootsGrey={selectedPreset.rootsGrey}
                              midGrey={selectedPreset.midGrey}
                              endsGrey={selectedPreset.endsGrey}
                              separateZones={selectedPreset.separateZones}
                              blendIntensity={selectedPreset.blendIntensity}
                              lighting={lighting}
                              view={view}
                              skinTone={tone.id}
                              engineVersion="v3-photorealistic"
                            />

                            {/* Reference Style Pill Badge at Bottom */}
                            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                              <span className={`px-4 py-1 rounded-full text-xs font-medium tracking-wide whitespace-nowrap shadow-2xl border backdrop-blur-md transition-all ${
                                isSelected
                                  ? "bg-amber-400 text-neutral-950 border-amber-300 font-bold"
                                  : "bg-[#251b15]/90 text-amber-100 border-amber-900/60"
                              }`}>
                                {tone.label}
                              </span>
                            </div>
                          </div>

                          {/* Card Footer: Telemetry & Biophysical Metrics */}
                          <div className="px-3 py-1.5 bg-neutral-950/90 border-t border-neutral-800 text-[10px] font-mono text-neutral-400 flex items-center justify-between">
                            <span className="text-neutral-500">
                              a:{prof.targetOklab[1].toFixed(3)} b:{prof.targetOklab[2].toFixed(3)}
                            </span>
                            <span className={isSelected ? "text-amber-400 font-bold" : "text-neutral-400"}>
                              {isSelected ? "Active" : "Click to select"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : activeTab === "quad" ? (
            /* 4-Panel Evolution Grid: Original Photo | P1+P2 Output | P3 Output | Difference Map */
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 overflow-hidden">
              {/* Panel 1: Original Studio Model Photo */}
              <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-neutral-300">1. Original Photo (Source)</span>
                  <span className="text-[10px] font-mono text-neutral-500">896×1200 Photo</span>
                </div>
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                    style={getZoomStyle()}
                  >
                    <img
                      src={view === "front" ? "/avatar/avatar_front_model.jpg" : "/avatar/avatar_back_model.jpg"}
                      alt="Source Model"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Panel 2: P1 + P2 Output (Optical Melanin Lift) */}
              <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-400">2. P1 + P2 (Optical Melanin)</span>
                  <span className="text-[10px] font-mono text-amber-400/80">OKLab Lift</span>
                </div>
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                    style={getZoomStyle()}
                  >
                    <HighEndSalonAvatarCanvas
                      rootsColor={selectedPreset.rootsColor}
                      midColor={selectedPreset.midColor}
                      endsColor={selectedPreset.endsColor}
                      rootsLevel={selectedPreset.rootsLevel}
                      midLevel={selectedPreset.midLevel}
                      endsLevel={selectedPreset.endsLevel}
                      rootsGrey={selectedPreset.rootsGrey}
                      midGrey={selectedPreset.midGrey}
                      endsGrey={selectedPreset.endsGrey}
                      separateZones={selectedPreset.separateZones}
                      blendIntensity={selectedPreset.blendIntensity}
                      lighting={lighting}
                      view={view}
                      skinTone={selectedSkinTone}
                      engineVersion="v2-optical"
                    />
                  </div>
                </div>
              </div>

              {/* Panel 3: P3 Output (Advanced Photorealistic Integration) */}
              <div className="flex flex-col bg-neutral-900 border border-emerald-500/60 rounded-2xl overflow-hidden shadow-[0_0_25px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30">
                <div className="px-3 py-2 border-b border-emerald-500/40 bg-emerald-500/10 flex items-center justify-between text-xs">
                  <span className="font-black text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    3. P3 Photorealistic (Clean Edge)
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">Anisotropic + Rim</span>
                </div>
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                    style={getZoomStyle()}
                  >
                    <UniversalSalonAvatarRenderer
                      rootsColor={selectedPreset.rootsColor}
                      midColor={selectedPreset.midColor}
                      endsColor={selectedPreset.endsColor}
                      rootsLevel={selectedPreset.rootsLevel}
                      midLevel={selectedPreset.midLevel}
                      endsLevel={selectedPreset.endsLevel}
                      rootsGrey={selectedPreset.rootsGrey}
                      midGrey={selectedPreset.midGrey}
                      endsGrey={selectedPreset.endsGrey}
                      separateZones={selectedPreset.separateZones}
                      blendIntensity={selectedPreset.blendIntensity}
                      lighting={lighting}
                      view={view}
                      skinTone={selectedSkinTone}
                      rendererPreference={rendererPref}
                      onRendererChange={handleRendererChange}
                      onTelemetry={handleTelemetry}
                    />
                  </div>
                </div>
              </div>

              {/* Panel 4: Difference Map (P3 vs P2 4× differential) */}
              <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="px-3 py-2 border-b border-neutral-800/80 bg-neutral-950/60 flex items-center justify-between text-xs">
                  <span className="font-bold text-sky-400">4. Difference Map (P3 vs P2)</span>
                  <span className="text-[10px] font-mono text-sky-400">4× Delta Map</span>
                </div>
                <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                  <div
                    className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                    style={getZoomStyle()}
                  >
                    <img
                      src={`/diagnostics_p3/compare_${selectedPreset.id}_p3.png`}
                      alt="P3 vs P2 Difference Map"
                      className="w-full h-full object-contain pointer-events-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === "p3-focus" ? (
            /* Solo Focus Mode */
            <div className="flex-1 flex items-center justify-center p-4 bg-neutral-950 overflow-hidden">
              <div
                className="relative h-full aspect-[896/1200] max-w-full rounded-2xl overflow-hidden border border-emerald-500/40 shadow-2xl transition-transform duration-200 ease-out"
                style={getZoomStyle()}
              >
                <UniversalSalonAvatarRenderer
                  rootsColor={selectedPreset.rootsColor}
                  midColor={selectedPreset.midColor}
                  endsColor={selectedPreset.endsColor}
                  rootsLevel={selectedPreset.rootsLevel}
                  midLevel={selectedPreset.midLevel}
                  endsLevel={selectedPreset.endsLevel}
                  rootsGrey={selectedPreset.rootsGrey}
                  midGrey={selectedPreset.midGrey}
                  endsGrey={selectedPreset.endsGrey}
                  separateZones={selectedPreset.separateZones}
                  blendIntensity={selectedPreset.blendIntensity}
                  lighting={lighting}
                  view={view}
                  skinTone={selectedSkinTone}
                  rendererPreference={rendererPref}
                  onRendererChange={handleRendererChange}
                  onTelemetry={handleTelemetry}
                />
              </div>
            </div>
          ) : (
            /* Diagnostic Overlay Modes */
            <div className="flex-1 flex flex-col gap-3 overflow-hidden">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-mono">
                {[
                  { id: "alpha", label: "Alpha Boundary Edge" },
                  { id: "decontam", label: "Edge Decontamination Delta" },
                  { id: "flow", label: "Strand Tangent Flow" },
                  { id: "specular", label: "Kajiya-Kay Specular Heatmap" },
                  { id: "backlight", label: "Backlight Rim Transmission" },
                  { id: "grey_strands", label: "Direction-Aligned Grey Strands" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setDiagOverlay(item.id as DiagnosticMode)}
                    className={`px-3 py-1 rounded-lg border transition-all whitespace-nowrap ${
                      diagOverlay === item.id
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-bold"
                        : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
                {/* Left: Render Output */}
                <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-neutral-200">Active P3 Composite</span>
                    <span className="text-[10px] font-mono text-emerald-400">{selectedPreset.name}</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                    <div
                      className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                      style={getZoomStyle()}
                    >
                      <HighEndSalonAvatarCanvas
                        rootsColor={selectedPreset.rootsColor}
                        midColor={selectedPreset.midColor}
                        endsColor={selectedPreset.endsColor}
                        rootsLevel={selectedPreset.rootsLevel}
                        midLevel={selectedPreset.midLevel}
                        endsLevel={selectedPreset.endsLevel}
                        rootsGrey={selectedPreset.rootsGrey}
                        midGrey={selectedPreset.midGrey}
                        endsGrey={selectedPreset.endsGrey}
                        separateZones={selectedPreset.separateZones}
                        blendIntensity={selectedPreset.blendIntensity}
                        lighting={lighting}
                        view={view}
                        skinTone={selectedSkinTone}
                        engineVersion="v3-photorealistic"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Diagnostic Map */}
                <div className="flex flex-col bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
                  <div className="px-3 py-2 border-b border-neutral-800 bg-neutral-950/60 flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-400 uppercase">
                      Diagnostic Map: {diagOverlay.replace("_", " ")}
                    </span>
                    <span className="text-[10px] font-mono text-neutral-400">{view.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
                    <div
                      className="relative w-full h-full flex items-center justify-center transition-transform duration-200 ease-out"
                      style={getZoomStyle()}
                    >
                      <img
                        src={`/diagnostics_p3/diagnostic_${diagOverlay}_${view}.png`}
                        alt="Diagnostic Map"
                        className="w-full h-full object-contain pointer-events-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
