/**
 * avatarColourAdapter.ts
 * Integrates Nirav Hairstorm colour science (UHCR, Kubelka-Munk, formulation outputs)
 * with the Hair Avatar Studio rendering pipeline.
 */

import { FormulationResultResponse, TargetColourInput } from "../../../types/formulation";
import { HairAssessmentInput } from "../../../types/assessment";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../../types/uhcr";
import {
  computeHairColorimetry,
  HairColorimetryResult,
} from "../../../services/hairColorimetryService";
import { HairRegionId, RegionColourConfig } from "../types/avatar.types";

export interface ResolvedRegionShading {
  baseRgb: [number, number, number];       // [0..1, 0..1, 0..1]
  shadowRgb: [number, number, number];     // [0..1, 0..1, 0..1]
  highlightRgb: [number, number, number];  // [0..1, 0..1, 0..1]
  colorimetry: HairColorimetryResult;
  greyPercentage: number;
}

export interface ResolvedAvatarShading {
  roots: ResolvedRegionShading;
  midLengths: ResolvedRegionShading;
  ends: ResolvedRegionShading;
  eyebrows: {
    targetL: number;
    colorRgb: [number, number, number];
  };
}

function hexToRgb01(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return [r / 255.0, g / 255.0, b / 255.0];
}

/**
 * Resolves full colorimetric shading for a single hair region.
 */
export function resolveRegionShading(config: RegionColourConfig): ResolvedRegionShading {
  const colorimetry = computeHairColorimetry(
    config.level,
    config.primaryTone,
    config.secondaryTone,
    config.intensity || "STANDARD"
  );

  let baseRgb = hexToRgb01(colorimetry.baseHex);
  let shadowRgb = hexToRgb01(colorimetry.shadowHex);
  let highlightRgb = hexToRgb01(colorimetry.highlightHex);

  // If a custom override hex was specified
  if (config.customHex) {
    baseRgb = hexToRgb01(config.customHex);
  }

  // Pre-lightened / bleached effect: adds translucent vibrance and slight warmth
  if (config.isBleached) {
    highlightRgb = [
      Math.min(1.0, highlightRgb[0] * 1.15 + 0.05),
      Math.min(1.0, highlightRgb[1] * 1.12 + 0.03),
      Math.min(1.0, highlightRgb[2] * 1.05),
    ];
  }

  return {
    baseRgb,
    shadowRgb,
    highlightRgb,
    colorimetry,
    greyPercentage: config.greyPercentage || 0,
  };
}

/**
 * Computes eyebrow melanin harmonization to prevent jet-black brows under high lift blondes
 * and silver/white brow softening for canities.
 */
export function calculateEyebrowHarmonization(
  rootLevel: UniversalLevel,
  rootGrey: number
): {
  targetL: number;
  colorRgb: [number, number, number];
} {
  const normLvl = Math.max(1.0, Math.min(10.0, rootLevel));
  const effGrey = Math.max(0.0, Math.min(1.0, rootGrey / 100.0));

  // Base eyebrow lightness coupling: Level 1 = 0.22, Level 10 = ~0.69
  let targetL = 0.22 + 0.052 * (normLvl - 1.0);

  // White eyebrow softening under canities
  if (effGrey > 0) {
    const whiteL = 0.75;
    targetL = targetL * (1.0 - effGrey * 0.85) + whiteL * (effGrey * 0.85);
  }

  // Convert targetL into natural melanin eyebrow RGB
  // Dark brunette: [0.18, 0.14, 0.12], Soft blonde: [0.65, 0.58, 0.48], Grey/white: [0.75, 0.75, 0.75]
  let r = targetL * 0.95;
  let g = targetL * 0.85;
  let b = targetL * 0.72;

  if (effGrey > 0) {
    const neutralFactor = effGrey * 0.75;
    const avg = (r + g + b) / 3.0;
    r = r * (1.0 - neutralFactor) + avg * neutralFactor;
    g = g * (1.0 - neutralFactor) + avg * neutralFactor;
    b = b * (1.0 - neutralFactor) + avg * neutralFactor;
  }

  return {
    targetL,
    colorRgb: [
      Math.max(0.0, Math.min(1.0, r)),
      Math.max(0.0, Math.min(1.0, g)),
      Math.max(0.0, Math.min(1.0, b)),
    ],
  };
}

/**
 * Adapts all 3 hair regions and eyebrows for shader input.
 */
export function resolveAvatarShading(
  regions: Record<HairRegionId, RegionColourConfig>
): ResolvedAvatarShading {
  const roots = resolveRegionShading(regions.roots);
  const midLengths = resolveRegionShading(regions.mid_lengths);
  const ends = resolveRegionShading(regions.ends);

  const eyebrows = calculateEyebrowHarmonization(regions.roots.level, regions.roots.greyPercentage || 0);

  return {
    roots,
    midLengths,
    ends,
    eyebrows,
  };
}

/**
 * Creates regional configs from a TargetColourInput (uniform all-over base).
 */
export function createDefaultRegionsFromTarget(target: TargetColourInput): Record<HairRegionId, RegionColourConfig> {
  const baseConfig: RegionColourConfig = {
    level: target.universal_level,
    primaryTone: target.primary_tone,
    secondaryTone: target.secondary_tone,
    intensity: target.tone_intensity,
    isBleached: target.universal_level >= 8,
    greyPercentage: 0,
  };

  return {
    roots: { ...baseConfig },
    mid_lengths: { ...baseConfig },
    ends: { ...baseConfig },
  };
}

/**
 * Extracts and adapts regional predicted results from an active FormulationResultResponse.
 */
export function extractRegionsFromFormulation(
  formulation: FormulationResultResponse,
  fallbackTarget?: TargetColourInput | null
): Record<HairRegionId, RegionColourConfig> {
  const result: Record<HairRegionId, RegionColourConfig> = {
    roots: {
      level: 4,
      primaryTone: "NATURAL",
      secondaryTone: null,
      intensity: "STANDARD",
      isBleached: false,
      greyPercentage: 0,
    },
    mid_lengths: {
      level: 4,
      primaryTone: "NATURAL",
      secondaryTone: null,
      intensity: "STANDARD",
      isBleached: false,
      greyPercentage: 0,
    },
    ends: {
      level: 4,
      primaryTone: "NATURAL",
      secondaryTone: null,
      intensity: "STANDARD",
      isBleached: false,
      greyPercentage: 0,
    },
  };

  const predictedUniversal = formulation.predicted_result?.universal_colour;

  // Use regional formulation plans if present
  if (formulation.regions && formulation.regions.length > 0) {
    for (const plan of formulation.regions) {
      const regionKey: HairRegionId =
        plan.region === "ROOTS"
          ? "roots"
          : plan.region === "MID_LENGTHS"
          ? "mid_lengths"
          : "ends";

      const targetLevel = (Math.max(1, Math.min(10, Math.round(plan.target_level))) || 5) as UniversalLevel;

      result[regionKey] = {
        level: targetLevel,
        primaryTone: predictedUniversal?.primary_tone || fallbackTarget?.primary_tone || "NATURAL",
        secondaryTone: predictedUniversal?.secondary_tone || fallbackTarget?.secondary_tone || null,
        intensity: predictedUniversal?.tone_intensity || fallbackTarget?.tone_intensity || "STANDARD",
        isBleached: targetLevel >= 8 || plan.service_classification === "LIGHTENING",
        greyPercentage: 0,
      };
    }
  } else if (predictedUniversal) {
    const singleConfig: RegionColourConfig = {
      level: predictedUniversal.level,
      primaryTone: predictedUniversal.primary_tone,
      secondaryTone: predictedUniversal.secondary_tone,
      intensity: predictedUniversal.tone_intensity,
      isBleached: predictedUniversal.level >= 8,
      greyPercentage: 0,
    };
    result.roots = { ...singleConfig };
    result.mid_lengths = { ...singleConfig };
    result.ends = { ...singleConfig };
  } else if (fallbackTarget) {
    return createDefaultRegionsFromTarget(fallbackTarget);
  }

  return result;
}

/**
 * Creates regional configs from client hair assessment (Before state).
 */
export function extractRegionsFromAssessment(
  assessment: HairAssessmentInput
): Record<HairRegionId, RegionColourConfig> {
  const mapRegion = (
    lvl: number,
    tone: string | null | undefined,
    grey: number,
    bleached?: boolean
  ): RegionColourConfig => ({
    level: (Math.max(1, Math.min(10, Math.round(lvl))) || 4) as UniversalLevel,
    primaryTone: (tone as ToneFamily) || "NATURAL",
    secondaryTone: null,
    intensity: "STANDARD",
    isBleached: Boolean(bleached),
    greyPercentage: grey || 0,
  });

  return {
    roots: mapRegion(
      assessment.roots.observed_level,
      assessment.roots.observed_undertone,
      assessment.roots.grey_percentage,
      assessment.roots.is_bleached
    ),
    mid_lengths: mapRegion(
      assessment.mid_lengths.observed_level,
      assessment.mid_lengths.observed_undertone,
      assessment.mid_lengths.grey_percentage,
      assessment.mid_lengths.is_bleached
    ),
    ends: mapRegion(
      assessment.ends.observed_level,
      assessment.ends.observed_undertone,
      assessment.ends.grey_percentage,
      assessment.ends.is_bleached
    ),
  };
}
