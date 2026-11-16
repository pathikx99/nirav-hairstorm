"use client";

import React from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import { HairRegionInput } from "../../types/assessment";
import { SkinTone } from "../../constants/skinTones";
import { LightingMode, useApp, ViewAngle } from "../../context/AppContext";
import {
  HairAvatar,
  HairZoneId,
  SkinTonePreset,
  LightingPreset,
  AvatarView,
} from "../Avatar";

export type AvatarZone = "ROOTS" | "MID_LENGTHS" | "ENDS";

export interface HighLevelRealisticAvatarProps {
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
  rootsGrey?: number;
  midGrey?: number;
  endsGrey?: number;
  greyPercentage?: number;
  skinTone?: SkinTone;
  onSkinToneChange?: (tone: SkinTone) => void;
  lightingMode?: LightingMode;
  onLightingModeChange?: (mode: LightingMode) => void;
  viewAngle?: ViewAngle;
  onViewAngleChange?: (angle: ViewAngle) => void;
  onLevelChange?: (newLevel: UniversalLevel) => void;
  showControls?: boolean;
  showSkinToneBar?: boolean;
  showViewToggle?: boolean;
  showLevelSlider?: boolean;
  className?: string;
}

export function HighLevelRealisticAvatar({
  level = 1,
  primaryTone = "NATURAL",
  secondaryTone = null,
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
  rootsGrey,
  midGrey,
  endsGrey,
  greyPercentage,
  skinTone: propSkinTone,
  onSkinToneChange,
  lightingMode: propLightingMode,
  onLightingModeChange,
  viewAngle: propViewAngle,
  onViewAngleChange,
  onLevelChange,
  showControls = false,
  showSkinToneBar = true,
  showViewToggle = true,
  showLevelSlider = true,
  className = "",
}: HighLevelRealisticAvatarProps) {
  const context = useApp();

  const activeSkinTone = (propSkinTone ?? context.skinTone ?? "MEDIUM") as SkinTone;
  const activeLighting = (propLightingMode ?? context.lightingMode ?? "DAYLIGHT") as LightingMode;
  const activeView = (propViewAngle ?? context.viewAngle ?? "FRONT") as ViewAngle;
  const activeTech = technique ?? context.activeTechnique ?? "ALL_OVER";

  // Map active skin tone to SkinTonePreset
  const mappedSkinTone: SkinTonePreset =
    activeSkinTone === "PORCELAIN"
      ? "porcelain"
      : activeSkinTone === "ALABASTER"
      ? "alabaster"
      : activeSkinTone === "VERY_FAIR"
      ? "very-fair"
      : activeSkinTone === "FAIR"
      ? "fair"
      : activeSkinTone === "PEACH"
      ? "peach"
      : activeSkinTone === "LIGHT"
      ? "light"
      : activeSkinTone === "WARM_BEIGE"
      ? "warm-beige"
      : activeSkinTone === "HONEY"
      ? "honey"
      : activeSkinTone === "GOLDEN"
      ? "golden"
      : activeSkinTone === "MEDIUM"
      ? "medium"
      : activeSkinTone === "OLIVE"
      ? "olive"
      : activeSkinTone === "BRONZE"
      ? "bronze"
      : activeSkinTone === "TAN"
      ? "tan"
      : activeSkinTone === "CARAMEL"
      ? "caramel"
      : activeSkinTone === "BROWN"
      ? "brown"
      : activeSkinTone === "DARK"
      ? "dark"
      : activeSkinTone === "ESPRESSO"
      ? "espresso"
      : activeSkinTone === "DEEP"
      ? "deep"
      : activeSkinTone === "EBONY"
      ? "ebony"
      : "fair";

  // Map lighting to LightingPreset
  const mappedLighting: LightingPreset =
    activeLighting === "WARM"
      ? "salon"
      : activeLighting === "COOL"
      ? "cool"
      : "sunlight";

  // Map view angle
  const mappedView: AvatarView = activeView === "BACK" ? "back" : "front";

  // Map active zone
  const mappedActiveZone: HairZoneId =
    activeRegion === "ROOTS"
      ? "roots"
      : activeRegion === "MID_LENGTHS"
      ? "midLengths"
      : activeRegion === "ENDS"
      ? "ends"
      : "roots";

  // Calculate zone levels and tones based on technique, zoneMode, or custom overrides
  let rootsLvl: UniversalLevel = (customRootsLevel ?? level) as UniversalLevel;
  let rootsTn: ToneFamily = customRootsTone ?? primaryTone;
  let midLvl: UniversalLevel = (customMidLevel ?? level) as UniversalLevel;
  let midTn: ToneFamily = customMidTone ?? (secondaryTone || primaryTone);
  let endsLvl: UniversalLevel = (customEndsLevel ?? level) as UniversalLevel;
  let endsTn: ToneFamily = customEndsTone ?? (secondaryTone || primaryTone);

  let separate = false;
  let blendIntensity = 0.5;

  if (zoneMode && rootsInput && midLengthsInput && endsInput) {
    separate = true;
    rootsLvl = (rootsInput.observed_level || 1) as UniversalLevel;
    rootsTn = (rootsInput.observed_undertone as ToneFamily) || "NATURAL";
    midLvl = (midLengthsInput.observed_level || 1) as UniversalLevel;
    midTn = (midLengthsInput.observed_undertone as ToneFamily) || "NATURAL";
    endsLvl = (endsInput.observed_level || 1) as UniversalLevel;
    endsTn = (endsInput.observed_undertone as ToneFamily) || "NATURAL";
  } else if (activeTech === "SHADOW_ROOT") {
    separate = true;
    rootsLvl = Math.max(1, level - 2) as UniversalLevel;
    rootsTn = "NATURAL";
    blendIntensity = 0.35;
  } else if (activeTech === "COLOR_MELT") {
    separate = true;
    rootsLvl = Math.max(1, level - 2) as UniversalLevel;
    endsLvl = Math.min(10, level + 1) as UniversalLevel;
    blendIntensity = 0.75;
  } else if (
    customRootsLevel ||
    customMidLevel ||
    customEndsLevel ||
    customRootsTone ||
    customMidTone ||
    customEndsTone ||
    customRootsColor ||
    customMidColor ||
    customEndsColor
  ) {
    separate = true;
  }

  // Handle region select callback
  const handleSelectRegion = (region: HairZoneId) => {
    const legacyRegion: AvatarZone =
      region === "roots"
        ? "ROOTS"
        : region === "midLengths"
        ? "MID_LENGTHS"
        : "ENDS";
    onSelectRegion?.(legacyRegion);
  };

  // Handle view change callback (synchronizing context & parent so view never snaps back)
  const handleViewChange = (v: AvatarView) => {
    const legacyView: ViewAngle = v === "back" ? "BACK" : "FRONT";
    context.setViewAngle(legacyView);
    onViewAngleChange?.(legacyView);
  };

  // Handle skin tone change callback
  const handleSkinChange = (s: SkinTonePreset) => {
    const legacySkin: SkinTone = (
      s === "porcelain"
        ? "PORCELAIN"
        : s === "alabaster"
        ? "ALABASTER"
        : s === "very-fair"
        ? "VERY_FAIR"
        : s === "fair"
        ? "FAIR"
        : s === "peach"
        ? "PEACH"
        : s === "light"
        ? "LIGHT"
        : s === "warm-beige"
        ? "WARM_BEIGE"
        : s === "honey"
        ? "HONEY"
        : s === "medium"
        ? "MEDIUM"
        : s === "olive"
        ? "OLIVE"
        : s === "tan"
        ? "TAN"
        : s === "caramel"
        ? "CARAMEL"
        : s === "brown"
        ? "BROWN"
        : s === "dark"
        ? "DARK"
        : s === "espresso"
        ? "ESPRESSO"
        : "DEEP"
    ) as SkinTone;
    context.setSkinTone(legacySkin);
    onSkinToneChange?.(legacySkin);
  };

  // Handle lighting change callback
  const handleLightingChange = (l: LightingPreset) => {
    const legacyLight: LightingMode =
      l === "salon" ? "WARM" : l === "cool" ? "COOL" : "DAYLIGHT";
    context.setLightingMode(legacyLight);
    onLightingModeChange?.(legacyLight);
  };

  return (
    <HairAvatar
      level={level}
      primaryTone={primaryTone}
      secondaryTone={secondaryTone}
      rootsLevel={rootsLvl}
      rootsTone={rootsTn}
      rootsColor={customRootsColor}
      midLevel={midLvl}
      midTone={midTn}
      midColor={customMidColor}
      endsLevel={endsLvl}
      endsTone={endsTn}
      endsColor={customEndsColor}
      separateZones={separate}
      blendIntensity={blendIntensity}
      rootsGrey={rootsGrey ?? (zoneMode ? rootsInput?.grey_percentage || 0 : greyPercentage ?? 0)}
      midGrey={midGrey ?? (zoneMode ? midLengthsInput?.grey_percentage || 0 : greyPercentage ?? 0)}
      endsGrey={endsGrey ?? (zoneMode ? endsInput?.grey_percentage || 0 : greyPercentage ?? 0)}
      greyPercentage={greyPercentage ?? (zoneMode ? rootsInput?.grey_percentage || 0 : 0)}
      skinTone={mappedSkinTone}
      onSkinToneChange={handleSkinChange}
      lightingMode={mappedLighting}
      onLightingModeChange={handleLightingChange}
      viewAngle={mappedView}
      onViewAngleChange={handleViewChange}
      activeRegion={mappedActiveZone}
      onSelectRegion={handleSelectRegion}
      showControls={showControls}
      showSkinToneBar={showSkinToneBar}
      showViewToggle={showViewToggle}
      showLevelSlider={showLevelSlider}
      className={className}
    />
  );
}
