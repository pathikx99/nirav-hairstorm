"use client";

import React from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import { HairRegionInput } from "../../types/assessment";
import { LightingMode, ViewAngle } from "../../context/AppContext";
import { SkinTone } from "../../constants/skinTones";
import {
  HighLevelRealisticAvatar,
  AvatarZone,
} from "./HighLevelRealisticAvatar";

export type { AvatarZone };

export interface RealisticAvatarProps {
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

export function RealisticAvatar(props: RealisticAvatarProps) {
  return (
    <HighLevelRealisticAvatar
      level={props.level}
      primaryTone={props.primaryTone}
      secondaryTone={props.secondaryTone}
      intensity={props.intensity}
      technique={props.technique}
      zoneMode={props.zoneMode}
      activeRegion={props.activeRegion}
      onSelectRegion={props.onSelectRegion}
      rootsInput={props.rootsInput}
      midLengthsInput={props.midLengthsInput}
      endsInput={props.endsInput}
      customRootsLevel={props.customRootsLevel}
      customRootsTone={props.customRootsTone}
      customMidLevel={props.customMidLevel}
      customMidTone={props.customMidTone}
      customEndsLevel={props.customEndsLevel}
      customEndsTone={props.customEndsTone}
      customRootsColor={props.customRootsColor}
      customMidColor={props.customMidColor}
      customEndsColor={props.customEndsColor}
      rootsGrey={props.rootsGrey}
      midGrey={props.midGrey}
      endsGrey={props.endsGrey}
      greyPercentage={props.greyPercentage}
      skinTone={props.skinTone}
      onSkinToneChange={props.onSkinToneChange}
      lightingMode={props.lightingMode}
      onLightingModeChange={props.onLightingModeChange}
      viewAngle={props.viewAngle}
      onViewAngleChange={props.onViewAngleChange}
      onLevelChange={props.onLevelChange}
      showControls={props.showControls ?? false}
      showSkinToneBar={props.showSkinToneBar ?? true}
      showViewToggle={props.showViewToggle ?? true}
      showLevelSlider={props.showLevelSlider ?? true}
      className={props.className}
    />
  );
}
