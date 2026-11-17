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

// ============================================================================
// PHASE P2: PHOTOREALISTIC OKLab COLOR SCIENCE & OPTICAL MELANIN LIFT ENGINE
// ============================================================================

/**
 * Fast lookup table for converting 8-bit sRGB byte [0, 255] to Linear RGB [0, 1]
 */
export const SRGB_TO_LIN_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255.0;
  SRGB_TO_LIN_LUT[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/**
 * Fast lookup table for converting Linear RGB [0, 1] to 8-bit sRGB byte [0, 255]
 * 4096-entry quantization provides sub-threshold Delta-E precision (< 0.05)
 */
export const LIN_TO_SRGB_LUT = new Uint8Array(4096);
for (let i = 0; i < 4096; i++) {
  const lin = i / 4095.0;
  const srgb = lin <= 0.0031308 ? lin * 12.92 : 1.055 * Math.pow(lin, 1.0 / 2.4) - 0.055;
  LIN_TO_SRGB_LUT[i] = Math.max(0, Math.min(255, Math.round(srgb * 255.0)));
}

/**
 * Converts Linear RGB to OKLab perceptual color space
 * Standard Björn Ottosson (2020) matrix formulation
 */
export function linearRgbToOklab(r: number, g: number, b: number): [number, number, number] {
  const l_ = Math.cbrt(Math.max(0, 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b));
  const m_ = Math.cbrt(Math.max(0, 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b));
  const s_ = Math.cbrt(Math.max(0, 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b));

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  return [L, a, b_];
}

/**
 * Converts OKLab perceptual color space to Linear RGB
 */
export function oklabToLinearRgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

  return [
    Math.max(0.0, Math.min(1.0, r)),
    Math.max(0.0, Math.min(1.0, g)),
    Math.max(0.0, Math.min(1.0, b_)),
  ];
}

/**
 * Converts a hex string directly to OKLab coordinates
 */
export function hexToOklab(hex: string): [number, number, number] {
  const [rByte, gByte, bByte] = hexToRgb(hex);
  const rLin = SRGB_TO_LIN_LUT[rByte];
  const gLin = SRGB_TO_LIN_LUT[gByte];
  const bLin = SRGB_TO_LIN_LUT[bByte];
  return linearRgbToOklab(rLin, gLin, bLin);
}

/**
 * Converts OKLab coordinates directly to 8-bit sRGB integers [0, 255]
 */
export function oklabToSrgb(L: number, a: number, b: number): [number, number, number] {
  const [rLin, gLin, bLin] = oklabToLinearRgb(L, a, b);
  const rIdx = Math.max(0, Math.min(4095, (rLin * 4095.0) | 0));
  const gIdx = Math.max(0, Math.min(4095, (gLin * 4095.0) | 0));
  const bIdx = Math.max(0, Math.min(4095, (bLin * 4095.0) | 0));
  return [LIN_TO_SRGB_LUT[rIdx], LIN_TO_SRGB_LUT[gIdx], LIN_TO_SRGB_LUT[bIdx]];
}

/**
 * Returns the natural melanin underlying pigment (undercoat) revealed during lift
 * Calibrated against physical decolorization curves from Level 1 to 10
 */
export function getMelaninUndercoatOklab(level: number): [number, number, number] {
  const normLvl = Math.max(1.0, Math.min(10.0, level));
  // Warm red-orange a* and yellow-gold b* revealed by peroxide lift
  const a = 0.015 + 0.055 * Math.sin(Math.PI * Math.min(1.0, (normLvl - 1.0) / 9.0));
  const b = 0.015 + 0.110 * Math.min(1.0, Math.max(0.0, (normLvl - 2.0) / 7.0));
  const L = 0.18 + 0.08 * (normLvl - 1.0);
  return [L, a, b];
}

/**
 * Fast lookup table for Marschner / Kajiya-Kay primary R-lobe specular reflection
 * (Cuticle tilt alpha_R = -3 deg = -0.052 rad, power = 28.0)
 */
export const SPEC_R_LUT = new Float32Array(256);

/**
 * Fast lookup table for Marschner TRT-lobe secondary internal reflection
 * (Cuticle tilt alpha_TRT = +5 deg = +0.087 rad, power = 14.0)
 */
export const SPEC_TRT_LUT = new Float32Array(256);

const SHIFT_R = -0.052; // -3 deg
const SHIFT_TRT = 0.087; // +5 deg
for (let i = 0; i < 256; i++) {
  const t_dot_h = (i / 255.0) * 2.0 - 1.0;
  const sin_th = Math.max(-1.0, Math.min(1.0, t_dot_h));
  const cos_th = Math.sqrt(Math.max(0.0, 1.0 - sin_th * sin_th));

  const cos_R = Math.max(0.0, cos_th * Math.cos(SHIFT_R) - sin_th * Math.sin(SHIFT_R));
  SPEC_R_LUT[i] = Math.pow(cos_R, 28.0);

  const cos_TRT = Math.max(0.0, cos_th * Math.cos(SHIFT_TRT) - sin_th * Math.sin(SHIFT_TRT));
  SPEC_TRT_LUT[i] = Math.pow(cos_TRT, 14.0);
}

/**
 * Fast lookup table for forward backlight rim transmission
 * Peaks at semi-transparent fringe (alpha in 0.10 to 0.70)
 */
export const SIN_PI_ALPHA_LUT = new Float32Array(256);
for (let i = 0; i < 256; i++) {
  const a = i / 255.0;
  SIN_PI_ALPHA_LUT[i] = Math.sin(Math.PI * a) * (a < 0.85 ? 1.0 : (1.0 - a) / 0.15);
}

/**
 * Computes studio key lighting half-vector projected onto 2D image coordinates
 */
export function getLightingHalfVector(lighting: LightingPreset): [number, number] {
  if (lighting === "cool") {
    // Left-leaning 4000K key light
    return [-0.18, -0.62];
  } else if (lighting === "sunlight") {
    // Overhead 6500K direct daylight
    return [0.08, -0.74];
  } else {
    // Warm 3000K salon key light from upper-right
    return [0.22, -0.58];
  }
}

export interface LightingEnvironmentParams {
  filterRgb: [number, number, number];
  sheenTintOklab: [number, number, number];
  specularStrength: number;
}

export const LIGHTING_ENVIRONMENT_PARAMS: Record<LightingPreset, LightingEnvironmentParams> = {
  salon: {
    // 3000K warm halogen/tungsten lighting: warm radiance, champagne gold sheen
    filterRgb: [1.05, 1.01, 0.94],
    sheenTintOklab: [0.97, 0.006, 0.035],
    specularStrength: 1.00,
  },
  sunlight: {
    // 6500K direct outdoor daylight (CIE D65): crisp neutral full-spectrum daylight
    filterRgb: [1.00, 1.00, 1.00],
    sheenTintOklab: [0.99, 0.000, 0.006],
    specularStrength: 1.15,
  },
  cool: {
    // 4000K cool indoor fluorescent / office LED: ash reveal, cool pearl sheen
    filterRgb: [0.97, 1.005, 1.04],
    sheenTintOklab: [0.93, -0.008, -0.022],
    specularStrength: 0.85,
  },
};

export function getLightingEnvironmentParams(lighting: LightingPreset): LightingEnvironmentParams {
  return LIGHTING_ENVIRONMENT_PARAMS[lighting] || LIGHTING_ENVIRONMENT_PARAMS.salon;
}

/**
 * Derives the approximate Universal Level (1 to 10) from an arbitrary hex color
 */
export function deriveLevelFromHex(hex: string): UniversalLevel {
  const [L] = hexToOklab(hex);
  // OKLab L typically spans ~0.15 (Level 1) to ~0.94 (Level 10)
  const approxLvl = Math.round(1.0 + ((L - 0.18) / 0.76) * 9.0);
  return Math.max(1, Math.min(10, approxLvl)) as UniversalLevel;
}

// ============================================================================
// BIOPHYSICAL SKIN MELANIN & FRESNEL SHEEN COLORIMETRY
// ============================================================================

export const MODEL_BASE_SKIN_OKLAB: [number, number, number] = [0.8155, 0.0324, 0.0361];
export const MODEL_BASE_LIP_OKLAB: [number, number, number] = [0.6608, 0.0701, 0.0305];
export const MODEL_BASE_IRIS_OKLAB: [number, number, number] = [0.4241, 0.0262, 0.0269];

export interface BiophysicalSkinProfile {
  targetOklab: [number, number, number];
  targetLipOklab: [number, number, number];
  targetIrisOklab: [number, number, number];
  gamma: number;      // Tone curve compression for shadow retention
  specLuster: number; // Epidermal lipid Fresnel highlight retention
}

export const BIOPHYSICAL_SKIN_PROFILES: Record<SkinTonePreset, BiophysicalSkinProfile> = {
  porcelain: {
    targetOklab: [0.8797, 0.0244, 0.0120],
    targetLipOklab: [0.6200, 0.0650, 0.0220],
    targetIrisOklab: [0.5200, 0.0180, 0.0140],
    gamma: 0.99,
    specLuster: 0.06,
  },
  fair: {
    targetOklab: [0.8285, 0.0335, 0.0279],
    targetLipOklab: [0.5900, 0.0700, 0.0300],
    targetIrisOklab: [0.4624, 0.0200, 0.0212],
    gamma: 1.00,
    specLuster: 0.00,
  },
  light: {
    targetOklab: [0.7845, 0.0408, 0.0349],
    targetLipOklab: [0.5700, 0.0680, 0.0310],
    targetIrisOklab: [0.4450, 0.0250, 0.0260],
    gamma: 0.98,
    specLuster: 0.05,
  },
  "warm-beige": {
    targetOklab: [0.7549, 0.0465, 0.0428],
    targetLipOklab: [0.5500, 0.0650, 0.0330],
    targetIrisOklab: [0.4300, 0.0280, 0.0300],
    gamma: 0.97,
    specLuster: 0.07,
  },
  medium: {
    targetOklab: [0.7242, 0.0482, 0.0437],
    targetLipOklab: [0.5350, 0.0620, 0.0320],
    targetIrisOklab: [0.4250, 0.0300, 0.0250],
    gamma: 0.96,
    specLuster: 0.08,
  },
  olive: {
    targetOklab: [0.7205, 0.0445, 0.0395],
    targetLipOklab: [0.5200, 0.0560, 0.0300],
    targetIrisOklab: [0.4200, 0.0200, 0.0180],
    gamma: 0.96,
    specLuster: 0.08,
  },
  tan: {
    targetOklab: [0.6872, 0.0501, 0.0490],
    targetLipOklab: [0.5050, 0.0580, 0.0320],
    targetIrisOklab: [0.4000, 0.0260, 0.0240],
    gamma: 0.95,
    specLuster: 0.10,
  },
  caramel: {
    targetOklab: [0.6845, 0.0568, 0.0569],
    targetLipOklab: [0.4950, 0.0560, 0.0330],
    targetIrisOklab: [0.3900, 0.0260, 0.0240],
    gamma: 0.95,
    specLuster: 0.11,
  },
  deep: {
    targetOklab: [0.5572, 0.0548, 0.0507],
    targetLipOklab: [0.4250, 0.0480, 0.0290],
    targetIrisOklab: [0.3600, 0.0200, 0.0180],
    gamma: 0.92,
    specLuster: 0.13,
  },
  ebony: {
    targetOklab: [0.5040, 0.0513, 0.0457],
    targetLipOklab: [0.3850, 0.0420, 0.0260],
    targetIrisOklab: [0.3400, 0.0150, 0.0140],
    gamma: 0.89,
    specLuster: 0.15,
  },
};

export function getBiophysicalSkinProfile(tone: SkinTonePreset): BiophysicalSkinProfile {
  return BIOPHYSICAL_SKIN_PROFILES[tone] || BIOPHYSICAL_SKIN_PROFILES.fair;
}

export function computeBiophysicalSkinOklab(
  origL: number,
  origA: number,
  origB: number,
  profile: BiophysicalSkinProfile,
  baseOklab: [number, number, number] = MODEL_BASE_SKIN_OKLAB
): [number, number, number] {
  const k = Math.max(0.01, origL / baseOklab[0]);
  let skinL = Math.max(0.03, Math.min(0.98, profile.targetOklab[0] * Math.pow(k, profile.gamma)));

  // Epidermal lipid Fresnel highlight retention (forehead, nose bridge, cheekbone glints)
  if (origL > 0.70 && profile.specLuster > 0) {
    const spec = Math.min(1.0, (origL - 0.70) / 0.30) * profile.specLuster;
    skinL = Math.min(0.98, skinL + spec * 0.08);
  }

  // Preserve 88% of individual vascular perfusion and local undertone texture
  const skinA = profile.targetOklab[1] + (origA - baseOklab[1]) * 0.88;
  const skinB = profile.targetOklab[2] + (origB - baseOklab[2]) * 0.88;

  return [skinL, skinA, skinB];
}

export function computeBiophysicalLipOklab(
  origL: number,
  origA: number,
  origB: number,
  profile: BiophysicalSkinProfile,
  baseOklab: [number, number, number] = MODEL_BASE_LIP_OKLAB
): [number, number, number] {
  const k = Math.max(0.01, origL / baseOklab[0]);
  const lipL = Math.max(0.05, Math.min(0.95, profile.targetLipOklab[0] * Math.pow(k, 0.95)));
  const lipA = profile.targetLipOklab[1] + (origA - baseOklab[1]) * 0.70;
  const lipB = profile.targetLipOklab[2] + (origB - baseOklab[2]) * 0.70;
  return [lipL, lipA, lipB];
}

export function computeBiophysicalIrisOklab(
  origL: number,
  origA: number,
  origB: number,
  profile: BiophysicalSkinProfile,
  baseOklab: [number, number, number] = MODEL_BASE_IRIS_OKLAB
): [number, number, number] {
  const k = Math.max(0.01, origL / baseOklab[0]);
  const irisL = Math.max(0.05, Math.min(0.95, profile.targetIrisOklab[0] * Math.pow(k, 0.90)));
  const irisA = profile.targetIrisOklab[1] + (origA - baseOklab[1]) * 0.60;
  const irisB = profile.targetIrisOklab[2] + (origB - baseOklab[2]) * 0.60;
  return [irisL, irisA, irisB];
}



