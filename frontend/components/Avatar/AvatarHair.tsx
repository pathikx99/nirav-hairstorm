/**
 * AvatarHair.tsx
 * Hair Composition Module for Chromatique.
 * Composes independent roots, mid-lengths, ends, underlayers,
 * and procedural strand texture with interactive zone indicators.
 */

import React from "react";
import {
  AvatarView,
  HairZoneId,
  RenderedHairPalette,
} from "./AvatarTypes";
import { HairRoots } from "./HairRoots";
import { HairMidLengths } from "./HairMidLengths";
import { HairEnds } from "./HairEnds";
import { HairTexture } from "./HairTexture";

interface AvatarHairProps {
  palette: RenderedHairPalette;
  view: AvatarView;
  activeZone: HairZoneId;
  onSelectZone: (zone: HairZoneId) => void;
  renderUnderlayerOnly?: boolean;
  renderOverlayerOnly?: boolean;
}

export const AvatarHair: React.FC<AvatarHairProps> = ({
  palette,
  view,
  activeZone,
  onSelectZone,
  renderUnderlayerOnly = false,
  renderOverlayerOnly = false,
}) => {
  const { roots, midLengths, ends, blendIntensity, separateZones } = palette;
  const useContinuous = blendIntensity > 0.4 || !separateZones;

  // UNDERLAYER: Deep rear drape behind the neck and chest
  if (renderUnderlayerOnly) {
    if (view === "back") return null;

    return (
      <g id="avatarHairUnderlayer">
        {/* Deep Left Rear Drape */}
        <path
          d="M136 145 C88 175 52 230 48 305 C46 370 68 415 64 475 C86 480 118 450 126 398 C134 345 130 260 138 195 Z"
          fill={useContinuous ? "url(#avatarContinuousHairGrad)" : "url(#avatarMidGrad)"}
          filter="url(#avatarLayerShadow)"
          opacity={0.88}
        />
        {/* Deep Right Rear Drape */}
        <path
          d="M284 145 C332 175 368 230 372 305 C374 370 352 415 356 475 C334 480 302 450 294 398 C286 345 290 260 282 195 Z"
          fill={useContinuous ? "url(#avatarContinuousHairGrad)" : "url(#avatarMidGrad)"}
          filter="url(#avatarLayerShadow)"
          opacity={0.88}
        />
        {/* Behind Neck Occlusion Shadow */}
        <path
          d="M152 225 Q210 335 268 225 L276 335 Q210 430 144 335 Z"
          fill={midLengths.shadow}
          opacity="0.9"
        />
      </g>
    );
  }

  // OVERLAYER (OR FULL HAIR): Main visible volume, zones, strands, and pins
  return (
    <g id="avatarHairMain">
      {/* Zone 1: Scalp, Crown & Hairline */}
      <HairRoots
        color={roots}
        view={view}
        isActive={activeZone === "roots"}
        onSelect={() => onSelectZone("roots")}
        blendIntensity={blendIntensity}
        useContinuousGrad={useContinuous}
      />

      {/* Zone 2: Flowing Mid-Lengths Body */}
      <HairMidLengths
        color={midLengths}
        view={view}
        isActive={activeZone === "midLengths"}
        onSelect={() => onSelectZone("midLengths")}
        blendIntensity={blendIntensity}
        useContinuousGrad={useContinuous}
      />

      {/* Zone 3: Tapered Feathered Ends */}
      <HairEnds
        color={ends}
        view={view}
        isActive={activeZone === "ends"}
        onSelect={() => onSelectZone("ends")}
        blendIntensity={blendIntensity}
        useContinuousGrad={useContinuous}
      />

      {/* Hundreds of Procedural Fine Hair Strands & Cuticle Specular Glints */}
      <HairTexture palette={palette} view={view} />

      {/* Interactive Zone Selection Touch Indicators */}
      {view === "front" ? (
        <g id="frontZoneTouchPins">
          {/* 1. Roots Pin (Top Crown) */}
          <g
            transform="translate(210, 48)"
            onClick={() => onSelectZone("roots")}
            className="cursor-pointer group"
          >
            <circle
              r="13"
              fill={activeZone === "roots" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "roots" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "roots" ? "#000000" : "#ffffff"}
              fontSize="11"
              fontWeight="900"
            >
              1
            </text>
          </g>

          {/* 2. Mid-Lengths Pin (Middle Wave) */}
          <g
            transform="translate(86, 260)"
            onClick={() => onSelectZone("midLengths")}
            className="cursor-pointer group"
          >
            <circle
              r="12"
              fill={activeZone === "midLengths" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "midLengths" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "midLengths" ? "#000000" : "#ffffff"}
              fontSize="10"
              fontWeight="900"
            >
              2
            </text>
          </g>

          {/* 3. Ends Pin (Lower Lock) */}
          <g
            transform="translate(100, 440)"
            onClick={() => onSelectZone("ends")}
            className="cursor-pointer group"
          >
            <circle
              r="12"
              fill={activeZone === "ends" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "ends" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "ends" ? "#000000" : "#ffffff"}
              fontSize="10"
              fontWeight="900"
            >
              3
            </text>
          </g>
        </g>
      ) : (
        <g id="backZoneTouchPins">
          {/* Back 1. Roots Pin */}
          <g
            transform="translate(210, 75)"
            onClick={() => onSelectZone("roots")}
            className="cursor-pointer group"
          >
            <circle
              r="13"
              fill={activeZone === "roots" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "roots" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "roots" ? "#000000" : "#ffffff"}
              fontSize="11"
              fontWeight="900"
            >
              1
            </text>
          </g>

          {/* Back 2. Mid-Lengths Pin */}
          <g
            transform="translate(210, 260)"
            onClick={() => onSelectZone("midLengths")}
            className="cursor-pointer group"
          >
            <circle
              r="12"
              fill={activeZone === "midLengths" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "midLengths" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "midLengths" ? "#000000" : "#ffffff"}
              fontSize="10"
              fontWeight="900"
            >
              2
            </text>
          </g>

          {/* Back 3. Ends Pin */}
          <g
            transform="translate(210, 420)"
            onClick={() => onSelectZone("ends")}
            className="cursor-pointer group"
          >
            <circle
              r="12"
              fill={activeZone === "ends" ? "#f59e0b" : "#18181b"}
              stroke="#ffffff"
              strokeWidth="2.2"
              className={activeZone === "ends" ? "animate-pulse" : "group-hover:scale-110 transition-transform"}
            />
            <text
              textAnchor="middle"
              dy="4.5"
              fill={activeZone === "ends" ? "#000000" : "#ffffff"}
              fontSize="10"
              fontWeight="900"
            >
              3
            </text>
          </g>
        </g>
      )}
    </g>
  );
};
