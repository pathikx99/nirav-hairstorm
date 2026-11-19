"use client";

import React from "react";
import { useHairAvatar } from "../../features/avatar/hooks/useHairAvatar";
import { HairAvatarViewport } from "./HairAvatarViewport";
import { AvatarViewSwitcher } from "./AvatarViewSwitcher";
import { HairstyleSelector } from "./HairstyleSelector";
import { SkinToneSelector } from "./SkinToneSelector";
import { HairRegionControls } from "./HairRegionControls";
import { LightingSelector } from "./LightingSelector";
import { BeforeAfterComparison } from "./BeforeAfterComparison";
import Link from "next/link";

interface HairAvatarStudioProps {
  className?: string;
  embedded?: boolean;
}

export function HairAvatarStudio({
  className = "",
  embedded = false,
}: HairAvatarStudioProps) {
  const {
    state,
    setHairstyle,
    setViewAngle,
    setSkinTone,
    setSkinCustom,
    setRegion,
    setLighting,
    setZoom,
    setPan,
    setBeforeAfterMode,
    setBeforeAfterSplit,
    setShowOriginal,
    syncWithFormulation,
    resetToNatural,
  } = useHairAvatar();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Studio Header (if not embedded) */}
      {!embedded && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 to-rose-500 text-sm">
                👤
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Hair Avatar Studio
              </h1>
              <span className="rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                WebGL 2.0 Realtime
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Photorealistic digital human consultation studio with independent skin, 4 hair archetypes, 3-zone colorimetry, and physical metamerism.
            </p>
          </div>

          {/* Action Header Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={resetToNatural}
              className="px-3 py-1.5 rounded-xl border border-neutral-800 bg-neutral-900 text-xs font-bold text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              Reset Look
            </button>

            <button
              type="button"
              onClick={syncWithFormulation}
              className="px-3.5 py-1.5 rounded-xl border border-amber-500/50 bg-amber-500/15 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span>⚡</span>
              <span>Sync with Active Formulation</span>
            </button>

            <Link
              href="/formulation"
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-neutral-950 text-xs font-black hover:brightness-110 transition-all shadow-md shadow-amber-500/20 flex items-center gap-1"
            >
              <span>🥣</span>
              <span>View Recipe</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main Studio Grid: Left = Large Avatar Viewport, Right = Comprehensive Studio Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Avatar Canvas Viewport (7 Cols on Desktop) */}
        <div className="lg:col-span-7 space-y-4">
          {/* View Perspective Switcher & Comparison Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <AvatarViewSwitcher
              currentView={state.viewAngle}
              onViewChange={setViewAngle}
            />

            <BeforeAfterComparison
              mode={state.beforeAfterMode}
              splitRatio={state.beforeAfterSplit}
              showOriginal={state.showOriginal}
              onChangeMode={setBeforeAfterMode}
              onChangeSplit={setBeforeAfterSplit}
              onToggleOriginal={setShowOriginal}
            />
          </div>

          {/* Main Photorealistic Viewport */}
          <HairAvatarViewport
            hairstyle={state.hairstyle}
            viewAngle={state.viewAngle}
            skinTone={state.skinTone}
            skinCustom={state.skinCustom}
            regions={state.regions}
            lighting={state.lighting}
            zoom={state.zoom}
            pan={state.pan}
            onZoomChange={setZoom}
            onPanChange={setPan}
            beforeAfterMode={state.beforeAfterMode}
            beforeAfterSplit={state.beforeAfterSplit}
            onSplitChange={setBeforeAfterSplit}
            showOriginal={state.showOriginal}
          />

          {/* Quick Guidance Card */}
          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-950/60 p-3 text-[11px] text-neutral-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>💡</span>
              <span>Zoom in to inspect individual cuticle luster, root transitions, and flyaway edge coherence.</span>
            </span>
            <span className="font-mono text-neutral-400 hidden sm:inline">896 × 1200 px</span>
          </div>
        </div>

        {/* Right Column: Studio Customization Controls (5 Cols on Desktop) */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Hairstyle Selection */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-4">
            <HairstyleSelector
              currentHairstyle={state.hairstyle}
              onSelectHairstyle={setHairstyle}
            />
          </div>

          {/* 2. Client Skin Tone Selection */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-4">
            <SkinToneSelector
              currentTone={state.skinTone}
              customAdjustment={state.skinCustom}
              onSelectTone={setSkinTone}
              onChangeCustom={setSkinCustom}
            />
          </div>

          {/* 3. Hair Region Recolor Controls (Roots, Mid, Ends) */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-4">
            <HairRegionControls
              regions={state.regions}
              onChangeRegion={setRegion}
              onSyncFormulation={syncWithFormulation}
              formulationSynced={state.formulationSynced}
            />
          </div>

          {/* 4. Environmental Illuminant & Metamerism */}
          <div className="rounded-3xl border border-neutral-800 bg-neutral-900/40 p-4">
            <LightingSelector
              currentLighting={state.lighting}
              onSelectLighting={setLighting}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
