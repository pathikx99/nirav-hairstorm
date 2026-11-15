/**
 * AvatarFace.tsx
 * Procedural realistic female facial features for Chromatique.
 * Symmetrical, salon-consultation realism, neutral expression.
 */

import React from "react";
import { AvatarSkinConfig, RenderedZoneColor } from "./AvatarTypes";

interface AvatarFaceProps {
  skin: AvatarSkinConfig;
  rootsColor: RenderedZoneColor;
}

export const AvatarFace: React.FC<AvatarFaceProps> = ({ skin, rootsColor }) => {
  const browColor = rootsColor.shadow;

  return (
    <g id="avatarFace">
      {/* 1. Symmetrical Female Oval Head Contour */}
      <path
        d="M138 148 C138 52 282 52 282 148 C282 198 254 238 210 238 C166 238 138 198 138 148 Z"
        fill="url(#avatarSkinRadial)"
        stroke={skin.shadowHex}
        strokeWidth="0.8"
      />

      {/* Forehead Hairline Soft Ambient Occlusion */}
      <path
        d="M150 105 Q210 92 270 105 Q210 118 150 105 Z"
        fill={rootsColor.shadow}
        opacity="0.18"
      />

      {/* Cheekbone Blush Contour */}
      <ellipse
        cx="165"
        cy="188"
        rx="18"
        ry="10"
        fill={skin.blushHex}
        opacity="0.32"
      />
      <ellipse
        cx="255"
        cy="188"
        rx="18"
        ry="10"
        fill={skin.blushHex}
        opacity="0.32"
      />

      {/* Jawline & Chin Soft 3D Dimensional Contour */}
      <path
        d="M148 195 C158 225 180 236 210 236 C240 236 262 225 272 195 C264 228 238 239 210 239 C182 239 156 228 148 195 Z"
        fill={skin.shadowHex}
        opacity="0.25"
      />

      {/* 2. Naturally Groomed Eyebrows */}
      {/* Left Eyebrow */}
      <g id="leftEyebrow">
        <path
          d="M156 142 C168 134 186 138 194 144"
          stroke={browColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        {/* Fine feather strokes */}
        <path d="M156 143 L158 140" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M162 139 L165 136" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M170 137 L173 135" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M178 138 L181 137" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M186 141 L190 142" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* Right Eyebrow */}
      <g id="rightEyebrow">
        <path
          d="M226 144 C234 138 252 134 264 142"
          stroke={browColor}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.9"
        />
        {/* Fine feather strokes */}
        <path d="M226 142 L230 141" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M234 137 L237 138" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M242 135 L245 137" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M250 136 L253 139" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
        <path d="M258 140 L260 143" stroke={browColor} strokeWidth="1.0" strokeLinecap="round" opacity="0.8" />
      </g>

      {/* 3. Expressive Almond Eyes */}
      {/* Left Eye */}
      <g id="leftEye">
        {/* Upper eyelid crease */}
        <path
          d="M158 150 Q174 143 190 150"
          stroke={skin.shadowHex}
          strokeWidth="1.1"
          fill="none"
          opacity="0.65"
        />
        {/* Sclera (Eye White) */}
        <path
          d="M157 160 C161 150 188 150 192 160 C188 170 161 170 157 160 Z"
          fill="#fbfbfd"
        />
        {/* Iris */}
        <circle cx="174.5" cy="160" r="7.5" fill="url(#avatarIrisRadial)" />
        {/* Pupil */}
        <circle cx="174.5" cy="160" r="3.4" fill="#09090b" />
        {/* Primary Specular Glint */}
        <circle cx="172.5" cy="157" r="2.2" fill="#ffffff" />
        <circle cx="176.5" cy="162" r="1.1" fill="#ffffff" opacity="0.75" />
        {/* Upper Eyeliner */}
        <path
          d="M156 160 C160 149 188 149 193 159"
          stroke="#111113"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Subtle wing */}
        <path d="M191 159 L196 155" stroke="#111113" strokeWidth="1.5" strokeLinecap="round" />
        {/* Eyelashes */}
        <path d="M164 153 Q162 148 160 147" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M172 151 Q171 146 170 145" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M180 152 Q182 147 184 146" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        {/* Lower eyelid soft lash line */}
        <path
          d="M160 162 Q174 167 189 162"
          stroke={skin.shadowHex}
          strokeWidth="0.9"
          fill="none"
          opacity="0.6"
        />
      </g>

      {/* Right Eye */}
      <g id="rightEye">
        {/* Upper eyelid crease */}
        <path
          d="M230 150 Q246 143 262 150"
          stroke={skin.shadowHex}
          strokeWidth="1.1"
          fill="none"
          opacity="0.65"
        />
        {/* Sclera (Eye White) */}
        <path
          d="M228 160 C232 150 259 150 263 160 C259 170 232 170 228 160 Z"
          fill="#fbfbfd"
        />
        {/* Iris */}
        <circle cx="245.5" cy="160" r="7.5" fill="url(#avatarIrisRadial)" />
        {/* Pupil */}
        <circle cx="245.5" cy="160" r="3.4" fill="#09090b" />
        {/* Primary Specular Glint */}
        <circle cx="243.5" cy="157" r="2.2" fill="#ffffff" />
        <circle cx="247.5" cy="162" r="1.1" fill="#ffffff" opacity="0.75" />
        {/* Upper Eyeliner */}
        <path
          d="M227 159 C232 149 260 149 264 160"
          stroke="#111113"
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
        />
        {/* Subtle wing */}
        <path d="M262 159 L267 155" stroke="#111113" strokeWidth="1.5" strokeLinecap="round" />
        {/* Eyelashes */}
        <path d="M236 152 Q238 147 240 146" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M244 151 Q245 146 246 145" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        <path d="M252 153 Q254 148 256 147" stroke="#111113" strokeWidth="0.9" strokeLinecap="round" />
        {/* Lower eyelid soft lash line */}
        <path
          d="M231 162 Q246 167 260 162"
          stroke={skin.shadowHex}
          strokeWidth="0.9"
          fill="none"
          opacity="0.6"
        />
      </g>

      {/* 4. Contoured Feminine Nose */}
      <g id="avatarNose">
        {/* Bridge shading */}
        <path
          d="M206 154 L204 182 Q210 186 216 182 L214 154"
          stroke={skin.featureStroke}
          strokeWidth="1.1"
          strokeLinecap="round"
          fill="none"
          opacity="0.55"
        />
        {/* Soft tip highlight */}
        <circle cx="210" cy="181.5" r="3.2" fill={skin.highlightHex} opacity="0.55" />
        {/* Alar wings and nostrils */}
        <ellipse cx="204.5" cy="183.5" rx="1.6" ry="1.0" fill={skin.shadowHex} opacity="0.65" />
        <ellipse cx="215.5" cy="183.5" rx="1.6" ry="1.0" fill={skin.shadowHex} opacity="0.65" />
        <path
          d="M202 182 Q205 185 210 185 Q215 185 218 182"
          stroke={skin.featureStroke}
          strokeWidth="1.2"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </g>

      {/* Philtrum Ridges */}
      <path
        d="M208 188 L207 197 M212 188 L213 197"
        stroke={skin.shadowHex}
        strokeWidth="0.8"
        strokeLinecap="round"
        opacity="0.4"
      />

      {/* 5. Natural Feminine Lips with Gloss Sheen */}
      <g id="avatarLips">
        {/* Upper Lip with Cupid's Bow */}
        <path
          d="M195 204 Q203 199 210 203 Q217 199 225 204 Q210 210 195 204 Z"
          fill="#be123c"
          opacity="0.88"
        />
        {/* Lower Lip Fullness */}
        <path
          d="M196 204 Q210 217 224 204 Q210 211 196 204 Z"
          fill="#e11d48"
          opacity="0.94"
        />
        {/* Gloss Specular Highlight */}
        <ellipse cx="210" cy="207.5" rx="4.5" ry="1.6" fill="#ffffff" opacity="0.65" />
        {/* Lip Contour Corner Creases */}
        <circle cx="194.5" cy="204" r="0.9" fill="#881337" opacity="0.7" />
        <circle cx="225.5" cy="204" r="0.9" fill="#881337" opacity="0.7" />
      </g>
    </g>
  );
};
