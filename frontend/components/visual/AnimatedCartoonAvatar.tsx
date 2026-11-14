"use client";

import React from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { computeHairColorimetry } from "../../services/hairColorimetryService";

interface AnimatedCartoonAvatarProps {
  level: UniversalLevel;
  primaryTone: ToneFamily;
  secondaryTone?: ToneFamily | null;
  intensity?: ToneIntensity;
  onLevelChange?: (newLevel: UniversalLevel) => void;
  className?: string;
}

export function AnimatedCartoonAvatar({
  level,
  primaryTone,
  secondaryTone,
  intensity = "STANDARD",
  onLevelChange,
  className = "",
}: AnimatedCartoonAvatarProps) {
  
  // Compute accurate depth x tone colorimetry
  const colorimetry = computeHairColorimetry(level, primaryTone, secondaryTone, intensity);

  // Key to restart micro-animations whenever shade or depth shifts
  const animKey = `${level}-${primaryTone}-${secondaryTone || "none"}-${intensity}`;

  
  const handleLevelStep = (step: number) => {
    const next = Math.max(1, Math.min(10, level + step)) as UniversalLevel;
    if (next !== level && onLevelChange) {
      
      onLevelChange(next);
    }
  };

  return (
    <div
      className={`relative flex flex-col items-center rounded-3xl border border-neutral-800 bg-linear-to-b from-neutral-900 via-neutral-950 to-neutral-900 p-5 sm:p-6 shadow-2xl overflow-hidden ${className}`}
    >
      {/* Background Salon Glow */}
      <div
        className="absolute -top-20 -left-20 w-64 h-64 rounded-full blur-3xl opacity-25 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: colorimetry.baseHex }}
      />
      <div
        className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: colorimetry.highlightHex }}
      />

      {/* Header */}
      <div className="flex items-center justify-between w-full mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <span className="text-xs font-black uppercase tracking-wider text-amber-400">
            Live Cartoon Hair Simulation
          </span>
        </div>
        
      </div>

      {/* Cartoon Speech / Reaction Bubble */}
      <div
        
        className="cursor-pointer relative z-10 w-full mb-3 rounded-2xl border border-amber-500/30 bg-neutral-900/90 px-3.5 py-2 shadow-md hover:border-amber-400 transition-all flex items-center justify-between gap-2"
        
      >
        <div className="flex items-center gap-2 text-xs">
          <span className="text-base animate-bounce">💬</span>
          <p className="font-bold text-white text-[11px] sm:text-xs">
            {colorimetry.reactionSpeechEn}
          </p>
        </div>
        
      </div>

      {/* SVG Animated Cartoon Character */}
      <div
        
        className="cursor-pointer relative w-68 h-82 select-none group"
      >
        {/* Floating Sparkles triggered on color change */}
        <div
          key={`sparkle-${animKey}`}
          className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center animate-[pulse_0.9s_ease-out_1]"
        >
          <span className="absolute top-8 left-6 text-xl text-yellow-300 animate-ping">✨</span>
          <span className="absolute top-12 right-6 text-lg text-amber-400 animate-pulse">⭐</span>
          <span className="absolute bottom-20 left-10 text-xl text-pink-300 animate-bounce">✨</span>
          <span className="absolute bottom-24 right-10 text-base text-yellow-200 animate-ping">💫</span>
        </div>

        <svg
          viewBox="0 0 280 340"
          className="w-full h-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Dynamic Hair Fiber Gradient */}
            <linearGradient id="hairGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={colorimetry.shadowHex} />
              <stop offset="45%" stopColor={colorimetry.baseHex} />
              <stop offset="70%" stopColor={colorimetry.highlightHex} />
              <stop offset="100%" stopColor={colorimetry.shadowHex} />
            </linearGradient>

            {/* Gloss Sweeping Highlight Mask */}
            <linearGradient id="glossSweep" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="white" stopOpacity="0" />
              <stop offset="50%" stopColor="white" stopOpacity="0.45" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </linearGradient>

            {/* Soft Shadow Filter */}
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* 1. BACK HAIR (Background flow) */}
          <path
            d="M60 120 C40 180 35 270 70 325 C85 330 90 280 90 240 C90 190 75 140 70 120 Z
               M220 120 C240 180 245 270 210 325 C195 330 190 280 190 240 C190 190 205 140 210 120 Z
               M70 180 Q140 330 210 180 Z"
            fill={colorimetry.shadowHex}
            className="transition-colors duration-700 ease-in-out"
          />

          {/* 2. BODY & SALON CAPE */}
          {/* Neck */}
          <path
            d="M110 215 L110 270 Q140 280 170 270 L170 215 Z"
            fill="#d48c63"
            stroke="#b36d43"
            strokeWidth="1.5"
          />
          {/* Collarbones */}
          <path d="M120 260 Q140 268 160 260" stroke="#b36d43" strokeWidth="1.5" fill="none" />

          {/* Salon Cape / Dress */}
          <path
            d="M80 270 C80 270 100 255 140 255 C180 255 200 270 200 270 L245 340 L35 340 Z"
            fill="#171717"
            stroke="#262626"
            strokeWidth="2"
          />
          {/* Gold Salon Clasp */}
          <circle cx="140" cy="265" r="7" fill="#f59e0b" stroke="#d97706" strokeWidth="2" />
          <path d="M136 265 L144 265" stroke="#78350f" strokeWidth="1.5" />

          {/* 3. CARTOON FACE */}
          <path
            d="M85 130 C85 90 195 90 195 130 C195 190 175 235 140 235 C105 235 85 190 85 130 Z"
            fill="#f5b895"
            stroke="#d48c63"
            strokeWidth="2"
            filter="url(#softShadow)"
          />

          {/* Cute Rosy Cheeks */}
          <ellipse cx="104" cy="175" rx="10" ry="6" fill="#f87171" opacity="0.4" />
          <ellipse cx="176" cy="175" rx="10" ry="6" fill="#f87171" opacity="0.4" />

          {/* Cartoon Ears & Gold Hoop Earrings */}
          <ellipse cx="82" cy="148" rx="6" ry="12" fill="#e89e78" />
          <ellipse cx="198" cy="148" rx="6" ry="12" fill="#e89e78" />
          {/* Earrings */}
          <circle cx="82" cy="162" r="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />
          <circle cx="198" cy="162" r="6" fill="none" stroke="#f59e0b" strokeWidth="2.5" />

          {/* EYEBROWS (Tinted slightly to match hair level) */}
          <path
            d="M98 128 Q115 120 126 126"
            stroke={colorimetry.shadowHex}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="transition-colors duration-700"
          />
          <path
            d="M154 126 Q165 120 182 128"
            stroke={colorimetry.shadowHex}
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
            className="transition-colors duration-700"
          />

          {/* EXPRESSIVE CARTOON EYES (Natural blinking animation) */}
          {/* Left Eye */}
          <g className="origin-[114px_145px] animate-[blink_4s_infinite]">
            <ellipse cx="114" cy="146" rx="12" ry="15" fill="#ffffff" stroke="#262626" strokeWidth="1.5" />
            {/* Iris */}
            <ellipse cx="115" cy="146" rx="8" ry="10" fill="#2e1a0f" />
            {/* Pupil */}
            <circle cx="115" cy="146" r="4.5" fill="#000000" />
            {/* Sparkle Highlights */}
            <circle cx="112" cy="142" r="3.5" fill="#ffffff" />
            <circle cx="118" cy="150" r="1.5" fill="#ffffff" />
            {/* Eyelashes */}
            <path d="M103 139 Q115 133 126 139" stroke="#171717" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M125 137 L129 133" stroke="#171717" strokeWidth="1.5" strokeLinecap="round" />
          </g>

          {/* Right Eye */}
          <g className="origin-[166px_145px] animate-[blink_4s_infinite]">
            <ellipse cx="166" cy="146" rx="12" ry="15" fill="#ffffff" stroke="#262626" strokeWidth="1.5" />
            {/* Iris */}
            <ellipse cx="165" cy="146" rx="8" ry="10" fill="#2e1a0f" />
            {/* Pupil */}
            <circle cx="165" cy="146" r="4.5" fill="#000000" />
            {/* Sparkle Highlights */}
            <circle cx="162" cy="142" r="3.5" fill="#ffffff" />
            <circle cx="168" cy="150" r="1.5" fill="#ffffff" />
            {/* Eyelashes */}
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

          {/* 4. MAIN HAIR LAYERS (Crown, Bangs & Flowing Locks) */}
          {/* Main Crown Volume */}
          <path
            d="M68 115 C62 45 105 18 140 18 C175 18 218 45 212 115 C198 80 165 72 140 72 C115 72 82 80 68 115 Z"
            fill="url(#hairGradient)"
            stroke={colorimetry.shadowHex}
            strokeWidth="2"
            className="transition-all duration-700 ease-in-out"
          />

          {/* Left Flowing Lock */}
          <path
            d="M68 115 C52 145 45 205 62 255 C74 255 78 200 80 155 C80 120 74 116 68 115 Z"
            fill="url(#hairGradient)"
            stroke={colorimetry.shadowHex}
            strokeWidth="1.5"
            className="transition-all duration-700 ease-in-out origin-[68px_115px] hover:scale-105"
          />

          {/* Right Flowing Lock */}
          <path
            d="M212 115 C228 145 235 205 218 255 C206 255 202 200 200 155 C200 120 206 116 212 115 Z"
            fill="url(#hairGradient)"
            stroke={colorimetry.shadowHex}
            strokeWidth="1.5"
            className="transition-all duration-700 ease-in-out origin-[212px_115px] hover:scale-105"
          />

          {/* Chic Side Bangs / Fringe */}
          <path
            d="M80 95 C100 85 130 92 145 115 C130 110 100 115 85 125 Z"
            fill={colorimetry.baseHex}
            className="transition-colors duration-700 ease-in-out"
          />
          <path
            d="M200 95 C180 85 150 92 135 115 C150 110 180 115 195 125 Z"
            fill={colorimetry.baseHex}
            className="transition-colors duration-700 ease-in-out"
          />

          {/* Flowing Lower Locks (Layered Ends) */}
          <path
            d="M58 245 C50 280 60 325 80 335 C88 315 82 285 75 250 Z"
            fill={colorimetry.baseHex}
            className="transition-colors duration-700 ease-in-out"
          />
          <path
            d="M222 245 C230 280 220 325 200 335 C192 315 198 285 205 250 Z"
            fill={colorimetry.baseHex}
            className="transition-colors duration-700 ease-in-out"
          />

          {/* 5. DYNAMIC HAIR SHEEN & SPECULAR HIGHLIGHT */}
          {/* Top Crown Sheen Arc */}
          <path
            d="M95 50 Q140 38 185 50 Q140 45 95 50"
            fill={colorimetry.highlightHex}
            opacity="0.8"
            className="transition-all duration-700"
          />
          {/* Side Wave Highlights */}
          <path
            d="M60 170 Q70 190 65 210 Q62 190 60 170"
            fill={colorimetry.highlightHex}
            opacity="0.6"
            className="transition-all duration-700"
          />
          <path
            d="M220 170 Q210 190 215 210 Q218 190 220 170"
            fill={colorimetry.highlightHex}
            opacity="0.6"
            className="transition-all duration-700"
          />

          {/* Sweeping Gloss Shine Animation on color change */}
          <ellipse
            key={`gloss-${animKey}`}
            cx="140"
            cy="65"
            rx="60"
            ry="18"
            fill="url(#glossSweep)"
            className="animate-[pulse_0.9s_ease-in-out_1]"
          />
        </svg>

        {/* Level Tag floating on top right of avatar */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white font-mono text-xs shadow-lg">
          <span
            className="h-2.5 w-2.5 rounded-full ring-1 ring-white/50"
            style={{ backgroundColor: colorimetry.baseHex }}
          />
          <span className="font-black text-amber-400">Level {level}</span>
        </div>
      </div>

      {/* Interactive Depth Level Control (+ / - and Slider) */}
      <div className="w-full mt-3 rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
            <span>🎚️</span> Depth Level: <strong>Level {level}</strong>
          </span>
          <span className="text-[10px] text-neutral-400 font-mono">
            {colorimetry.undertoneSummaryEn}
          </span>
        </div>

        {/* Level Stepper Buttons & Slider */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLevelStep(-1)}
            disabled={level <= 1}
            className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-white font-black flex items-center justify-center transition-all"
            title="Darker Level (-)"
          >
            -
          </button>

          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={level}
            onChange={(e) => onLevelChange?.(Number(e.target.value) as UniversalLevel)}
            className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />

          <button
            type="button"
            onClick={() => handleLevelStep(1)}
            disabled={level >= 10}
            className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 disabled:hover:bg-neutral-800 text-white font-black flex items-center justify-center transition-all"
            title="Lighter Level (+)"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
