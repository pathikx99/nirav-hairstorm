/**
 * AvatarHead.tsx
 * Anatomical neck, shoulders, ears, and base head geometry for Chromatique.
 */

import React from "react";
import { AvatarSkinConfig, AvatarView } from "./AvatarTypes";

interface AvatarHeadProps {
  skin: AvatarSkinConfig;
  view: AvatarView;
}

export const AvatarHead: React.FC<AvatarHeadProps> = ({ skin, view }) => {
  if (view === "back") {
    return (
      <g id="avatarHeadBack">
        {/* Slender Nape / Back of Neck */}
        <path
          d="M190 220 L190 295 C190 300 200 305 210 305 C220 305 230 300 230 295 L230 220 Z"
          fill={skin.shadowHex}
          opacity="0.85"
        />

        {/* Nape hairline shadow */}
        <path
          d="M185 220 Q210 240 235 220"
          stroke={skin.featureStroke}
          strokeWidth="1.2"
          fill="none"
          opacity="0.5"
        />

        {/* Back Shoulders & Chic Salon Cape */}
        <path
          d="M165 295 C140 305 105 335 92 375 L75 510 L345 510 L328 375 C315 335 280 305 255 295 C235 308 185 308 165 295 Z"
          fill="#141416"
          stroke="#27272a"
          strokeWidth="1.4"
          filter="url(#avatarLayerShadow)"
        />
        {/* Cape collar stitching */}
        <path
          d="M165 295 C185 308 235 308 255 295"
          stroke="#3f3f46"
          strokeWidth="1.8"
          fill="none"
          opacity="0.75"
        />
      </g>
    );
  }

  return (
    <g id="avatarHeadFront">
      {/* 1. Slender Contoured Feminine Neck */}
      <path
        d="M188 205 C188 248 180 278 162 298 L258 298 C240 278 232 248 232 205 Z"
        fill="url(#avatarNeckGrad)"
        stroke={skin.shadowHex}
        strokeWidth="0.8"
      />

      {/* Sub-Mental (Chin) Soft Ambient Shadow */}
      <path
        d="M185 208 Q210 232 235 208 L235 222 Q210 246 185 222 Z"
        fill={skin.shadowHex}
        opacity="0.45"
      />

      {/* Sternocleidomastoid Tendon Hints */}
      <path
        d="M198 238 Q206 270 200 292"
        stroke={skin.shadowHex}
        strokeWidth="1.2"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />
      <path
        d="M222 238 Q214 270 220 292"
        stroke={skin.shadowHex}
        strokeWidth="1.2"
        fill="none"
        opacity="0.25"
        strokeLinecap="round"
      />

      {/* Suprasternal Notch (Neck Hollow) */}
      <ellipse cx="210" cy="292" rx="4.5" ry="2.2" fill={skin.shadowHex} opacity="0.3" />

      {/* Elegant Clavicles / Collarbones */}
      <path
        d="M178 292 Q202 300 210 292 Q218 300 242 292"
        stroke={skin.collarboneStroke}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />

      {/* 2. Chic Professional Salon Cape / Black Top */}
      <path
        d="M162 298 C142 308 106 338 92 378 L78 510 L342 510 L328 378 C314 338 278 308 258 298 C240 312 180 312 162 298 Z"
        fill="#141416"
        stroke="#27272a"
        strokeWidth="1.4"
        filter="url(#avatarLayerShadow)"
      />
      {/* Cape V-Trim */}
      <path
        d="M162 298 C182 312 238 312 258 298"
        stroke="#3f3f46"
        strokeWidth="2.0"
        fill="none"
        opacity="0.85"
      />

      {/* 3. Ears (Peeking naturally under side locks) */}
      {/* Left Ear */}
      <g id="avatarLeftEar">
        {/* Outer Helix */}
        <path
          d="M136 168 C128 174 126 195 132 208 C135 214 140 215 142 208 Z"
          fill={skin.shadowHex}
          stroke={skin.featureStroke}
          strokeWidth="0.8"
          opacity="0.85"
        />
        {/* Inner Concha & Tragus */}
        <path
          d="M136 178 C132 184 133 196 138 202"
          stroke={skin.featureStroke}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>

      {/* Right Ear */}
      <g id="avatarRightEar">
        {/* Outer Helix */}
        <path
          d="M284 168 C292 174 294 195 288 208 C285 214 280 215 278 208 Z"
          fill={skin.shadowHex}
          stroke={skin.featureStroke}
          strokeWidth="0.8"
          opacity="0.85"
        />
        {/* Inner Concha & Tragus */}
        <path
          d="M284 178 C288 184 287 196 282 202"
          stroke={skin.featureStroke}
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </g>
    </g>
  );
};
