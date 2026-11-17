"use client";

import React from "react";
import { HairRegionInput } from "../../types/assessment";
import { HighLevelRealisticAvatar } from "./HighLevelRealisticAvatar";

interface InteractiveHeadAvatarProps {
  activeRegion: "ROOTS" | "MID_LENGTHS" | "ENDS";
  onSelectRegion: (region: "ROOTS" | "MID_LENGTHS" | "ENDS") => void;
  roots: HairRegionInput;
  midLengths: HairRegionInput;
  ends: HairRegionInput;
  showLightingBar?: boolean;
  className?: string;
}

export function InteractiveHeadAvatar({
  activeRegion,
  onSelectRegion,
  roots,
  midLengths,
  ends,
  showLightingBar = true,
  className = "",
}: InteractiveHeadAvatarProps) {
  return (
    <HighLevelRealisticAvatar
      zoneMode={true}
      activeRegion={activeRegion}
      onSelectRegion={onSelectRegion}
      rootsInput={roots}
      midLengthsInput={midLengths}
      endsInput={ends}
      showSkinToneBar={true}
      showLightingBar={showLightingBar}
      showViewToggle={true}
      showLevelSlider={false}
      className={className}
    />
  );
}
