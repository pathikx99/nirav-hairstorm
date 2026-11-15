/**
 * HairLighting.tsx
 * Procedural SVG gradients, metamerism filters, specular sheen ribbons,
 * and ambient atmosphere lighting for Chromatique.
 */

import React from "react";
import {
  LightingPreset,
  RenderedHairPalette,
  AvatarSkinConfig,
  LIGHTING_PRESETS,
} from "./AvatarTypes";

interface HairLightingProps {
  lighting: LightingPreset;
  palette: RenderedHairPalette;
  skin: AvatarSkinConfig;
}

export const HairLighting: React.FC<HairLightingProps> = ({
  lighting,
  palette,
  skin,
}) => {
  const lightingCfg = LIGHTING_PRESETS[lighting];
  const { roots, midLengths, ends, blendIntensity } = palette;

  // Calculate dynamic transition offsets based on blendIntensity
  // blendIntensity ranges from 0 (sharp, defined ombre) to 1 (seamless color melt)
  const rootMidStart = Math.max(15, 28 - blendIntensity * 12);
  const rootMidEnd = Math.min(48, 32 + blendIntensity * 15);
  const midEndStart = Math.max(55, 75 - blendIntensity * 18);
  const midEndEnd = Math.min(95, 78 + blendIntensity * 16);

  return (
    <defs>
      {/* Seamless Continuous 3-Zone Flow Gradient (Scalp -> Crown -> Mid-Lengths -> Ends) */}
      <linearGradient
        id="avatarContinuousHairGrad"
        x1="0%"
        y1="0%"
        x2="0%"
        y2="100%"
      >
        <stop offset="0%" stopColor={roots.shadow} />
        <stop offset="12%" stopColor={roots.base} />
        <stop offset={`${rootMidStart}%`} stopColor={roots.base} />
        <stop offset={`${rootMidEnd}%`} stopColor={midLengths.base} />
        <stop offset={`${midEndStart}%`} stopColor={midLengths.base} />
        <stop offset={`${midEndEnd}%`} stopColor={ends.base} />
        <stop offset="100%" stopColor={ends.shadow} />
      </linearGradient>

      {/* Horizontal Root Arc Flow Gradient */}
      <linearGradient id="avatarRootArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={roots.shadow} />
        <stop offset="30%" stopColor={roots.base} />
        <stop offset="50%" stopColor={roots.highlight} />
        <stop offset="70%" stopColor={roots.base} />
        <stop offset="100%" stopColor={roots.shadow} />
      </linearGradient>

      {/* Zone 1: Independent Roots Flow Gradient */}
      <linearGradient id="avatarRootsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={roots.shadow} />
        <stop offset="35%" stopColor={roots.base} />
        <stop offset="75%" stopColor={roots.highlight} />
        <stop offset="100%" stopColor={roots.shadow} />
      </linearGradient>

      {/* Zone 2: Independent Mid-Lengths Flow Gradient */}
      <linearGradient id="avatarMidGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={midLengths.shadow} />
        <stop offset="40%" stopColor={midLengths.base} />
        <stop offset="75%" stopColor={midLengths.highlight} />
        <stop offset="100%" stopColor={midLengths.shadow} />
      </linearGradient>

      {/* Zone 3: Independent Ends Flow Gradient */}
      <linearGradient id="avatarEndsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={ends.shadow} />
        <stop offset="45%" stopColor={ends.base} />
        <stop offset="80%" stopColor={ends.highlight} />
        <stop offset="100%" stopColor={ends.shadow} />
      </linearGradient>

      {/* Anisotropic Specular Cuticle Luster Sheen Ribbon */}
      <linearGradient id="avatarSheenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={lightingCfg.sheenTint} stopOpacity="0" />
        <stop
          offset="50%"
          stopColor={lightingCfg.sheenTint}
          stopOpacity={lightingCfg.specularGlintOpacity}
        />
        <stop offset="100%" stopColor={lightingCfg.sheenTint} stopOpacity="0" />
      </linearGradient>

      {/* Vertical Wave Specular Ribbon */}
      <linearGradient id="avatarWaveSheenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={lightingCfg.sheenTint} stopOpacity="0" />
        <stop
          offset="50%"
          stopColor={lightingCfg.sheenTint}
          stopOpacity={lightingCfg.specularGlintOpacity * 0.85}
        />
        <stop offset="100%" stopColor={lightingCfg.sheenTint} stopOpacity="0" />
      </linearGradient>

      {/* Natural Symmetrical Female Skin Face Radial Contour */}
      <radialGradient id="avatarSkinRadial" cx="50%" cy="38%" r="58%">
        <stop offset="0%" stopColor={skin.highlightHex} />
        <stop offset="40%" stopColor={skin.baseHex} />
        <stop offset="78%" stopColor={skin.baseHex} />
        <stop offset="93%" stopColor={skin.shadowHex} />
        <stop offset="100%" stopColor={skin.shadowHex} />
      </radialGradient>

      {/* Neck Contoured Linear Shading */}
      <linearGradient id="avatarNeckGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor={skin.shadowHex} />
        <stop offset="25%" stopColor={skin.baseHex} />
        <stop offset="50%" stopColor={skin.highlightHex} />
        <stop offset="75%" stopColor={skin.baseHex} />
        <stop offset="100%" stopColor={skin.shadowHex} />
      </linearGradient>

      {/* Deep Realistic Iris Radial Gradient */}
      <radialGradient id="avatarIrisRadial" cx="42%" cy="42%" r="58%">
        <stop offset="0%" stopColor="#854d0e" />
        <stop offset="35%" stopColor="#713f12" />
        <stop offset="72%" stopColor="#451a03" />
        <stop offset="100%" stopColor="#1a0c02" />
      </radialGradient>

      {/* Soft Drop Shadow for Dimensional Hair Layers */}
      <filter id="avatarLayerShadow" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="6" stdDeviation="6" floodOpacity="0.45" floodColor="#000000" />
      </filter>

      {/* Active Zone Interactive Boundary Glow */}
      <filter id="activeZoneGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="glow" />
        <feColorMatrix
          type="matrix"
          values="
            1 0 0 0 0.96
            0 1 0 0 0.62
            0 0 1 0 0.05
            0 0 0 1 0"
          result="coloredGlow"
        />
        <feMerge>
          <feMergeNode in="coloredGlow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      {/* Direct Sunlight 6500K Ambient Enhancement */}
      <filter id="sunlightFilter">
        <feColorMatrix
          type="matrix"
          values="
            1.05 0    0    0 0.02
            0    1.03 0    0 0.01
            0    0    0.98 0 0
            0    0    0    1 0"
        />
      </filter>

      {/* Inside Salon 3000K Soft Balance */}
      <filter id="salonFilter">
        <feColorMatrix
          type="matrix"
          values="
            1.03 0    0    0 0.02
            0    1.01 0    0 0.01
            0    0    0.96 0 0
            0    0    0    1 0"
        />
      </filter>

      {/* Cool Indoor 4000K Filter */}
      <filter id="coolFilter">
        <feColorMatrix
          type="matrix"
          values="
            0.97 0    0    0 0
            0    0.99 0    0 0.01
            0    0    1.05 0 0.02
            0    0    0    1 0"
        />
      </filter>

      {/* Hair Clipping Masks following true anatomical curves */}
      {/* 1. Roots Zone Clip (Crown, Parting, Scalp down to ~20%) */}
      <clipPath id="clipHairRootsFront">
        <path d="M70 20 C130 15 270 15 350 20 C360 85 350 145 320 180 C280 185 240 160 210 160 C180 160 140 185 100 180 C70 145 60 85 70 20 Z" />
      </clipPath>

      {/* 2. Mid-Lengths Zone Clip (~20% to ~75%) */}
      <clipPath id="clipHairMidFront">
        <path d="M50 150 C100 155 140 170 210 165 C280 170 320 155 370 150 C385 260 380 340 330 385 C270 375 240 390 210 380 C180 390 150 375 90 385 C40 340 35 260 50 150 Z" />
      </clipPath>

      {/* 3. Ends Zone Clip (~75% to 100% tapered hemline) */}
      <clipPath id="clipHairEndsFront">
        <path d="M40 360 C100 355 150 375 210 370 C270 375 320 355 380 360 C390 440 370 510 330 520 C270 515 240 500 210 505 C180 500 150 515 90 520 C50 510 30 440 40 360 Z" />
      </clipPath>

      {/* Back View Clipping Masks */}
      <clipPath id="clipHairRootsBack">
        <path d="M70 15 C130 10 270 10 350 15 C360 85 365 140 335 175 C270 185 240 160 210 165 C180 160 150 185 85 175 C55 140 60 85 70 15 Z" />
      </clipPath>

      <clipPath id="clipHairMidBack">
        <path d="M60 155 C120 165 170 160 210 165 C250 160 300 165 360 155 C375 250 375 340 335 385 C270 380 240 395 210 390 C180 395 150 380 85 385 C45 340 45 250 60 155 Z" />
      </clipPath>

      <clipPath id="clipHairEndsBack">
        <path d="M45 365 C110 360 160 380 210 375 C260 380 310 360 375 365 C390 445 365 515 320 520 C270 515 240 500 210 505 C180 500 150 515 100 520 C55 515 30 445 45 365 Z" />
      </clipPath>
    </defs>
  );
};
