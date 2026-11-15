"use client";

import React from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import { RealisticAvatar } from "./RealisticAvatar";

interface AnimatedCartoonAvatarProps {
  level: UniversalLevel;
  primaryTone: ToneFamily;
  secondaryTone?: ToneFamily | null;
  intensity?: ToneIntensity;
  technique?: ApplicationTechnique;
  customRootsColor?: string;
  customMidColor?: string;
  customEndsColor?: string;
  onLevelChange?: (newLevel: UniversalLevel) => void;
  className?: string;
}

export function AnimatedCartoonAvatar({
  level,
  primaryTone,
  secondaryTone,
  intensity = "STANDARD",
  technique,
  customRootsColor,
  customMidColor,
  customEndsColor,
  onLevelChange,
  className = "",
}: AnimatedCartoonAvatarProps) {
  return (
    <RealisticAvatar
      level={level}
      primaryTone={primaryTone}
      secondaryTone={secondaryTone}
      intensity={intensity}
      technique={technique}
      customRootsColor={customRootsColor}
      customMidColor={customMidColor}
      customEndsColor={customEndsColor}
      onLevelChange={onLevelChange}
      showLevelSlider={true}
      showSkinToneBar={true}
      showViewToggle={true}
      className={className}
    />
  );
}
