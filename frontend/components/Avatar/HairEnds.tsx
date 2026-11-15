/**
 * HairEnds.tsx
 * Zone 3: Ends (~75% to 100% of total length)
 * Natural tapered tips, feathered hemline, organic flow.
 */

import React from "react";
import { AvatarView, RenderedZoneColor } from "./AvatarTypes";

interface HairEndsProps {
  color: RenderedZoneColor;
  view: AvatarView;
  isActive: boolean;
  onSelect: () => void;
  blendIntensity: number;
  useContinuousGrad?: boolean;
}

export const HairEnds: React.FC<HairEndsProps> = ({
  color,
  view,
  isActive,
  onSelect,
  blendIntensity,
  useContinuousGrad = false,
}) => {
  const fillSource = useContinuousGrad
    ? "url(#avatarContinuousHairGrad)"
    : "url(#avatarEndsGrad)";

  if (view === "back") {
    return (
      <g
        id="hairZoneEndsBack"
        onClick={onSelect}
        className="cursor-pointer transition-all duration-300"
        filter={isActive ? "url(#activeZoneGlow)" : undefined}
      >
        {/* Full Flowing Lower Hemline with Feathered Tapered Layers */}
        <path
          d="M98 365 C85 410 95 465 120 505 C145 518 175 515 210 518 C245 515 275 518 300 505 C325 465 335 410 322 365 C295 385 255 380 210 382 C165 380 125 385 98 365 Z"
          fill={fillSource}
          filter="url(#avatarLayerShadow)"
          opacity={0.96}
        />

        {/* Feathered Tapered Strand Points at the Hemline */}
        {/* Left Tip Feathers */}
        <path d="M108 435 Q100 480 122 506" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.85" />
        <path d="M125 445 Q128 490 145 515" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.85" />
        <path d="M152 455 Q165 498 180 518" stroke={color.highlight} strokeWidth="1.4" fill="none" opacity="0.85" />

        {/* Center Tip Feathers */}
        <path d="M195 460 Q205 500 210 520" stroke={color.highlight} strokeWidth="1.8" fill="none" opacity="0.9" />
        <path d="M225 460 Q215 500 210 520" stroke={color.highlight} strokeWidth="1.8" fill="none" opacity="0.9" />

        {/* Right Tip Feathers */}
        <path d="M268 455 Q255 498 240 518" stroke={color.highlight} strokeWidth="1.4" fill="none" opacity="0.85" />
        <path d="M295 445 Q292 490 275 515" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.85" />
        <path d="M312 435 Q320 480 298 506" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.85" />

        {/* Active Zone Boundary Glow Outline */}
        {isActive && (
          <path
            d="M98 365 C85 410 95 465 120 505 C145 518 175 515 210 518 C245 515 275 518 300 505 C325 465 335 410 322 365 Z"
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
      id="hairZoneEndsFront"
      onClick={onSelect}
      className="cursor-pointer transition-all duration-300"
      filter={isActive ? "url(#activeZoneGlow)" : undefined}
    >
      {/* 1. Deep Rear Ends Drape (Back of chest / rib cage) */}
      <path
        d="M68 350 C52 405 60 460 78 505 C98 505 125 470 120 425 C116 385 102 360 92 345 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.92}
      />
      <path
        d="M352 350 C368 405 360 460 342 505 C322 505 295 470 300 425 C304 385 318 360 328 345 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.92}
      />

      {/* 2. Main Cascading Side Ends with Tapered Tips */}
      {/* Left Outer End Cluster */}
      <path
        d="M84 395 C76 435 82 478 96 505 C108 508 126 480 128 445 C130 405 116 385 106 380 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.96}
      />

      {/* Right Outer End Cluster */}
      <path
        d="M336 395 C344 435 338 478 324 505 C312 508 294 480 292 445 C290 405 304 385 314 380 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.96}
      />

      {/* 3. Front Chest Ribbon Ends (Soft curled wisps on collar/chest) */}
      {/* Left Front Ribbon Tip */}
      <path
        d="M130 395 C122 432 128 470 138 495 C148 495 158 465 154 425 C150 395 140 390 130 395 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.98}
      />

      {/* Right Front Ribbon Tip */}
      <path
        d="M290 395 C298 432 292 470 282 495 C272 495 262 465 266 425 C270 395 280 390 290 395 Z"
        fill={fillSource}
        filter="url(#avatarLayerShadow)"
        opacity={0.98}
      />

      {/* Tapered Strand Tip Highlights */}
      <path d="M84 415 Q82 465 96 504" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.88" />
      <path d="M102 425 Q108 475 116 500" stroke={color.highlight} strokeWidth="1.4" fill="none" opacity="0.85" />
      <path d="M134 415 Q130 460 138 494" stroke={color.highlight} strokeWidth="1.5" fill="none" opacity="0.88" />

      <path d="M336 415 Q338 465 324 504" stroke={color.highlight} strokeWidth="1.6" fill="none" opacity="0.88" />
      <path d="M318 425 Q312 475 304 500" stroke={color.highlight} strokeWidth="1.4" fill="none" opacity="0.85" />
      <path d="M286 415 Q290 460 282 494" stroke={color.highlight} strokeWidth="1.5" fill="none" opacity="0.88" />

      {/* Active Zone Boundary Glow Outline */}
      {isActive && (
        <path
          d="M68 350 C52 405 60 460 78 505 C108 512 145 498 154 425 C165 425 255 425 266 425 C275 498 312 512 342 505 C360 460 368 405 352 350 C315 375 270 375 210 375 C150 375 105 375 68 350 Z"
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
