/**
 * avatar.types.ts
 * Core types for the Nirav Hairstorm Hair Avatar Studio.
 */

import { ToneFamily, ToneIntensity, UniversalLevel } from "../../../types/uhcr";
import { SkinTone } from "../../../constants/skinTones";

export type HairstyleId = "straight" | "wavy" | "curly" | "coily";

export type AvatarView = "front" | "back";

export type HairRegionId = "roots" | "mid_lengths" | "ends";

export type AvatarLightingEnvironment = "SUNLIGHT" | "SALON" | "OFFICE";

export interface RegionColourConfig {
  level: UniversalLevel;
  primaryTone: ToneFamily;
  secondaryTone?: ToneFamily | null;
  intensity?: ToneIntensity;
  customHex?: string;
  isBleached?: boolean;
  greyPercentage?: number;
}

export interface SkinCustomAdjustment {
  melaninDepth: number; // 0.0 (lightest) to 1.0 (deepest)
  warmth: number;       // -1.0 (cool/olive) to +1.0 (warm/golden)
}

export interface AvatarStudioState {
  hairstyle: HairstyleId;
  viewAngle: AvatarView;
  skinTone: SkinTone;
  skinCustom: SkinCustomAdjustment;
  regions: Record<HairRegionId, RegionColourConfig>;
  lighting: AvatarLightingEnvironment;
  zoom: number;         // 1.0x to 3.0x
  pan: { x: number; y: number };
  beforeAfterMode: "split" | "toggle" | "off";
  beforeAfterSplit: number; // 0.0 to 1.0 (e.g. 0.5)
  showOriginal: boolean;
  formulationSynced: boolean;
  loading: boolean;
  error: string | null;
  rendererMode: "webgl2" | "canvas2d";
}

export interface HairstyleMetadata {
  id: HairstyleId;
  name: string;
  subtitle: string;
  description: string;
  typeCode: string;
  curlPattern: string;
  specularExponent: number;
  internalEntrapment: number;
  diffuseDispersion: number;
  coherence: number;
  volumeMultiplier: number;
  strandCaliber: "fine" | "medium" | "coarse";
  thumbnailFront: string;
  thumbnailBack: string;
}

export interface LightingEnvironmentMetadata {
  id: AvatarLightingEnvironment;
  name: string;
  cct: string;
  illuminantStandard: string;
  description: string;
  icon: string;
  colorTempK: number;
  cri: number;
  spectralPeakNm: number;
  glslIndex: number;
}

export interface SkinToneMetadata {
  id: SkinTone;
  name: string;
  fitzpatrick: string;
  monkScale: string;
  hex: string;
  lab: [number, number, number]; // [L*, a*, b*]
  rgb: [number, number, number]; // [0..255, 0..255, 0..255]
  melaninDepth: number;          // 0.0 to 1.0
  warmth: number;                // -1.0 to 1.0
  description: string;
}
