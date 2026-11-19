/**
 * skinTonePalette.ts
 * 10-Tone Photorealistic Dermal Melanin Scale for Nirav Hairstorm Avatar.
 * Conforms to the Monk Skin Tone (MST) scale and Fitzpatrick Phototypes I–VI.
 */

import { SkinTone } from "../../../constants/skinTones";
import { SkinCustomAdjustment, SkinToneMetadata } from "../types/avatar.types";

export const SKIN_TONE_PALETTE: Record<SkinTone, SkinToneMetadata> = {
  PORCELAIN: {
    id: "PORCELAIN",
    name: "Porcelain",
    fitzpatrick: "Type I",
    monkScale: "MST 01",
    hex: "#f7ded0",
    lab: [88.5, 7.8, 10.2],
    rgb: [247, 222, 208],
    melaninDepth: 0.05,
    warmth: 0.1,
    description: "Extremely fair ivory with subtle cool rose undertones.",
  },
  FAIR: {
    id: "FAIR",
    name: "Fair",
    fitzpatrick: "Type II",
    monkScale: "MST 02",
    hex: "#edd0be",
    lab: [83.0, 9.2, 13.5],
    rgb: [237, 208, 190],
    melaninDepth: 0.15,
    warmth: 0.2,
    description: "Light alabaster complexion with soft peach undertones.",
  },
  LIGHT: {
    id: "LIGHT",
    name: "Light",
    fitzpatrick: "Type II–III",
    monkScale: "MST 03",
    hex: "#e2beaa",
    lab: [77.5, 11.0, 16.8],
    rgb: [226, 190, 170],
    melaninDepth: 0.25,
    warmth: 0.3,
    description: "Soft warm beige with neutral-golden undertones.",
  },
  WARM_BEIGE: {
    id: "WARM_BEIGE",
    name: "Warm Beige",
    fitzpatrick: "Type III",
    monkScale: "MST 04",
    hex: "#d3aa93",
    lab: [71.0, 12.5, 19.4],
    rgb: [211, 170, 147],
    melaninDepth: 0.35,
    warmth: 0.45,
    description: "Golden sand / light olive with radiant warm undertones.",
  },
  MEDIUM: {
    id: "MEDIUM",
    name: "Medium",
    fitzpatrick: "Type III–IV",
    monkScale: "MST 05",
    hex: "#c3977e",
    lab: [64.0, 13.8, 21.5],
    rgb: [195, 151, 126],
    melaninDepth: 0.48,
    warmth: 0.4,
    description: "Native avatar consultation tone — balanced neutral olive-beige.",
  },
  OLIVE: {
    id: "OLIVE",
    name: "Olive",
    fitzpatrick: "Type IV",
    monkScale: "MST 06",
    hex: "#b2856a",
    lab: [58.0, 14.5, 22.8],
    rgb: [178, 133, 106],
    melaninDepth: 0.58,
    warmth: 0.1, // Slight greenish/cool undertone
    description: "Mediterranean / Latin warm olive with green-gold undertones.",
  },
  TAN: {
    id: "TAN",
    name: "Tan",
    fitzpatrick: "Type IV–V",
    monkScale: "MST 07",
    hex: "#9e7156",
    lab: [51.0, 15.2, 23.6],
    rgb: [158, 113, 86],
    melaninDepth: 0.68,
    warmth: 0.5,
    description: "Rich sun-kissed bronze with golden-copper undertones.",
  },
  CARAMEL: {
    id: "CARAMEL",
    name: "Caramel",
    fitzpatrick: "Type V",
    monkScale: "MST 08",
    hex: "#875b42",
    lab: [43.0, 15.6, 22.4],
    rgb: [135, 91, 66],
    melaninDepth: 0.78,
    warmth: 0.4,
    description: "Deep golden caramel and warm amber brown.",
  },
  DEEP: {
    id: "DEEP",
    name: "Deep",
    fitzpatrick: "Type V–VI",
    monkScale: "MST 09",
    hex: "#69422e",
    lab: [33.5, 14.8, 19.5],
    rgb: [105, 66, 46],
    melaninDepth: 0.88,
    warmth: 0.25,
    description: "Rich espresso brown with glowing copper undertones.",
  },
  EBONY: {
    id: "EBONY",
    name: "Ebony",
    fitzpatrick: "Type VI",
    monkScale: "MST 10",
    hex: "#4b2b1d",
    lab: [23.0, 12.0, 14.8],
    rgb: [75, 43, 29],
    melaninDepth: 0.98,
    warmth: 0.1,
    description: "Deepest dark obsidian with cool blue-black / neutral mahogany undertones.",
  },
};

export const SKIN_TONE_ORDER: SkinTone[] = [
  "PORCELAIN",
  "FAIR",
  "LIGHT",
  "WARM_BEIGE",
  "MEDIUM",
  "OLIVE",
  "TAN",
  "CARAMEL",
  "DEEP",
  "EBONY",
];

export function getSkinToneMetadata(id: SkinTone): SkinToneMetadata {
  return SKIN_TONE_PALETTE[id] || SKIN_TONE_PALETTE.MEDIUM;
}

/**
 * Computes calibrated linear RGB [0..1] with continuous melanin depth and warmth modification.
 */
export function calculateContinuousSkinColor(
  baseTone: SkinTone,
  custom: SkinCustomAdjustment
): [number, number, number] {
  const meta = getSkinToneMetadata(baseTone);
  const baseR = meta.rgb[0] / 255.0;
  const baseG = meta.rgb[1] / 255.0;
  const baseB = meta.rgb[2] / 255.0;

  // Melanin depth adjustment factor (-0.35 to +0.35 around base)
  const depthFactor = Math.pow(1.0 - custom.melaninDepth, 0.85) / Math.pow(1.0 - meta.melaninDepth, 0.85);

  let r = baseR * depthFactor;
  let g = baseG * depthFactor;
  let b = baseB * depthFactor;

  // Warmth / Coolness shift
  const warmthDelta = custom.warmth - meta.warmth;
  if (warmthDelta > 0) {
    // Warmer (more red and green/gold)
    r = r * (1.0 + warmthDelta * 0.15);
    g = g * (1.0 + warmthDelta * 0.08);
    b = b * (1.0 - warmthDelta * 0.12);
  } else if (warmthDelta < 0) {
    // Cooler (slight blue/olive desaturation)
    const cool = Math.abs(warmthDelta);
    r = r * (1.0 - cool * 0.08);
    g = g * (1.0 + cool * 0.04);
    b = b * (1.0 + cool * 0.12);
  }

  return [
    Math.max(0.0, Math.min(1.0, r)),
    Math.max(0.0, Math.min(1.0, g)),
    Math.max(0.0, Math.min(1.0, b)),
  ];
}

/**
 * Calculates shader uniforms (scale and offset) for recolouring base avatar skin without losing
 * facial geometry, pore texture, or shading.
 * Base model reference skin mean is ~[195, 151, 126] (MEDIUM).
 */
export function calculateSkinDermalShift(
  targetRgb: [number, number, number]
): {
  scale: [number, number, number];
  offset: [number, number, number];
} {
  const baseRefR = 195.0 / 255.0;
  const baseRefG = 151.0 / 255.0;
  const baseRefB = 126.0 / 255.0;

  const scaleR = targetRgb[0] / baseRefR;
  const scaleG = targetRgb[1] / baseRefG;
  const scaleB = targetRgb[2] / baseRefB;

  // Gentle dampening to prevent blowouts and preserve shadows
  return {
    scale: [
      Math.max(0.2, Math.min(2.0, scaleR * 0.85 + 0.15)),
      Math.max(0.2, Math.min(2.0, scaleG * 0.85 + 0.15)),
      Math.max(0.2, Math.min(2.0, scaleB * 0.85 + 0.15)),
    ],
    offset: [
      (targetRgb[0] - baseRefR) * 0.20,
      (targetRgb[1] - baseRefG) * 0.20,
      (targetRgb[2] - baseRefB) * 0.20,
    ],
  };
}
