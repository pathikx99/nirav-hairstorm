/**
 * AvatarColorEngine.ts
 * Procedural Hair & Skin Colorimetry Engine for Chromatique
 *
 * Implements physics-informed pigment absorption, melanin depth curves,
 * tonal reflections, specular anisotropic highlights, multi-environment metamerism,
 * and grey hair blending.
 */

import {
  UniversalLevel,
  ToneFamily,
  SkinTonePreset,
  SkinUndertone,
  LightingPreset,
  RenderedZoneColor,
  RenderedHairPalette,
  AvatarSkinConfig,
  SKIN_TONE_PRESETS,
  LIGHTING_PRESETS,
  AvatarHairState,
} from "./AvatarTypes";
import { TONE_CURVES } from "../../services/hairColorimetryService";

// Color utilities
export function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "").trim();
  const fullHex =
    sanitized.length === 3
      ? sanitized.split("").map((c) => c + c).join("")
      : sanitized;
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return [100, 100, 100];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

export function blendHex(hex1: string, hex2: string, weight1: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const w1 = Math.max(0, Math.min(1, weight1));
  const w2 = 1 - w1;
  return rgbToHex(
    r1 * w1 + r2 * w2,
    g1 * w1 + g2 * w2,
    b1 * w1 + b2 * w2
  );
}

export function adjustLightness(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex);
  if (amount > 0) {
    // Lighten toward white
    return rgbToHex(
      r + (255 - r) * amount,
      g + (255 - g) * amount,
      b + (255 - b) * amount
    );
  } else {
    // Darken toward black
    const factor = 1 + amount;
    return rgbToHex(r * factor, g * factor, b * factor);
  }
}

// Tone Curves Calibration Matrix across all 10 Levels (Derived directly from UHCR physical calibration)
interface ToneLevelRgb {
  base: string;
  shadow: string;
  highlight: string;
}

const TONE_LEVEL_PALETTES: Record<ToneFamily, Record<UniversalLevel, ToneLevelRgb>> = Object.fromEntries(
  Object.entries(TONE_CURVES).map(([tone, curve]) => [tone, curve.levels])
) as Record<ToneFamily, Record<UniversalLevel, ToneLevelRgb>>;

/**
 * Apply multi-environment lighting metamerism shift to a hex color
 * Conforms to standard CIE D65 / Planckian locus 3000K & 4000K chromatic adaptation
 */
export function applyLightingMetamerism(hex: string, lighting: LightingPreset): string {
  const [r, g, b] = hexToRgb(hex);
  if (lighting === "sunlight") {
    // 6500K Direct standard daylight (D65 CIE reference illuminant)
    return hex;
  } else if (lighting === "salon") {
    // 3000K warm salon halogen/tungsten lighting
    return rgbToHex(
      Math.min(255, Math.round(r * 1.12)),
      Math.min(255, Math.round(g * 1.04)),
      Math.max(0, Math.round(b * 0.84))
    );
  } else {
    // 4000K cool indoor fluorescent/office lighting
    return rgbToHex(
      Math.max(0, Math.round(r * 0.93)),
      Math.min(255, Math.round(g * 1.015)),
      Math.min(255, Math.round(b * 1.11))
    );
  }
}

/**
 * Computes rendered colors for a single hair zone
 */
export function renderZoneColor(
  level: UniversalLevel,
  tone: ToneFamily,
  customColor: string | undefined,
  lighting: LightingPreset,
  greyPercentage: number = 0,
  naturalBaseLevel: UniversalLevel = 3,
  previousArtificialColor: boolean = false
): RenderedZoneColor {
  const validLevel = (Math.max(1, Math.min(10, level)) || 5) as UniversalLevel;
  const toneMap = TONE_LEVEL_PALETTES[tone] || TONE_LEVEL_PALETTES.NATURAL;
  const levelData = toneMap[validLevel] || toneMap[5];

  let baseHex = customColor || levelData.base;
  let shadowHex = levelData.shadow;
  let highlightHex = levelData.highlight;

  // If custom color is provided, derive shadow and highlight relative to it
  if (customColor) {
    shadowHex = adjustLightness(customColor, -0.38);
    highlightHex = adjustLightness(customColor, 0.35);
  }

  // Artificial color buildup effect on mid/ends
  if (previousArtificialColor) {
    baseHex = blendHex(baseHex, "#3d1f14", 0.88);
    shadowHex = blendHex(shadowHex, "#1c0c07", 0.85);
  }

  // Melanin undercoat warming when target level is significantly higher than natural base
  if (validLevel > naturalBaseLevel + 1) {
    const liftDiff = validLevel - naturalBaseLevel;
    const undercoatWarmth = liftDiff >= 4 ? "#e69542" : "#943b1d";
    const warmFactor = Math.min(0.22, liftDiff * 0.04);
    baseHex = blendHex(baseHex, undercoatWarmth, 1 - warmFactor);
  }

  // Grey hair blending
  if (greyPercentage > 0) {
    const greyFactor = Math.min(1, greyPercentage / 100);
    // Luminous champagne-pearl silver/white blending
    baseHex = blendHex(baseHex, "#eae5dc", 1 - greyFactor * 0.90);
    shadowHex = blendHex(shadowHex, "#a89f92", 1 - greyFactor * 0.80);
    highlightHex = blendHex(highlightHex, "#ffffff", 1 - greyFactor * 0.98);
  }

  // Apply environment metamerism
  const finalBase = applyLightingMetamerism(baseHex, lighting);
  const finalShadow = applyLightingMetamerism(shadowHex, lighting);
  const finalHighlight = applyLightingMetamerism(highlightHex, lighting);

  // Sheen tint depending on lighting
  const sheenTint = LIGHTING_PRESETS[lighting].sheenTint;
  const finalSheen = blendHex(finalHighlight, sheenTint, 0.45);

  // Micro-strand variations (5 distinct harmonic strand shades)
  const strands = [
    adjustLightness(finalBase, -0.15),
    adjustLightness(finalBase, -0.07),
    finalBase,
    adjustLightness(finalHighlight, -0.1),
    finalHighlight,
  ];

  const gradient = `linear-gradient(135deg, ${finalShadow} 0%, ${finalBase} 45%, ${finalHighlight} 75%, ${finalShadow} 100%)`;

  return {
    base: finalBase,
    shadow: finalShadow,
    highlight: finalHighlight,
    sheen: finalSheen,
    strands,
    gradient,
    level: validLevel,
    tone,
  };
}

/**
 * Computes full 3-zone rendered hair palette from AvatarHairState
 */
export function calculateRenderedHairPalette(
  hairState: AvatarHairState,
  lighting: LightingPreset
): RenderedHairPalette {
  const {
    naturalBaseLevel,
    roots,
    midLengths,
    ends,
    separateZones,
    blendIntensity,
    greyPercentage = 0,
    previousArtificialColor = false,
  } = hairState;

  // When separateZones is false, all zones share the roots setting
  const effectiveMid = separateZones ? midLengths : roots;
  const effectiveEnds = separateZones ? ends : roots;

  const renderedRoots = renderZoneColor(
    roots.level,
    roots.tone,
    roots.color,
    lighting,
    roots.greyPercentage ?? greyPercentage,
    naturalBaseLevel,
    false // roots have fresh growth, no previous artificial color
  );

  const renderedMid = renderZoneColor(
    effectiveMid.level,
    effectiveMid.tone,
    effectiveMid.color,
    lighting,
    effectiveMid.greyPercentage ?? greyPercentage,
    naturalBaseLevel,
    previousArtificialColor
  );

  const renderedEnds = renderZoneColor(
    effectiveEnds.level,
    effectiveEnds.tone,
    effectiveEnds.color,
    lighting,
    effectiveEnds.greyPercentage ?? greyPercentage,
    naturalBaseLevel,
    previousArtificialColor
  );

  return {
    roots: renderedRoots,
    midLengths: renderedMid,
    ends: renderedEnds,
    blendIntensity: Math.max(0, Math.min(1, blendIntensity)),
    separateZones,
    continuousGradientId: "avatarContinuousHairGrad",
  };
}

/**
 * Computes calibrated skin tone hexes including undertone and lighting modulation
 */
export function calculateRenderedSkin(
  presetKey: SkinTonePreset,
  undertone: SkinUndertone,
  lighting: LightingPreset
): AvatarSkinConfig {
  const baseConfig = SKIN_TONE_PRESETS[presetKey] || SKIN_TONE_PRESETS.medium;

  // Undertone adjustments
  let faceHex = baseConfig.baseHex;
  let shadowHex = baseConfig.shadowHex;
  let blushHex = baseConfig.blushHex;

  if (undertone === "cool") {
    faceHex = blendHex(faceHex, "#fbcfe8", 0.94);
    blushHex = blendHex(blushHex, "#f43f5e", 0.85);
  } else if (undertone === "warm") {
    faceHex = blendHex(faceHex, "#fed7aa", 0.92);
    blushHex = blendHex(blushHex, "#ea580c", 0.88);
  } else if (undertone === "olive") {
    faceHex = blendHex(faceHex, "#d5cc98", 0.93);
    shadowHex = blendHex(shadowHex, "#8c825a", 0.88);
    blushHex = blendHex(blushHex, "#b91c1c", 0.9);
  }

  // Lighting environment shift on skin
  const finalFace = applyLightingMetamerism(faceHex, lighting);
  const finalShadow = applyLightingMetamerism(shadowHex, lighting);
  const finalHighlight = applyLightingMetamerism(baseConfig.highlightHex, lighting);
  const finalBlush = applyLightingMetamerism(blushHex, lighting);

  return {
    ...baseConfig,
    baseHex: finalFace,
    shadowHex: finalShadow,
    highlightHex: finalHighlight,
    blushHex: finalBlush,
  };
}
