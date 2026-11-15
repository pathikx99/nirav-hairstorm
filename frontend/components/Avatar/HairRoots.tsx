/**
 * HairRoots.tsx
 * Zone 1: Scalp, crown, parting, hairline, and root growth (~15-20% of total length)
 * Follows organic curved strand geometry.
 */

import React from "react";
import { AvatarView, RenderedZoneColor } from "./AvatarTypes";

interface HairRootsProps {
  color: RenderedZoneColor;
  view: AvatarView;
  isActive: boolean;
  onSelect: () => void;
  blendIntensity: number;
  useContinuousGrad?: boolean;
}

export const HairRoots: React.FC<HairRootsProps> = ({
  color,
  view,
  isActive,
  onSelect,
  blendIntensity,
  useContinuousGrad = false,
}) => {
  const fillSource = useContinuousGrad
    ? "url(#avatarContinuousHairGrad)"
    : "url(#avatarRootsGrad)";

  if (view === "back") {
    return (
      <g
        id="hairZoneRootsBack"
        onClick={onSelect}
        className="cursor-pointer transition-all duration-300"
        filter={isActive ? "url(#activeZoneGlow)" : undefined}
      >
        {/* Back Crown Cap & Upper Occipital Mane */}
        <path
          d="M210 24 C140 24 95 48 80 115 C76 135 90 155 110 168 C140 178 175 165 210 170 C245 165 280 178 310 168 C330 155 344 135 340 115 C325 48 280 24 210 24 Z"
          fill={fillSource}
          filter="url(#avatarLayerShadow)"
        />

        {/* Root Growth Transition Drape following strand curves */}
        <path
          d="M98 128 C128 142 165 140 210 148 C255 140 292 142 322 128 C332 150 326 178 304 188 C265 180 235 192 210 188 C185 192 155 180 116 188 C94 178 88 150 98 128 Z"
          fill={fillSource}
          opacity={0.88}
        />

        {/* Crown Parting Shadow and Root Dimension */}
        <path
          d="M210 26 C206 45 208 75 210 105"
          stroke={color.shadow}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.75"
        />

        {/* Anisotropic Crown Specular Sheen Arc */}
        <ellipse
          cx="210"
          cy="68"
          rx="72"
          ry="16"
          fill="url(#avatarSheenGrad)"
          opacity="0.8"
          pointerEvents="none"
        />

        {/* Active Zone Outline Indicator */}
        {isActive && (
          <path
            d="M210 24 C140 24 95 48 80 115 C76 135 90 155 110 168 C140 178 175 165 210 170 C245 165 280 178 310 168 C330 155 344 135 340 115 C325 48 280 24 210 24 Z"
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
      id="hairZoneRootsFront"
      onClick={onSelect}
      className="cursor-pointer transition-all duration-300"
      filter={isActive ? "url(#activeZoneGlow)" : undefined}
    >
      {/* 1. Crown Scalp Cap & Hairline Foundation */}
      <path
        d="M210 24 C150 24 105 48 98 108 C96 126 114 134 138 135 C162 136 178 114 210 114 C242 114 258 136 282 135 C306 134 324 126 322 108 C315 48 270 24 210 24 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
      />

      {/* 2. Face-Framing Curtain Roots (Forehead drape & root lift) */}
      {/* Left Curtain Root Lock */}
      <path
        d="M210 32 C186 46 166 74 154 112 C146 142 152 168 164 190 C168 184 170 162 164 140 C159 116 172 84 210 56 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity="0.96"
      />

      {/* Right Curtain Root Lock */}
      <path
        d="M210 32 C234 46 254 74 266 112 C274 142 268 168 256 190 C252 184 250 162 256 140 C261 116 248 84 210 56 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity="0.96"
      />

      {/* 3. Outer Temple Root Flare (Curved transition into mid-lengths) */}
      <path
        d="M102 108 C88 135 84 165 96 192 C108 190 118 175 120 152 C122 130 112 115 102 108 Z"
        fill={fillSource}
        opacity={0.92}
      />
      <path
        d="M318 108 C332 135 336 165 324 192 C312 190 302 175 300 152 C298 130 308 115 318 108 Z"
        fill={fillSource}
        opacity={0.92}
      />

      {/* 4. Natural Part Line & Scalp Dimension */}
      <path
        d="M210 26 C209 42 210 65 210 92"
        stroke={color.shadow}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.8"
      />

      {/* Anisotropic Root Specular Arc */}
      <path
        d="M142 54 Q210 32 278 54 Q210 42 142 54"
        fill="url(#avatarSheenGrad)"
        opacity="0.88"
        pointerEvents="none"
      />

      {/* Active Zone Interactive Boundary Outline */}
      {isActive && (
        <path
          d="M210 24 C148 24 102 50 96 115 C94 140 116 162 145 174 C168 184 192 188 210 188 C228 188 252 184 275 174 C304 162 326 140 324 115 C318 50 272 24 210 24 Z"
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
