/**
 * HairMidLengths.tsx
 * Zone 2: Mid-Lengths (~20% to ~75% of total length)
 * Flowing wavy body, natural curves, strand flow continuity.
 */

import React from "react";
import { AvatarView, RenderedZoneColor } from "./AvatarTypes";

interface HairMidLengthsProps {
  color: RenderedZoneColor;
  view: AvatarView;
  isActive: boolean;
  onSelect: () => void;
  blendIntensity: number;
  useContinuousGrad?: boolean;
}

export const HairMidLengths: React.FC<HairMidLengthsProps> = ({
  color,
  view,
  isActive,
  onSelect,
  blendIntensity,
  useContinuousGrad = false,
}) => {
  const fillSource = useContinuousGrad
    ? "url(#avatarContinuousHairGrad)"
    : "url(#avatarMidGrad)";

  if (view === "back") {
    return (
      <g
        id="hairZoneMidLengthsBack"
        onClick={onSelect}
        className="cursor-pointer transition-all duration-300"
        filter={isActive ? "url(#activeZoneGlow)" : undefined}
      >
        {/* Full Back Mid-Length Cascade from below crown to lower back */}
        <path
          d="M110 160 C80 220 72 300 102 375 C132 405 170 395 210 395 C250 395 288 405 318 375 C348 300 340 220 310 160 C275 178 245 168 210 170 C175 168 145 178 110 160 Z"
          fill={fillSource}
          filter="url(#avatarLayerShadow)"
          opacity={0.96}
        />

        {/* Inner Wave Layer for Depth and Chiaroscuro */}
        <path
          d="M135 175 C108 240 104 310 132 375 C158 395 184 398 210 398 C236 398 262 395 288 375 C316 310 312 240 285 175 C256 195 232 190 210 190 C188 190 164 195 135 175 Z"
          fill={fillSource}
          opacity={0.9}
        />

        {/* Specular Wave Highlights across Back Mane */}
        <path
          d="M140 220 Q122 285 152 355"
          stroke={color.highlight}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.82"
        />
        <path
          d="M280 220 Q298 285 268 355"
          stroke={color.highlight}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.82"
        />
        <path
          d="M185 200 Q170 290 195 365"
          stroke={color.highlight}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />
        <path
          d="M235 200 Q250 290 225 365"
          stroke={color.highlight}
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Active Zone Boundary Glow Outline */}
        {isActive && (
          <path
            d="M110 160 C80 220 72 300 102 375 C132 405 170 395 210 395 C250 395 288 405 318 375 C348 300 340 220 310 160 Z"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
            strokeDasharray="6,4"
            opacity="0.95"
            pointerEvents="none"
          />
        )}
      </g>
    );
  }

  // FRONT VIEW
  return (
    <g
      id="hairZoneMidLengthsFront"
      onClick={onSelect}
      className="cursor-pointer transition-all duration-300"
      filter={isActive ? "url(#activeZoneGlow)" : undefined}
    >
      {/* 1. Deep Rear Mid-Length Silhouette (Behind shoulders) */}
      <path
        d="M92 185 C62 230 50 295 72 365 C88 375 110 365 118 340 C125 300 115 240 128 190 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.92}
      />
      <path
        d="M328 185 C358 230 370 295 348 365 C332 375 310 365 302 340 C295 300 305 240 292 190 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.92}
      />

      {/* 2. Main Outer Voluminous Waves (Framing cheeks and neck down over shoulders) */}
      {/* Left Main Wave */}
      <path
        d="M96 160 C75 210 65 270 85 330 C98 368 76 385 86 410 C108 410 128 378 126 335 C124 290 106 242 118 192 C125 162 142 135 162 120 C136 128 110 142 96 160 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.96}
      />

      {/* Right Main Wave */}
      <path
        d="M324 160 C345 210 355 270 335 330 C322 368 344 385 334 410 C312 410 292 378 294 335 C296 290 314 242 302 192 C295 162 278 135 258 120 C284 128 310 142 324 160 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.96}
      />

      {/* 3. Front Cascading Wave Ribbons Draped Over Collarbones */}
      {/* Left Front Ribbon */}
      <path
        d="M152 185 C132 225 120 275 132 328 C144 372 124 395 134 415 C148 415 158 382 152 342 C146 298 162 245 158 195 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.98}
      />

      {/* Right Front Ribbon */}
      <path
        d="M268 185 C288 225 300 275 288 328 C276 372 296 395 286 415 C272 415 262 382 268 342 C274 298 258 245 262 195 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.98}
      />

      {/* Mid-Length Highlight Lines */}
      <path
        d="M96 215 Q78 275 98 335"
        stroke={color.highlight}
        strokeWidth="2.0"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M324 215 Q342 275 322 335"
        stroke={color.highlight}
        strokeWidth="2.0"
        fill="none"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M142 220 Q130 290 146 355"
        stroke={color.highlight}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.88"
      />
      <path
        d="M278 220 Q290 290 274 355"
        stroke={color.highlight}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.88"
      />

      {/* Active Zone Interactive Boundary Outline */}
      {isActive && (
        <path
          d="M86 160 C64 220 54 285 76 350 C94 395 125 395 145 395 C162 345 158 275 165 210 C185 200 235 200 255 210 C262 275 258 345 275 395 C295 395 326 395 344 350 C366 285 356 220 334 160 C290 170 250 165 210 165 C170 165 130 170 86 160 Z"
          fill="none"
          stroke="#f59e0b"
          strokeWidth="2.4"
          strokeDasharray="6,4"
          opacity="0.95"
          pointerEvents="none"
        />
      )}
    </g>
  );
};
