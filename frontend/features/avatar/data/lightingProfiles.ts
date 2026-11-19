/**
 * lightingProfiles.ts
 * Environmental Illuminant Profiles & Metamerism Simulation for Nirav Hairstorm Avatar.
 * Accurately models spectral shift between Sunlight (CIE D65), Salon LED, and Office LED.
 */

import { AvatarLightingEnvironment, LightingEnvironmentMetadata } from "../types/avatar.types";

export const LIGHTING_PROFILES: Record<AvatarLightingEnvironment, LightingEnvironmentMetadata> = {
  SUNLIGHT: {
    id: "SUNLIGHT",
    name: "Natural Sunlight",
    cct: "6500K",
    illuminantStandard: "CIE D65 Standard Daylight",
    description: "Neutral outdoor daylight with 100 CRI full spectrum balance and crisp sky reflections.",
    icon: "☀️",
    colorTempK: 6504,
    cri: 100,
    spectralPeakNm: 470,
    glslIndex: 0,
  },
  SALON: {
    id: "SALON",
    name: "Salon Consultation LED",
    cct: "4000K",
    illuminantStandard: "Commercial Salon High-CRI LED",
    description: "Warm-neutral 4000K high-CRI illumination tailored for hair colour evaluation without glare.",
    icon: "💡",
    colorTempK: 4000,
    cri: 96,
    spectralPeakNm: 590,
    glslIndex: 1,
  },
  OFFICE: {
    id: "OFFICE",
    name: "Office / Commercial",
    cct: "4500K",
    illuminantStandard: "CIE F11 Commercial Office Fluorescent / LED",
    description: "Crisp diffuse corporate lighting with distinct cyan-blue peak emphasizing ash tones.",
    icon: "🏢",
    colorTempK: 4500,
    cri: 82,
    spectralPeakNm: 545,
    glslIndex: 2,
  },
};

export const LIGHTING_ORDER: AvatarLightingEnvironment[] = ["SUNLIGHT", "SALON", "OFFICE"];

export function getLightingMetadata(id: AvatarLightingEnvironment): LightingEnvironmentMetadata {
  return LIGHTING_PROFILES[id] || LIGHTING_PROFILES.SUNLIGHT;
}

/**
 * Computes RGB lighting multipliers for the GLSL shader and Canvas 2D fallback:
 * - SUNLIGHT (D65): [1.0, 1.0, 1.0] baseline.
 * - SALON (4000K High-CRI LED): Rich warm amber reflection (+4% R, +1% G, -3% B).
 * - OFFICE (4500K Commercial): Crisp cool reflection (-3% R, +1% G, +4% B).
 */
export function getLightingShaderUniforms(mode: AvatarLightingEnvironment): {
  colorMultiplier: [number, number, number];
  specularMultiplier: number;
  ambientLight: [number, number, number];
  lightDirection: [number, number]; // [x, y] in normalized half-vector coordinates
} {
  switch (mode) {
    case "SALON":
      return {
        colorMultiplier: [1.04, 1.01, 0.97],
        specularMultiplier: 1.15,
        ambientLight: [0.06, 0.04, 0.02],
        lightDirection: [0.35, -0.65], // 45° key light from salon mirror
      };
    case "OFFICE":
      return {
        colorMultiplier: [0.97, 1.01, 1.04],
        specularMultiplier: 0.90,
        ambientLight: [0.03, 0.05, 0.07],
        lightDirection: [0.0, -0.85], // Direct overhead fluorescent troffer
      };
    case "SUNLIGHT":
    default:
      return {
        colorMultiplier: [1.0, 1.0, 1.0],
        specularMultiplier: 1.0,
        ambientLight: [0.04, 0.04, 0.04],
        lightDirection: [0.25, -0.75], // Natural high-angle sun
      };
  }
}
