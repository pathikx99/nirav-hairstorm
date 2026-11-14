"use client";

import React from "react";
import { HairRegionInput } from "../../types/assessment";
import { UniversalLevel, ToneFamily } from "../../types/uhcr";
import { computeHairColorimetry } from "../../services/hairColorimetryService";

interface InteractiveHeadAvatarProps {
  activeRegion: "ROOTS" | "MID_LENGTHS" | "ENDS";
  onSelectRegion: (region: "ROOTS" | "MID_LENGTHS" | "ENDS") => void;
  roots: HairRegionInput;
  midLengths: HairRegionInput;
  ends: HairRegionInput;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function blendHex(hex1: string, hex2: string, weight1: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const w2 = 1 - weight1;
  return rgbToHex(
    r1 * weight1 + r2 * w2,
    g1 * weight1 + g2 * w2,
    b1 * weight1 + b2 * w2
  );
}

function getZoneColors(
  level: number,
  tone: ToneFamily,
  greyPct: number = 0
): { base: string; shadow: string; highlight: string } {
  const validLevel = (Math.max(1, Math.min(10, level)) || 5) as UniversalLevel;
  const c = computeHairColorimetry(validLevel, tone || "NATURAL");

  if (!greyPct || greyPct <= 0) {
    return { base: c.baseHex, shadow: c.shadowHex, highlight: c.highlightHex };
  }

  if (greyPct >= 100) {
    return { base: "#f8fafc", shadow: "#cbd5e1", highlight: "#ffffff" };
  }

  if (greyPct >= 50) {
    return {
      base: blendHex(c.baseHex, "#e2e8f0", 0.5),
      shadow: blendHex(c.shadowHex, "#94a3b8", 0.6),
      highlight: "#ffffff",
    };
  }

  return {
    base: blendHex(c.baseHex, "#cbd5e1", 0.75),
    shadow: c.shadowHex,
    highlight: blendHex(c.highlightHex, "#ffffff", 0.6),
  };
}

export function InteractiveHeadAvatar({
  activeRegion,
  onSelectRegion,
  roots,
  midLengths,
  ends,
  className = "",
}: InteractiveHeadAvatarProps) {
  
  const rootsTone = (roots.observed_undertone as ToneFamily) || "NATURAL";
  const midTone = (midLengths.observed_undertone as ToneFamily) || "NATURAL";
  const endsTone = (ends.observed_undertone as ToneFamily) || "NATURAL";

  const rootsColors = getZoneColors(
    roots.observed_level || 5,
    rootsTone,
    roots.grey_percentage || 0
  );
  const midColors = getZoneColors(
    midLengths.observed_level || 5,
    midTone,
    midLengths.grey_percentage || 0
  );
  const endsColors = getZoneColors(
    ends.observed_level || 5,
    endsTone,
    ends.grey_percentage || 0
  );

  const handleRegionClick = (region: "ROOTS" | "MID_LENGTHS" | "ENDS") => {
        onSelectRegion(region);

    if (region === "ROOTS") {
          } else if (region === "MID_LENGTHS") {
          } else {
          }
  };

    const getZoneDiagnosis = () => {
    if (activeRegion === "ROOTS") {
      const greyTxt = roots.grey_percentage ? ` • ${roots.grey_percentage}% Grey` : " • 0% Grey";
      const dyeTxt = roots.existing_artificial_colour ? " • Coloured" : " • Natural Virgin";
      return `Zone 1 Roots: Level ${roots.observed_level}${greyTxt}${dyeTxt}`;
    }
    if (activeRegion === "MID_LENGTHS") {
      const dyeTxt = midLengths.existing_artificial_colour ? " • Coloured Dye" : " • Natural Virgin";
      return `Zone 2 Mid-Lengths: Level ${midLengths.observed_level} (${midTone})${dyeTxt}`;
    }
    const dyeTxt = ends.existing_artificial_colour ? " • Coloured Ends" : " • Natural Ends";
    return `Zone 3 Ends: Level ${ends.observed_level} (${endsTone})${dyeTxt}`;
  };

  const diagnosis = getZoneDiagnosis();

  
  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-900 via-neutral-950 to-neutral-900 p-5 sm:p-6 shadow-2xl overflow-hidden w-full ${className}`}
    >
      {/* Background Salon Glow (Reflects current zone colors) */}
      <div
        className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: rootsColors.base }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: endsColors.highlight }}
      />

      {/* Top Header */}
      <div className="flex items-center justify-between w-full mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            Interactive Hair Assessment
          </span>
        </div>
        <span className="text-[10px] font-bold text-neutral-400 bg-neutral-900 px-2.5 py-1 rounded-full border border-neutral-800">
          Touch zone to edit
        </span>
      </div>

      {/* Cartoon Speech / Diagnosis Bubble */}
      <div
        className="relative z-10 w-full mb-3 rounded-2xl border border-amber-500/30 bg-neutral-900/90 px-3.5 py-2 shadow-md flex items-center justify-between gap-2"
        title="Selected Zone Status"
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="text-base animate-bounce">💬</span>
          <p className="font-bold text-white text-[11px] sm:text-xs">
            {diagnosis}
          </p>
        </div>
        
      </div>

      {/* SVG Interactive Cartoon Character with 3 Dedicated Hair Zones */}
      <div className="relative w-68 h-82 select-none group my-1">
        <svg
          viewBox="0 0 280 345"
          className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Zone 1 Roots Gradient */}
            <linearGradient id="avatarRootsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={rootsColors.shadow} />
              <stop offset="45%" stopColor={rootsColors.base} />
              <stop offset="70%" stopColor={rootsColors.highlight} />
              <stop offset="100%" stopColor={rootsColors.shadow} />
            </linearGradient>

            {/* Zone 2 Mid-Lengths Gradient */}
            <linearGradient id="avatarMidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={midColors.shadow} />
              <stop offset="45%" stopColor={midColors.base} />
              <stop offset="70%" stopColor={midColors.highlight} />
              <stop offset="100%" stopColor={midColors.shadow} />
            </linearGradient>

            {/* Zone 3 Ends Gradient */}
            <linearGradient id="avatarEndsGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={endsColors.shadow} />
              <stop offset="45%" stopColor={endsColors.base} />
              <stop offset="70%" stopColor={endsColors.highlight} />
              <stop offset="100%" stopColor={endsColors.shadow} />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="avatarSoftShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* BACK HAIR (Layered Tips / Shoulders) - Zone 3 Trigger */}
          <path
            d="M60 120 C40 180 35 270 70 325 C85 330 90 280 90 240 C90 190 75 140 70 120 Z
               M220 120 C240 180 245 270 210 325 C195 330 190 280 190 240 C190 190 205 140 210 120 Z
               M70 180 Q140 330 210 180 Z"
            fill={endsColors.shadow}
            className="transition-colors duration-500 ease-in-out cursor-pointer"
            onClick={() => handleRegionClick("ENDS")}
          />

          {/* BODY & SALON CAPE */}
          {/* Neck */}
          <path
            d="M110 215 L110 270 Q140 280 170 270 L170 215 Z"
            fill="#d48c63"
            stroke="#b36d43"
            strokeWidth="1.5"
          />
          <path d="M120 260 Q140 268 160 260" stroke="#b36d43" strokeWidth="1.5" fill="none" />

          {/* Salon Cape */}
          <path
            d="M80 270 C80 270 100 255 140 255 C180 255 200 270 200 270 L245 340 L35 340 Z"
            fill="#171717"
            stroke="#262626"
            strokeWidth="2"
          />
          {/* Gold Clasp */}
          <circle cx="140" cy="265" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <path d="M136 265 L144 265" stroke="#78350f" strokeWidth="1.5" />

          {/* CARTOON FACE */}
          <path
            d="M85 130 C85 90 195 90 195 130 C195 190 175 235 140 235 C105 235 85 190 85 130 Z"
            fill="#f5b895"
            stroke="#d48c63"
            strokeWidth="2"
            filter="url(#avatarSoftShadow)"
          />

          {/* Rosy Cheeks */}
          <ellipse cx="104" cy="175" rx="10" ry="6" fill="#f87171" opacity="0.4" />
          <ellipse cx="176" cy="175" rx="10" ry="6" fill="#f87171" opacity="0.4" />

          {/* Ears & Gold Earrings */}
          <ellipse cx="82" cy="148" rx="6" ry="12" fill="#e89e78" />
          <ellipse cx="198" cy="148" rx="6" ry="12" fill="#e89e78" />
          <circle cx="82" cy="162" r="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
          <circle cx="198" cy="162" r="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />

          {/* EYEBROWS (Tinted by Roots Depth) */}
          <path
            d="M98 128 Q115 120 126 126"
            stroke={rootsColors.shadow}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="transition-colors duration-500"
          />
          <path
            d="M154 126 Q165 120 182 128"
            stroke={rootsColors.shadow}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="transition-colors duration-500"
          />

          {/* EXPRESSIVE CARTOON EYES (Hardware-accelerated blink) */}
          <g className="origin-[114px_145px] animate-[blink_4s_infinite]">
            <ellipse cx="114" cy="146" rx="12" ry="15" fill="#ffffff" stroke="#262626" strokeWidth="1.5" />
            <ellipse cx="115" cy="146" rx="8" ry="10" fill="#2e1a0f" />
            <circle cx="115" cy="146" r="4.5" fill="#000000" />
            <circle cx="112" cy="142" r="3.5" fill="#ffffff" />
            <circle cx="118" cy="150" r="1.5" fill="#ffffff" />
            <path d="M103 139 Q115 133 126 139" stroke="#171717" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M125 137 L129 133" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          <g className="origin-[166px_145px] animate-[blink_4s_infinite]">
            <ellipse cx="166" cy="146" rx="12" ry="15" fill="#ffffff" stroke="#262626" strokeWidth="1.5" />
            <ellipse cx="165" cy="146" rx="8" ry="10" fill="#2e1a0f" />
            <circle cx="165" cy="146" r="4.5" fill="#000000" />
            <circle cx="162" cy="142" r="3.5" fill="#ffffff" />
            <circle cx="168" cy="150" r="1.5" fill="#ffffff" />
            <path d="M154 139 Q165 133 177 139" stroke="#171717" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M176 137 L180 133" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Cute Nose */}
          <path d="M138 160 Q140 167 143 167" stroke="#b36d43" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Cheerful Smile */}
          <path
            d="M126 186 Q140 200 154 186"
            stroke="#991b1b"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path d="M132 188 Q140 196 148 188" fill="#fda4af" />

          {/* ============================================================== */}
          {/* ZONE 3: ENDS & LOWER TIPS (Tap to edit Ends) */}
          {/* ============================================================== */}
          <g
            onClick={() => handleRegionClick("ENDS")}
            className="cursor-pointer group"
          >
            {/* Left Lower Tip */}
            <path
              d="M58 245 C50 280 60 325 80 335 C88 315 82 285 75 250 Z"
              fill="url(#avatarEndsGradient)"
              stroke={activeRegion === "ENDS" ? "#f59e0b" : endsColors.shadow}
              strokeWidth={activeRegion === "ENDS" ? "3.5" : "1.5"}
              className="transition-all duration-500 ease-in-out hover:brightness-125"
            />
            {/* Right Lower Tip */}
            <path
              d="M222 245 C230 280 220 325 200 335 C192 315 198 285 205 250 Z"
              fill="url(#avatarEndsGradient)"
              stroke={activeRegion === "ENDS" ? "#f59e0b" : endsColors.shadow}
              strokeWidth={activeRegion === "ENDS" ? "3.5" : "1.5"}
              className="transition-all duration-500 ease-in-out hover:brightness-125"
            />

            {/* Zone 3 Indicator Pin */}
            <g transform="translate(56, 290)">
              <circle
                r="11"
                fill={activeRegion === "ENDS" ? "#f59e0b" : "#171717"}
                stroke="#ffffff"
                strokeWidth="2"
                className={activeRegion === "ENDS" ? "animate-pulse" : ""}
              />
              <text
                textAnchor="middle"
                dy="4"
                fill={activeRegion === "ENDS" ? "#000000" : "#ffffff"}
                fontSize="10"
                fontWeight="900"
              >
                3
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* ZONE 2: MID-LENGTHS (Cascading Locks - Tap to edit Mid-Lengths) */}
          {/* ============================================================== */}
          <g
            onClick={() => handleRegionClick("MID_LENGTHS")}
            className="cursor-pointer group"
          >
            {/* Left Cascading Wave */}
            <path
              d="M68 115 C52 145 45 205 62 255 C74 255 78 200 80 155 C80 120 74 116 68 115 Z"
              fill="url(#avatarMidGradient)"
              stroke={activeRegion === "MID_LENGTHS" ? "#f59e0b" : midColors.shadow}
              strokeWidth={activeRegion === "MID_LENGTHS" ? "3.5" : "1.5"}
              className="transition-all duration-500 ease-in-out hover:brightness-125"
            />
            {/* Right Cascading Wave */}
            <path
              d="M212 115 C228 145 235 205 218 255 C206 255 202 200 200 155 C200 120 206 116 212 115 Z"
              fill="url(#avatarMidGradient)"
              stroke={activeRegion === "MID_LENGTHS" ? "#f59e0b" : midColors.shadow}
              strokeWidth={activeRegion === "MID_LENGTHS" ? "3.5" : "1.5"}
              className="transition-all duration-500 ease-in-out hover:brightness-125"
            />
            {/* Side Highlights */}
            <path d="M60 170 Q70 190 65 210 Q62 190 60 170" fill={midColors.highlight} opacity="0.6" />
            <path d="M220 170 Q210 190 215 210 Q218 190 220 170" fill={midColors.highlight} opacity="0.6" />

            {/* Zone 2 Indicator Pin */}
            <g transform="translate(46, 175)">
              <circle
                r="11"
                fill={activeRegion === "MID_LENGTHS" ? "#f59e0b" : "#171717"}
                stroke="#ffffff"
                strokeWidth="2"
                className={activeRegion === "MID_LENGTHS" ? "animate-pulse" : ""}
              />
              <text
                textAnchor="middle"
                dy="4"
                fill={activeRegion === "MID_LENGTHS" ? "#000000" : "#ffffff"}
                fontSize="10"
                fontWeight="900"
              >
                2
              </text>
            </g>
          </g>

          {/* ============================================================== */}
          {/* ZONE 1: ROOTS & CROWN BANGS (Tap to edit Roots) */}
          {/* ============================================================== */}
          <g
            onClick={() => handleRegionClick("ROOTS")}
            className="cursor-pointer group"
          >
            {/* Main Crown Volume */}
            <path
              d="M68 115 C62 45 105 18 140 18 C175 18 218 45 212 115 C198 80 165 72 140 72 C115 72 82 80 68 115 Z"
              fill="url(#avatarRootsGradient)"
              stroke={activeRegion === "ROOTS" ? "#f59e0b" : rootsColors.shadow}
              strokeWidth={activeRegion === "ROOTS" ? "4" : "2"}
              className="transition-all duration-500 ease-in-out hover:brightness-125"
            />

            {/* Side Bangs / Fringe */}
            <path
              d="M80 95 C100 85 130 92 145 115 C130 110 100 115 85 125 Z"
              fill={rootsColors.base}
              className="transition-colors duration-500 ease-in-out"
            />
            <path
              d="M200 95 C180 85 150 92 135 115 C150 110 180 115 195 125 Z"
              fill={rootsColors.base}
              className="transition-colors duration-500 ease-in-out"
            />

            {/* Grey Hair Silver Strands (Visible when grey_percentage > 0) */}
            {roots.grey_percentage && roots.grey_percentage > 0 && (
              <g opacity={roots.grey_percentage >= 50 ? "0.9" : "0.6"}>
                <path d="M100 50 Q130 35 160 50" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="3,3" fill="none" />
                <path d="M110 65 Q140 50 170 65" stroke="#f1f5f9" strokeWidth="1.5" strokeDasharray="4,2" fill="none" />
                <path d="M88 85 Q110 75 135 88" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,3" fill="none" />
                <path d="M145 88 Q170 75 192 85" stroke="#ffffff" strokeWidth="1.2" strokeDasharray="2,3" fill="none" />
              </g>
            )}

            {/* Crown Specular Sheen Arc */}
            <path
              d="M95 50 Q140 38 185 50 Q140 45 95 50"
              fill={rootsColors.highlight}
              opacity="0.8"
              className="transition-all duration-500"
            />

            {/* Zone 1 Indicator Pin */}
            <g transform="translate(140, 52)">
              <circle
                r="12"
                fill={activeRegion === "ROOTS" ? "#f59e0b" : "#171717"}
                stroke="#ffffff"
                strokeWidth="2"
                className={activeRegion === "ROOTS" ? "animate-pulse" : ""}
              />
              <text
                textAnchor="middle"
                dy="4"
                fill={activeRegion === "ROOTS" ? "#000000" : "#ffffff"}
                fontSize="11"
                fontWeight="900"
              >
                1
              </text>
            </g>
          </g>
        </svg>

        {/* Active Zone Floating Floating Badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-lg">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
            style={{
              backgroundColor:
                activeRegion === "ROOTS"
                  ? rootsColors.base
                  : activeRegion === "MID_LENGTHS"
                  ? midColors.base
                  : endsColors.base,
            }}
          />
          <span className="font-black text-amber-400">
            {activeRegion === "ROOTS" && `Roots L${roots.observed_level}`}
            {activeRegion === "MID_LENGTHS" && `Mid L${midLengths.observed_level}`}
            {activeRegion === "ENDS" && `Ends L${ends.observed_level}`}
          </span>
        </div>
      </div>

      {/* Tactile 3-Zone Switcher Cards (1. Roots, 2. Middle, 3. Ends) */}
      <div className="grid grid-cols-3 gap-2 w-full mt-3">
        {/* Roots Card */}
        <button
          type="button"
          onClick={() => handleRegionClick("ROOTS")}
          className={`flex flex-col items-center rounded-2xl p-2.5 border transition-all text-left ${
            activeRegion === "ROOTS"
              ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
              : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: rootsColors.base }}
            />
            <span className="text-xs font-black text-white">1. Roots</span>
          </div>
          <span className="text-[10px] text-neutral-300 font-bold">Scalp Regrowth</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-black text-amber-400 font-mono">
              L{roots.observed_level}
            </span>
            {roots.grey_percentage ? (
              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold border border-neutral-700">
                {roots.grey_percentage}%
              </span>
            ) : null}
          </div>
        </button>

        {/* Middle Card */}
        <button
          type="button"
          onClick={() => handleRegionClick("MID_LENGTHS")}
          className={`flex flex-col items-center rounded-2xl p-2.5 border transition-all text-left ${
            activeRegion === "MID_LENGTHS"
              ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
              : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: midColors.base }}
            />
            <span className="text-xs font-black text-white">2. Middle</span>
          </div>
          <span className="text-[10px] text-neutral-300 font-bold">Mid-Lengths</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-black text-amber-400 font-mono">
              L{midLengths.observed_level}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold border border-neutral-700">
              {midLengths.existing_artificial_colour ? "Dye" : "Virgin"}
            </span>
          </div>
        </button>

        {/* Ends Card */}
        <button
          type="button"
          onClick={() => handleRegionClick("ENDS")}
          className={`flex flex-col items-center rounded-2xl p-2.5 border transition-all text-left ${
            activeRegion === "ENDS"
              ? "border-amber-400 bg-amber-500/20 shadow-lg ring-2 ring-amber-400 scale-[1.02]"
              : "border-neutral-800 bg-neutral-900/70 hover:bg-neutral-800"
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <span
              className="h-2.5 w-2.5 rounded-full ring-1 ring-white/40"
              style={{ backgroundColor: endsColors.base }}
            />
            <span className="text-xs font-black text-white">3. Ends</span>
          </div>
          <span className="text-[10px] text-neutral-300 font-bold">Hair Ends</span>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[10px] font-black text-amber-400 font-mono">
              L{ends.observed_level}
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-bold border border-neutral-700">
              {ends.existing_artificial_colour ? "Dye" : "Virgin"}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
