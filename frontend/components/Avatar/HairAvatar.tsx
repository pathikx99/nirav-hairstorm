/**
 * HairAvatar.tsx
 * Primary Salon-Grade Digital Human Hair Avatar for Chromatique.
 * 
 * Features:
 * - 100% photorealistic studio salon digital human model (896x1200)
 * - Strict zero-bleed: Skin, eyes, makeup, lips, neck, clothes, and salon background remain completely natural
 * - Natural skin tone adaptation across 8 Fitzpatrick presets with zero plastic smoothing
 * - Independent 3-zone color application (Roots, Mid-Lengths, Ends)
 * - Organized responsive UI/UX across mobile, tablet, and PC
 * - Direct 1-tap touch pins on hair and responsive bottom zone cards
 * - Zero button duplication with parent pages
 */

"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  AvatarState,
  AvatarView,
  HairZoneId,
  LightingPreset,
  SkinTonePreset,
  SkinUndertone,
  UniversalLevel,
  ToneFamily,
} from "./AvatarTypes";
import { calculateRenderedHairPalette } from "./AvatarColorEngine";
import { AvatarControls } from "./AvatarControls";
import { HighEndSalonAvatarCanvas } from "./HighEndSalonAvatarCanvas";

export interface HairAvatarProps {
  value?: AvatarState;
  onChange?: (state: AvatarState) => void;

  level?: UniversalLevel;
  primaryTone?: ToneFamily;
  secondaryTone?: ToneFamily | null;
  naturalBaseLevel?: UniversalLevel;
  rootsLevel?: UniversalLevel | null;
  rootsTone?: ToneFamily | null;
  rootsColor?: string;
  midLevel?: UniversalLevel | null;
  midTone?: ToneFamily | null;
  midColor?: string;
  endsLevel?: UniversalLevel | null;
  endsTone?: ToneFamily | null;
  endsColor?: string;
  separateZones?: boolean;
  blendIntensity?: number;
  greyPercentage?: number;
  rootsGrey?: number;
  midGrey?: number;
  endsGrey?: number;

  skinTone?: SkinTonePreset | string;
  skinUndertone?: SkinUndertone;
  onSkinToneChange?: (skinTone: SkinTonePreset) => void;
  lightingMode?: LightingPreset | string;
  onLightingModeChange?: (lighting: LightingPreset) => void;
  viewAngle?: AvatarView | string;
  onViewAngleChange?: (view: AvatarView) => void;
  activeRegion?: HairZoneId | string;
  onSelectRegion?: (region: HairZoneId) => void;

  showControls?: boolean;
  showSkinToneBar?: boolean;
  showViewToggle?: boolean;
  showLightingBar?: boolean;
  showZoneCards?: boolean;
  showLevelSlider?: boolean;
  showToneSelector?: boolean;
  className?: string;
}

function mapLegacySkinTone(input?: string): SkinTonePreset {
  if (!input) return "fair";
  const lower = input.toLowerCase().replace(/_/g, "-");
  if (lower === "porcelain") return "porcelain";
  if (lower === "very-fair" || lower === "veryfair") return "very-fair";
  if (lower === "fair") return "fair";
  if (lower === "light") return "light";
  if (lower === "warm-beige" || lower === "warmbeige") return "warm-beige";
  if (lower === "medium") return "medium";
  if (lower === "olive") return "olive";
  if (lower === "tan") return "tan";
  if (lower === "caramel" || lower === "almond") return "caramel";
  if (lower === "brown" || lower === "chestnut") return "brown";
  if (lower === "espresso" || lower === "dark") return "espresso";
  if (lower === "deep" || lower === "ebony") return "deep";
  return "fair";
}

function mapLegacyLighting(input?: string): LightingPreset {
  if (!input) return "salon";
  const lower = input.toLowerCase();
  if (lower === "daylight" || lower === "sunlight") return "sunlight";
  if (lower === "warm" || lower === "salon") return "salon";
  if (lower === "cool") return "cool";
  return "salon";
}

function mapLegacyView(input?: string): AvatarView {
  if (!input) return "front";
  const lower = input.toLowerCase();
  return lower === "back" ? "back" : "front";
}

function mapLegacyZone(input?: string): HairZoneId {
  if (!input) return "roots";
  const lower = input.toLowerCase().replace(/_/g, "");
  if (lower.includes("root")) return "roots";
  if (lower.includes("mid")) return "midLengths";
  if (lower.includes("end")) return "ends";
  return "roots";
}

export const HairAvatar: React.FC<HairAvatarProps> = ({
  value,
  onChange,
  level,
  primaryTone,
  secondaryTone = null,
  naturalBaseLevel = 3,
  rootsLevel,
  rootsTone,
  rootsColor,
  midLevel,
  midTone,
  midColor,
  endsLevel,
  endsTone,
  endsColor,
  separateZones,
  blendIntensity = 0.5,
  greyPercentage = 0,
  rootsGrey,
  midGrey,
  endsGrey,
  skinTone,
  skinUndertone,
  onSkinToneChange,
  lightingMode,
  onLightingModeChange,
  viewAngle = "front",
  onViewAngleChange,
  activeRegion = "roots",
  onSelectRegion,
  showControls = false,
  showSkinToneBar = true,
  showViewToggle = true,
  showLightingBar = false,
  showZoneCards = true,
  showLevelSlider = false,
  showToneSelector = false,
  className = "",
}) => {
  const [internalState, setInternalState] = useState<AvatarState>(() => ({
    view: mapLegacyView(viewAngle),
    lighting: lightingMode ? mapLegacyLighting(lightingMode) : "salon",
    skin: {
      tone: skinTone ? mapLegacySkinTone(skinTone) : "fair",
      undertone: skinUndertone ?? "neutral",
    },
    hair: {
      naturalBaseLevel: naturalBaseLevel,
      roots: {
        level: rootsLevel ?? (level ?? 3),
        tone: rootsTone ?? (primaryTone ?? "NATURAL"),
        color: rootsColor,
        greyPercentage: rootsGrey ?? greyPercentage,
      },
      midLengths: {
        level: midLevel ?? 6,
        tone: midTone ?? "ASH",
        color: midColor,
        greyPercentage: midGrey ?? greyPercentage,
      },
      ends: {
        level: endsLevel ?? 9,
        tone: endsTone ?? "BEIGE",
        color: endsColor,
        greyPercentage: endsGrey ?? greyPercentage,
      },
      separateZones: separateZones !== undefined ? separateZones : true,
      blendIntensity: blendIntensity,
      greyPercentage: greyPercentage,
    },
    activeZone: mapLegacyZone(activeRegion),
  }));

  const activeView = viewAngle ? mapLegacyView(viewAngle) : internalState.view;
  const activeSkin = skinTone ? mapLegacySkinTone(skinTone) : internalState.skin.tone;
  const activeLight = lightingMode ? mapLegacyLighting(lightingMode) : internalState.lighting;

  // Synchronize incoming props with internal state (preserving view angle so it never flips)
  useEffect(() => {
    if (!value && (level !== undefined || rootsLevel !== undefined || midLevel !== undefined || endsLevel !== undefined || rootsGrey !== undefined || midGrey !== undefined || endsGrey !== undefined)) {
      setInternalState((prev) => ({
        view: viewAngle ? mapLegacyView(viewAngle) : prev.view,
        lighting: lightingMode ? mapLegacyLighting(lightingMode) : prev.lighting,
        skin: {
          tone: skinTone ? mapLegacySkinTone(skinTone) : prev.skin.tone,
          undertone: skinUndertone ?? prev.skin.undertone,
        },
        hair: {
          naturalBaseLevel: naturalBaseLevel,
          roots: {
            level: rootsLevel ?? (level ?? prev.hair.roots.level),
            tone: rootsTone ?? (primaryTone ?? prev.hair.roots.tone),
            color: rootsColor,
            greyPercentage: rootsGrey ?? (prev.hair.roots.greyPercentage ?? greyPercentage),
          },
          midLengths: {
            level: midLevel ?? (level ?? prev.hair.midLengths.level),
            tone: midTone ?? (secondaryTone || primaryTone || prev.hair.midLengths.tone),
            color: midColor,
            greyPercentage: midGrey ?? (prev.hair.midLengths.greyPercentage ?? greyPercentage),
          },
          ends: {
            level: endsLevel ?? (level ?? prev.hair.ends.level),
            tone: endsTone ?? (secondaryTone || primaryTone || prev.hair.ends.tone),
            color: endsColor,
            greyPercentage: endsGrey ?? (prev.hair.ends.greyPercentage ?? greyPercentage),
          },
          separateZones: separateZones !== undefined ? separateZones : prev.hair.separateZones,
          blendIntensity: blendIntensity,
          greyPercentage: greyPercentage,
        },
        activeZone: activeRegion ? mapLegacyZone(activeRegion) : prev.activeZone,
      }));
    }
  }, [
    value,
    level,
    primaryTone,
    secondaryTone,
    naturalBaseLevel,
    rootsLevel,
    rootsTone,
    rootsColor,
    midLevel,
    midTone,
    midColor,
    endsLevel,
    endsTone,
    endsColor,
    rootsGrey,
    midGrey,
    endsGrey,
    separateZones,
    blendIntensity,
    greyPercentage,
    skinTone,
    skinUndertone,
    lightingMode,
    viewAngle,
    activeRegion,
  ]);

  const activeState = value ?? internalState;

  const handleStateChange = (updater: (prev: AvatarState) => AvatarState) => {
    const nextState = updater(activeState);
    if (!value) {
      setInternalState(nextState);
    }
    if (onChange) {
      onChange(nextState);
    }
    if (onSelectRegion && nextState.activeZone !== activeState.activeZone) {
      onSelectRegion(nextState.activeZone);
    }
  };

  const handleSetView = (newView: AvatarView) => {
    if (onViewAngleChange) {
      onViewAngleChange(newView);
    }
    handleStateChange((prev) => ({ ...prev, view: newView }));
  };

  const handleSetSkinTone = (newSkin: SkinTonePreset) => {
    if (onSkinToneChange) {
      onSkinToneChange(newSkin);
    }
    handleStateChange((prev) => ({
      ...prev,
      skin: { ...prev.skin, tone: newSkin },
    }));
  };

  const handleSelectZone = (zone: HairZoneId) => {
    handleStateChange((prev) => ({ ...prev, activeZone: zone }));
    if (onSelectRegion) {
      onSelectRegion(zone);
    }
  };

  // Colorimetry palette
  const hairPalette = useMemo(() => {
    return calculateRenderedHairPalette(
      activeState.hair,
      lightingMode ? mapLegacyLighting(lightingMode) : activeState.lighting
    );
  }, [activeState.hair, activeState.lighting, lightingMode]);

  const currentZoneData = activeState.hair[activeState.activeZone];

  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border border-neutral-800 bg-neutral-950 p-3 sm:p-4 md:p-5 shadow-2xl overflow-hidden w-full ${className}`}
    >
      {/* 1. Top Header Bar: Title & View Angle Toggle (Front View / Back View) */}
      <div className="flex flex-wrap items-center justify-between w-full mb-2 gap-2 z-10">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs text-amber-400 border border-amber-500/30">
            ✨
          </span>
          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
            Salon Digital Human Avatar
          </span>
        </div>

        {showViewToggle && (
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleSetView("front")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeView === "front"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              onClick={() => handleSetView("back")}
              className={`px-3 py-1 rounded-lg transition-all ${
                activeView === "back"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Back View
            </button>
          </div>
        )}
      </div>

      {/* 2. Responsive Salon Digital Human Canvas Viewport */}
      <div className="relative w-full h-[380px] sm:h-[440px] md:h-[490px] select-none my-1 flex items-center justify-center rounded-2xl overflow-hidden border border-neutral-800/80 bg-neutral-950">
        <HighEndSalonAvatarCanvas
          rootsColor={hairPalette.roots.base}
          midColor={hairPalette.midLengths.base}
          endsColor={hairPalette.ends.base}
          rootsGrey={activeState.hair.roots.greyPercentage ?? rootsGrey ?? activeState.hair.greyPercentage ?? greyPercentage}
          midGrey={activeState.hair.midLengths.greyPercentage ?? midGrey ?? activeState.hair.greyPercentage ?? greyPercentage}
          endsGrey={activeState.hair.ends.greyPercentage ?? endsGrey ?? activeState.hair.greyPercentage ?? greyPercentage}
          separateZones={activeState.hair.separateZones}
          blendIntensity={activeState.hair.blendIntensity}
          skinTone={activeSkin}
          skinUndertone={activeState.skin.undertone}
          lighting={activeLight}
          view={activeView}
          activeZone={activeState.activeZone}
          onSelectZone={handleSelectZone}
        />

        {/* Floating Top-Right Active Zone Badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-xl z-20">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
            style={{ backgroundColor: hairPalette[activeState.activeZone].base }}
          />
          <span className="font-black text-amber-400">
            L{currentZoneData.level} • {currentZoneData.tone}
          </span>
        </div>
      </div>

      {/* 3. Skin Tone Selector Bar (Natural Fitzpatrick Presets) */}
      {showSkinToneBar && (
        <div className="w-full mt-2.5 pt-2 border-t border-neutral-800/80 flex flex-col gap-1.5 z-10">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>👤</span> Avatar Skin Tone:
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold capitalize">
              {activeSkin}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {[
              { id: "fair", label: "Fair", color: "#fde8d0" },
              { id: "light", label: "Light", color: "#f5d0a9" },
              { id: "medium", label: "Medium", color: "#d4a373" },
              { id: "olive", label: "Olive", color: "#c49a6c" },
              { id: "tan", label: "Tan", color: "#a67c52" },
              { id: "brown", label: "Brown", color: "#8b5e3c" },
              { id: "dark", label: "Dark", color: "#6b4226" },
              { id: "deep", label: "Deep", color: "#3d2515" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSetSkinTone(t.id as SkinTonePreset)}
                className={`flex items-center gap-1 py-1 px-1.5 rounded-lg border text-[10px] font-bold transition-all ${
                  activeSkin === t.id
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 ring-1 ring-amber-400/50 scale-[1.02]"
                    : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0 ring-1 ring-white/30"
                  style={{ backgroundColor: t.color }}
                />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. Quick Hair Zone Status Badges (Synchronized with 1-Tap Pins) */}
      {showZoneCards && (
        <div className="w-full mt-2 pt-2 border-t border-neutral-800/80 grid grid-cols-3 gap-1.5 z-10">
          <button
            type="button"
            onClick={() => handleSelectZone("roots")}
            className={`p-1.5 rounded-xl border text-left transition-all ${
              activeState.activeZone === "roots"
                ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400 text-white"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hairPalette.roots.base }} />
              <span className="text-[10px] font-bold">1. Roots</span>
            </div>
            <span className="text-[9px] text-amber-300 font-mono block truncate">
              L{activeState.hair.roots.level} {activeState.hair.roots.tone}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectZone("midLengths")}
            className={`p-1.5 rounded-xl border text-left transition-all ${
              activeState.activeZone === "midLengths"
                ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400 text-white"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hairPalette.midLengths.base }} />
              <span className="text-[10px] font-bold">2. Mid</span>
            </div>
            <span className="text-[9px] text-amber-300 font-mono block truncate">
              L{activeState.hair.midLengths.level} {activeState.hair.midLengths.tone}
            </span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectZone("ends")}
            className={`p-1.5 rounded-xl border text-left transition-all ${
              activeState.activeZone === "ends"
                ? "bg-amber-500/15 border-amber-400 ring-1 ring-amber-400 text-white"
                : "bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <div className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: hairPalette.ends.base }} />
              <span className="text-[10px] font-bold">3. Ends</span>
            </div>
            <span className="text-[9px] text-amber-300 font-mono block truncate">
              L{activeState.hair.ends.level} {activeState.hair.ends.tone}
            </span>
          </button>
        </div>
      )}

      {/* 5. Additional Detailed Salon Controls (if explicitly enabled in standalone mode) */}
      {showControls && (
        <AvatarControls
          state={activeState}
          palette={hairPalette}
          onChange={handleStateChange}
          showSkinToneBar={false}
          showViewToggle={false}
          showLightingBar={showLightingBar}
          showZoneCards={false}
          showLevelSlider={showLevelSlider}
          showToneSelector={showToneSelector}
          className="mt-3.5 z-10"
        />
      )}
    </div>
  );
};
