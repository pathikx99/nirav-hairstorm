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

// Tone Curves Calibration Matrix across all 10 Levels
interface ToneLevelRgb {
  base: string;
  shadow: string;
  highlight: string;
}

const TONE_LEVEL_PALETTES: Record<ToneFamily, Record<UniversalLevel, ToneLevelRgb>> = {
  NATURAL: {
    1: { base: "#0d0d10", shadow: "#050507", highlight: "#1e1e24" },
    2: { base: "#1c140e", shadow: "#0d0906", highlight: "#33261a" },
    3: { base: "#2d1c13", shadow: "#170e09", highlight: "#482f21" },
    4: { base: "#422c1d", shadow: "#24180f", highlight: "#61442f" },
    5: { base: "#5c3e29", shadow: "#382517", highlight: "#825d41" },
    6: { base: "#7a583e", shadow: "#4e3624", highlight: "#a67c5b" },
    7: { base: "#9c7655", shadow: "#694e36", highlight: "#c79e76" },
    8: { base: "#c29c73", shadow: "#886949", highlight: "#edd0aa" },
    9: { base: "#debf98", shadow: "#a58966", highlight: "#faedd8" },
    10: { base: "#f4e3cd", shadow: "#c5b198", highlight: "#ffffff" },
  },
  ASH: {
    1: { base: "#0a0c10", shadow: "#030406", highlight: "#191d26" },
    2: { base: "#14171d", shadow: "#08090d", highlight: "#2a303d" },
    3: { base: "#20242c", shadow: "#101217", highlight: "#3c4454" },
    4: { base: "#2f3642", shadow: "#191d24", highlight: "#505c70" },
    5: { base: "#404a59", shadow: "#242a33", highlight: "#68768e" },
    6: { base: "#546175", shadow: "#333b47", highlight: "#8292ae" },
    7: { base: "#6b7a94", shadow: "#434d5e", highlight: "#9eafcc" },
    8: { base: "#8797b3", shadow: "#596477", highlight: "#bccff2" },
    9: { base: "#aab8d4", shadow: "#748199", highlight: "#d8e4fa" },
    10: { base: "#cdd8eb", shadow: "#9aa6bd", highlight: "#f2f6fc" },
  },
  BEIGE: {
    1: { base: "#100e0a", shadow: "#060503", highlight: "#221d16" },
    2: { base: "#1d1913", shadow: "#0d0b07", highlight: "#383126" },
    3: { base: "#2e271d", shadow: "#16120d", highlight: "#4f4433" },
    4: { base: "#423829", shadow: "#241e15", highlight: "#6b5d44" },
    5: { base: "#594d37", shadow: "#332c1e", highlight: "#877656" },
    6: { base: "#736448", shadow: "#453b2a", highlight: "#a69269" },
    7: { base: "#917f5c", shadow: "#5b4e38", highlight: "#c4ae80" },
    8: { base: "#b29e76", shadow: "#77674b", highlight: "#dfcaa0" },
    9: { base: "#d1c099", shadow: "#968766", highlight: "#f5e8c4" },
    10: { base: "#ede0be", shadow: "#baa987", highlight: "#fff8e2" },
  },
  GOLD: {
    1: { base: "#121008", shadow: "#070603", highlight: "#282212" },
    2: { base: "#211a0d", shadow: "#120e06", highlight: "#3f3317" },
    3: { base: "#332710", shadow: "#1c1507", highlight: "#5c471a" },
    4: { base: "#4d3914", shadow: "#2c1f08", highlight: "#7a5c1e" },
    5: { base: "#6e5218", shadow: "#402f0b", highlight: "#9e7924" },
    6: { base: "#946f1d", shadow: "#59420d", highlight: "#c4982f" },
    7: { base: "#b88c25", shadow: "#785811", highlight: "#e5b43d" },
    8: { base: "#dba935", shadow: "#947119", highlight: "#f7cf65" },
    9: { base: "#ecc55d", shadow: "#ab8a2f", highlight: "#fae59b" },
    10: { base: "#f7df8f", shadow: "#c2ab5b", highlight: "#fff7cc" },
  },
  COPPER: {
    1: { base: "#140c08", shadow: "#080402", highlight: "#2c1911" },
    2: { base: "#241209", shadow: "#120703", highlight: "#451e0f" },
    3: { base: "#3b1a0d", shadow: "#210c04", highlight: "#662a12" },
    4: { base: "#572410", shadow: "#331205", highlight: "#8d3917" },
    5: { base: "#7a3112", shadow: "#471a06", highlight: "#b84c1b" },
    6: { base: "#a34316", shadow: "#632609", highlight: "#de6223" },
    7: { base: "#c9551c", shadow: "#80340d", highlight: "#f27a3a" },
    8: { base: "#e67332", shadow: "#9c4a1b", highlight: "#f79e68" },
    9: { base: "#f29863", shadow: "#b3683b", highlight: "#fcc19d" },
    10: { base: "#fac29e", shadow: "#cfa180", highlight: "#fde5d5" },
  },
  RED: {
    1: { base: "#14080a", shadow: "#080203", highlight: "#2b1014" },
    2: { base: "#240b10", shadow: "#120306", highlight: "#47131d" },
    3: { base: "#3d0e17", shadow: "#21050a", highlight: "#6b1827" },
    4: { base: "#5c1320", shadow: "#33080f", highlight: "#941e33" },
    5: { base: "#801729", shadow: "#470b14", highlight: "#bd243d" },
    6: { base: "#a81e35", shadow: "#660d1d", highlight: "#e3324f" },
    7: { base: "#cc2b47", shadow: "#87162b", highlight: "#f05b73" },
    8: { base: "#e34b65", shadow: "#a1293e", highlight: "#f58296" },
    9: { base: "#f07a90", shadow: "#b84b60", highlight: "#fab5c2" },
    10: { base: "#f7b2c0", shadow: "#cc8594", highlight: "#fde3e8" },
  },
  VIOLET: {
    1: { base: "#0f0814", shadow: "#060208", highlight: "#23122c" },
    2: { base: "#1c0c26", shadow: "#0c0412", highlight: "#3c1850" },
    3: { base: "#2d123d", shadow: "#160621", highlight: "#562173" },
    4: { base: "#441a5c", shadow: "#240a33", highlight: "#742c9b" },
    5: { base: "#5e2380", shadow: "#330f47", highlight: "#9639cc" },
    6: { base: "#7a2fa6", shadow: "#471863", highlight: "#b84df7" },
    7: { base: "#9942cf", shadow: "#5f2482", highlight: "#cb72fa" },
    8: { base: "#b66bf0", shadow: "#7b41a6", highlight: "#dd9eff" },
    9: { base: "#d29eff", shadow: "#996ec2", highlight: "#f0d4ff" },
    10: { base: "#e8caff", shadow: "#bfa0db", highlight: "#faf0ff" },
  },
  MAHOGANY: {
    1: { base: "#12080c", shadow: "#060204", highlight: "#261019" },
    2: { base: "#1f0c14", shadow: "#0d0307", highlight: "#3c1626" },
    3: { base: "#33121f", shadow: "#1a060e", highlight: "#571e35" },
    4: { base: "#4d192c", shadow: "#290915", highlight: "#782744" },
    5: { base: "#69203b", shadow: "#380d1e", highlight: "#992e54" },
    6: { base: "#872b4b", shadow: "#4d1329", highlight: "#b83d67" },
    7: { base: "#a63a5f", shadow: "#661e38", highlight: "#d45780" },
    8: { base: "#bf567b", shadow: "#803551", highlight: "#e880a1" },
    9: { base: "#d67d9d", shadow: "#99526d", highlight: "#f2acc4" },
    10: { base: "#e8acc3", shadow: "#b88295", highlight: "#fcdce6" },
  },
  PEARL: {
    1: { base: "#0b0b12", shadow: "#040407", highlight: "#1c1c2a" },
    2: { base: "#151521", shadow: "#08080f", highlight: "#2b2b41" },
    3: { base: "#212133", shadow: "#10101c", highlight: "#3e3e5d" },
    4: { base: "#303047", shadow: "#191926", highlight: "#525279" },
    5: { base: "#424261", shadow: "#242436", highlight: "#6b6b98" },
    6: { base: "#595980", shadow: "#33334d", highlight: "#8787be" },
    7: { base: "#72729e", shadow: "#464663", highlight: "#a3a3da" },
    8: { base: "#8f8fc2", shadow: "#5d5d82", highlight: "#c2c2f9" },
    9: { base: "#b0b0e0", shadow: "#7a7aa3", highlight: "#dedeff" },
    10: { base: "#d2d2fa", shadow: "#9e9ec7", highlight: "#f5f5ff" },
  },
  GREEN: { // Matte
    1: { base: "#0a100c", shadow: "#030604", highlight: "#17231a" },
    2: { base: "#121c15", shadow: "#070d09", highlight: "#25372a" },
    3: { base: "#1b291f", shadow: "#0d1710", highlight: "#364e3c" },
    4: { base: "#273b2d", shadow: "#142118", highlight: "#4a6d53" },
    5: { base: "#36523e", shadow: "#1f3024", highlight: "#608e6c" },
    6: { base: "#476b52", shadow: "#2b4232", highlight: "#78b48a" },
    7: { base: "#5d8768", shadow: "#3a5441", highlight: "#94d5a4" },
    8: { base: "#77a683", shadow: "#4d6e55", highlight: "#b0efbf" },
    9: { base: "#98c4a3", shadow: "#668a6f", highlight: "#d0fade" },
    10: { base: "#bee3c7", shadow: "#88ab90", highlight: "#e8faee" },
  },
  // Fallbacks for UHCR extended types
  BLUE: {
    1: { base: "#080d14", shadow: "#020408", highlight: "#132133" },
    2: { base: "#0f1926", shadow: "#060b12", highlight: "#20344d" },
    3: { base: "#162538", shadow: "#0a121c", highlight: "#2d476b" },
    4: { base: "#1f334d", shadow: "#0f1c2b", highlight: "#3c5e8c" },
    5: { base: "#2a4466", shadow: "#16263b", highlight: "#4d76ad" },
    6: { base: "#375782", shadow: "#1f334f", highlight: "#6191cc" },
    7: { base: "#486ea3", shadow: "#2b4569", highlight: "#7aace8" },
    8: { base: "#5f8cc9", shadow: "#3c5e8a", highlight: "#9bc4fa" },
    9: { base: "#82acf0", shadow: "#5579ad", highlight: "#c2dcff" },
    10: { base: "#b0ccfa", shadow: "#7d9ecd", highlight: "#ebf3ff" },
  },
  YELLOW: {
    1: { base: "#121008", shadow: "#070603", highlight: "#282212" },
    2: { base: "#211a0d", shadow: "#120e06", highlight: "#3f3317" },
    3: { base: "#332710", shadow: "#1c1507", highlight: "#5c471a" },
    4: { base: "#4d3914", shadow: "#2c1f08", highlight: "#7a5c1e" },
    5: { base: "#6e5218", shadow: "#402f0b", highlight: "#9e7924" },
    6: { base: "#946f1d", shadow: "#59420d", highlight: "#c4982f" },
    7: { base: "#b88c25", shadow: "#785811", highlight: "#e5b43d" },
    8: { base: "#dba935", shadow: "#947119", highlight: "#f7cf65" },
    9: { base: "#ecc55d", shadow: "#ab8a2f", highlight: "#fae59b" },
    10: { base: "#f7df8f", shadow: "#c2ab5b", highlight: "#fff7cc" },
  },
  ORANGE: {
    1: { base: "#140c08", shadow: "#080402", highlight: "#2c1911" },
    2: { base: "#241209", shadow: "#120703", highlight: "#451e0f" },
    3: { base: "#3b1a0d", shadow: "#210c04", highlight: "#662a12" },
    4: { base: "#572410", shadow: "#331205", highlight: "#8d3917" },
    5: { base: "#7a3112", shadow: "#471a06", highlight: "#b84c1b" },
    6: { base: "#a34316", shadow: "#632609", highlight: "#de6223" },
    7: { base: "#c9551c", shadow: "#80340d", highlight: "#f27a3a" },
    8: { base: "#e67332", shadow: "#9c4a1b", highlight: "#f79e68" },
    9: { base: "#f29863", shadow: "#b3683b", highlight: "#fcc19d" },
    10: { base: "#fac29e", shadow: "#cfa180", highlight: "#fde5d5" },
  },
  PINK: {
    1: { base: "#14080d", shadow: "#080205", highlight: "#2b101d" },
    2: { base: "#240b17", shadow: "#12030a", highlight: "#47132e" },
    3: { base: "#3d0e25", shadow: "#210513", highlight: "#6b1842" },
    4: { base: "#5c1339", shadow: "#33081e", highlight: "#941e5d" },
    5: { base: "#801750", shadow: "#470b2b", highlight: "#bd2478" },
    6: { base: "#a81e6a", shadow: "#660d3e", highlight: "#e33292" },
    7: { base: "#cc2b84", shadow: "#871654", highlight: "#f05bb0" },
    8: { base: "#e34ba1", shadow: "#a12970", highlight: "#f582c3" },
    9: { base: "#f07abd", shadow: "#b84b8e", highlight: "#fab5dc" },
    10: { base: "#f7b2db", shadow: "#cc85af", highlight: "#fde3f2" },
  },
  MIXED: {
    1: { base: "#0d0d10", shadow: "#050507", highlight: "#1e1e24" },
    2: { base: "#1c140e", shadow: "#0d0906", highlight: "#33261a" },
    3: { base: "#2d1c13", shadow: "#170e09", highlight: "#482f21" },
    4: { base: "#422c1d", shadow: "#24180f", highlight: "#61442f" },
    5: { base: "#5c3e29", shadow: "#382517", highlight: "#825d41" },
    6: { base: "#7a583e", shadow: "#4e3624", highlight: "#a67c5b" },
    7: { base: "#9c7655", shadow: "#694e36", highlight: "#c79e76" },
    8: { base: "#c29c73", shadow: "#886949", highlight: "#edd0aa" },
    9: { base: "#debf98", shadow: "#a58966", highlight: "#faedd8" },
    10: { base: "#f4e3cd", shadow: "#c5b198", highlight: "#ffffff" },
  },
  UNKNOWN: {
    1: { base: "#0d0d10", shadow: "#050507", highlight: "#1e1e24" },
    2: { base: "#1c140e", shadow: "#0d0906", highlight: "#33261a" },
    3: { base: "#2d1c13", shadow: "#170e09", highlight: "#482f21" },
    4: { base: "#422c1d", shadow: "#24180f", highlight: "#61442f" },
    5: { base: "#5c3e29", shadow: "#382517", highlight: "#825d41" },
    6: { base: "#7a583e", shadow: "#4e3624", highlight: "#a67c5b" },
    7: { base: "#9c7655", shadow: "#694e36", highlight: "#c79e76" },
    8: { base: "#c29c73", shadow: "#886949", highlight: "#edd0aa" },
    9: { base: "#debf98", shadow: "#a58966", highlight: "#faedd8" },
    10: { base: "#f4e3cd", shadow: "#c5b198", highlight: "#ffffff" },
  },
};

/**
 * Apply multi-environment lighting metamerism shift to a hex color
 */
export function applyLightingMetamerism(hex: string, lighting: LightingPreset): string {
  const [r, g, b] = hexToRgb(hex);
  if (lighting === "sunlight") {
    // 6500K: high sunlight vibrancy, slight warm specular lift
    const rShift = Math.min(255, r * 1.05 + 4);
    const gShift = Math.min(255, g * 1.03 + 2);
    const bShift = Math.min(255, b * 0.98);
    return rgbToHex(rShift, gShift, bShift);
  } else if (lighting === "salon") {
    // 3000K: warm professional tungsten/salon lighting
    const rShift = Math.min(255, r * 1.04 + 3);
    const gShift = Math.min(255, g * 1.01 + 1);
    const bShift = Math.max(0, b * 0.94 - 2);
    return rgbToHex(rShift, gShift, bShift);
  } else {
    // 4000K: cool indoor, slightly bluer ambient
    const rShift = Math.max(0, r * 0.96 - 2);
    const gShift = Math.min(255, g * 0.99 + 1);
    const bShift = Math.min(255, b * 1.06 + 5);
    return rgbToHex(rShift, gShift, bShift);
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
