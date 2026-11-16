"use client";

import React, { useEffect, useRef, useState } from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import {
  computeHairColorimetry,
  applyMetamerism,
  getSalonShadeCode,
} from "../../services/hairColorimetryService";
import { LightingMode, useApp } from "../../context/AppContext";

interface HairStrandMacroStudioProps {
  level?: UniversalLevel;
  primaryTone?: ToneFamily;
  secondaryTone?: ToneFamily | null;
  intensity?: ToneIntensity;
  technique?: ApplicationTechnique;
  lightingMode?: LightingMode;
  onLightingModeChange?: (mode: LightingMode) => void;
  greyPercentage?: number;
  className?: string;
  showLightingComparison?: boolean;
}

export function HairStrandMacroStudio({
  level = 1,
  primaryTone = "NATURAL",
  secondaryTone = null,
  intensity = "STANDARD",
  technique = "ALL_OVER",
  lightingMode: propLightingMode,
  onLightingModeChange,
  greyPercentage = 0,
  className = "",
  showLightingComparison = true,
}: HairStrandMacroStudioProps) {
  const context = useApp();
  const [internalLight, setInternalLight] = useState<LightingMode | null>(null);
  const activeLight = propLightingMode ?? internalLight ?? context.lightingMode ?? "DAYLIGHT";

  const handleSelectLighting = (mode: LightingMode) => {
    setInternalLight(mode);
    if (onLightingModeChange) {
      onLightingModeChange(mode);
    }
    if (context?.setLightingMode) {
      context.setLightingMode(mode);
    }
  };

  const [strandTexture, setStrandTexture] = useState<"WAVY" | "SILKY_STRAIGHT" | "CURLY">("WAVY");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Compute colorimetry for target look
  const colorimetry = computeHairColorimetry(
    level,
    primaryTone,
    secondaryTone,
    intensity
  );

  const shadeInfo = getSalonShadeCode(level, primaryTone, secondaryTone);

  // Environmental metamerism versions
  const sunlightColor = applyMetamerism(colorimetry.baseHex, "DAYLIGHT");
  const insideSalonColor = applyMetamerism(colorimetry.baseHex, "WARM");
  const coolIndoorColor = applyMetamerism(colorimetry.baseHex, "COOL");

  const activeColor =
    activeLight === "WARM"
      ? insideSalonColor
      : activeLight === "COOL"
      ? coolIndoorColor
      : sunlightColor;

  // Render high-definition realistic hair strands on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Deep Volumetric Background
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, "#09090b");
    bgGrad.addColorStop(0.5, "#121217");
    bgGrad.addColorStop(1, "#050507");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Color parsing
    const hex = activeColor.replace("#", "");
    const rBase = parseInt(hex.slice(0, 2), 16);
    const gBase = parseInt(hex.slice(2, 4), 16);
    const bBase = parseInt(hex.slice(4, 6), 16);

    // Light reflection colors
    let shineR = 255;
    let shineG = 255;
    let shineB = 255;
    let lusterStrength = 0.65;

    if (activeLight === "WARM") {
      shineR = 255;
      shineG = 242;
      shineB = 210;
      lusterStrength = 0.78;
    } else if (activeLight === "COOL") {
      shineR = 220;
      shineG = 235;
      shineB = 255;
      lusterStrength = 0.58;
    } else {
      // Sunlight: golden crystalline high-CRI shine
      shineR = 255;
      shineG = 252;
      shineB = 240;
      lusterStrength = 0.85;
    }

    if (technique === "GLOSS_TONING") {
      lusterStrength = Math.min(1.0, lusterStrength + 0.15);
    }

    // 2. Draw Layered Individual Hair Strands (Procedural fiber generation)
    // 350+ individual hair fibers with natural variations in tension and curvature
    const numStrands = 360;

    for (let i = 0; i < numStrands; i++) {
      const strandRatio = i / numStrands;
      const startX = strandRatio * width + (Math.sin(i * 9.7) * 8);

      // Depth variation (some strands deep in shadow, some on surface)
      const depthFactor = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(i * 1.8 + strandRatio * Math.PI));
      
      const isWhiteFiber = greyPercentage > 0 && ((i * 137) % 100 < greyPercentage);
      let strandR: number;
      let strandG: number;
      let strandB: number;
      let alphaVal: number;

      if (isWhiteFiber) {
        // Unpigmented canities hair fiber: high internal light scattering, pearlescent silver-white
        const whiteDepth = 0.65 + 0.35 * depthFactor;
        strandR = Math.round(242 * whiteDepth);
        strandG = Math.round(245 * whiteDepth);
        strandB = Math.round(250 * whiteDepth);
        alphaVal = 0.75 + 0.25 * depthFactor;
      } else {
        strandR = Math.round(rBase * depthFactor);
        strandG = Math.round(gBase * depthFactor);
        strandB = Math.round(bBase * depthFactor);
        alphaVal = 0.4 + 0.5 * depthFactor;
      }

      ctx.beginPath();
      ctx.moveTo(startX, 0);

      if (strandTexture === "WAVY") {
        const waveAmp = 20 + Math.sin(i * 3.3) * 8;
        const waveFreq = 0.015;
        const cp1x = startX + Math.sin(height * 0.25 * waveFreq) * waveAmp;
        const cp1y = height * 0.33;
        const cp2x = startX - Math.sin(height * 0.66 * waveFreq) * waveAmp;
        const cp2y = height * 0.66;
        const endX = startX + Math.sin(height * waveFreq) * waveAmp * 0.8;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height);
      } else if (strandTexture === "CURLY") {
        const curlRadius = 24 + (i % 5) * 4;
        const cp1x = startX + curlRadius;
        const cp1y = height * 0.25;
        const cp2x = startX - curlRadius * 1.2;
        const cp2y = height * 0.55;
        const endX = startX + curlRadius * 0.5;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height);
      } else {
        // Silky Straight
        const drift = (strandRatio - 0.5) * 18 + Math.sin(i * 2.1) * 3;
        ctx.bezierCurveTo(startX, height * 0.4, startX + drift * 0.5, height * 0.7, startX + drift, height);
      }

      ctx.strokeStyle = `rgba(${strandR}, ${strandG}, ${strandB}, ${alphaVal})`;
      ctx.lineWidth = isWhiteFiber ? 1.2 + (i % 3) * 0.3 : 1.0 + (i % 3) * 0.4;
      ctx.stroke();
    }

    // 3. Anisotropic Specular Highlights Along Hair Strands (Marschner Hair Model)
    // Instead of a flat horizontal rectangle (which causes an artificial white line artifact),
    // we trace specular reflections along the actual curved hair fibers with fiber-specific variation.
    const highlightY = height * 0.38;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Ambient soft specular lobe across fiber cluster (subtle radial falloff)
    const clusterGlow = ctx.createRadialGradient(
      width * 0.5,
      highlightY,
      width * 0.05,
      width * 0.5,
      highlightY,
      width * 0.45
    );
    clusterGlow.addColorStop(0, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.14 * lusterStrength})`);
    clusterGlow.addColorStop(0.5, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.05 * lusterStrength})`);
    clusterGlow.addColorStop(1, `rgba(${shineR}, ${shineG}, ${shineB}, 0)`);
    ctx.fillStyle = clusterGlow;
    ctx.fillRect(0, 0, width, height);

    // Fine microscopic specular glints on surface strands (no horizontal line)
    const numGlints = 90;
    for (let g = 0; g < numGlints; g++) {
      const strandIdx = (g * 4 + 7) % numStrands;
      const strandRatio = strandIdx / numStrands;
      const startX = strandRatio * width + Math.sin(strandIdx * 9.7) * 8;
      const strandJitterY = highlightY + Math.sin(g * 3.7) * (height * 0.08);

      ctx.beginPath();
      const glintLen = height * (0.08 + (g % 4) * 0.02);
      ctx.moveTo(startX, strandJitterY - glintLen * 0.5);
      ctx.lineTo(startX + (Math.sin(g * 1.5) * 4), strandJitterY + glintLen * 0.5);
      ctx.strokeStyle = `rgba(${shineR}, ${shineG}, ${shineB}, ${0.12 * lusterStrength + (g % 3) * 0.06})`;
      ctx.lineWidth = 0.8 + (g % 2) * 0.4;
      ctx.stroke();
    }

    // Secondary subtle warm bounce reflection
    const bounceY = height * 0.72;
    const bounceGlow = ctx.createRadialGradient(
      width * 0.5,
      bounceY,
      width * 0.05,
      width * 0.5,
      bounceY,
      width * 0.42
    );
    bounceGlow.addColorStop(0, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.08 * lusterStrength})`);
    bounceGlow.addColorStop(1, `rgba(${shineR}, ${shineG}, ${shineB}, 0)`);
    ctx.fillStyle = bounceGlow;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    // 4. Subtle Vignette Border Shadow
    const vigGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.35, width / 2, height / 2, width * 0.7);
    vigGrad.addColorStop(0, "rgba(0, 0, 0, 0)");
    vigGrad.addColorStop(1, "rgba(0, 0, 0, 0.65)");
    ctx.fillStyle = vigGrad;
    ctx.fillRect(0, 0, width, height);

  }, [activeColor, activeLight, strandTexture, technique]);

  // Natural Remaining Pigment (NRP) under this level
  const nrpMap: Record<UniversalLevel, { pigment: string; counterToner: string; desc: string }> = {
    1: { pigment: "Dense Black-Brown Melanin", counterToner: "None Required", desc: "Maximum pigment density, light absorption" },
    2: { pigment: "Dark Red-Brown", counterToner: "Ash / Green", desc: "Deep eumelanin core" },
    3: { pigment: "Deep Red-Brown", counterToner: "Ash / Blue-Green", desc: "Dark brown base warmth" },
    4: { pigment: "Red Melanin", counterToner: "Green / Ash Matte", desc: "Prominent natural red undertone" },
    5: { pigment: "Red-Orange (Auburn)", counterToner: "Ash-Blue / .1", desc: "Warm auburn lift tone" },
    6: { pigment: "Orange (Copper)", counterToner: "Blue / Ash .1", desc: "Vibrant copper warmth exposed" },
    7: { pigment: "Orange-Yellow (Gold-Orange)", counterToner: "Blue-Violet / Pearl .12", desc: "Warm golden-copper balance" },
    8: { pigment: "Yellow (Gold)", counterToner: "Violet .2 / Lavender", desc: "Pure yellow melanin" },
    9: { pigment: "Pale Yellow", counterToner: "Soft Violet / Pearl .21", desc: "Translucent pale yellow" },
    10: { pigment: "Extra Pale Platinum Ivory", counterToner: "Silver Pearl / .02", desc: "Clean platinum canvas" },
  };

  const nrpInfo = nrpMap[level] || nrpMap[7];

  return (
    <div
      className={`rounded-3xl border border-neutral-800 bg-neutral-950/90 p-4 sm:p-5 shadow-2xl space-y-4 ${className}`}
    >
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-lg border border-amber-500/30">
            🔬
          </span>
          <div>
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <span>Hair Strand Fiber & Macro Color Inspection</span>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                100x Optical View
              </span>
            </h3>
            <p className="text-[11px] text-neutral-400">
              Microscopic strand texture, cuticle fiber luster & multi-light appearance
            </p>
          </div>
        </div>

        {/* Texture Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => setStrandTexture("WAVY")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              strandTexture === "WAVY"
                ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Soft Waves
          </button>
          <button
            type="button"
            onClick={() => setStrandTexture("SILKY_STRAIGHT")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              strandTexture === "SILKY_STRAIGHT"
                ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Silky Straight
          </button>
          <button
            type="button"
            onClick={() => setStrandTexture("CURLY")}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              strandTexture === "CURLY"
                ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Textured Curls
          </button>
        </div>
      </div>

      {/* Main High-Definition Hair Strand Canvas Viewport */}
      <div className="relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-neutral-800 shadow-inner group">
        <canvas
          ref={canvasRef}
          width={720}
          height={320}
          className="w-full h-full object-cover"
        />

        {/* Top Floating Color & Lighting Pill */}
        <div className="absolute top-3 left-3 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/85 backdrop-blur-md border border-white/20 text-white text-xs shadow-lg font-mono">
          <span
            className="w-3 h-3 rounded-full ring-1 ring-white/60"
            style={{ backgroundColor: activeColor }}
          />
          <strong className="text-amber-400 font-black">{shadeInfo.code}</strong>
          <span className="text-neutral-300">• {shadeInfo.name}</span>
          {greyPercentage > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/15 text-white text-[10px] font-black border border-white/30 flex items-center gap-1 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              <span>{greyPercentage}% White Hairs</span>
            </span>
          )}
        </div>

        {/* Bottom Current Environment Indicator */}
        <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-bold text-neutral-300">
          <span>
            {activeLight === "WARM"
              ? "💡 Under Warm Salon Lamp (3000K)"
              : activeLight === "COOL"
              ? "🏢 Under Cool Indoor Light (4000K)"
              : "☀️ In Direct Sunlight (6500K)"}
          </span>
        </div>
      </div>

      {/* Side-by-Side 3-Lighting Real-World Comparison Cards */}
      {showLightingComparison && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>⚖️</span>
              <span>Real-World Lighting Environments:</span>
            </span>
            <span className="text-[10px] text-neutral-500 font-mono">
              See how this color looks outside vs salon vs inside
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* 1. Direct Sunlight */}
            <button
              type="button"
              onClick={() => handleSelectLighting("DAYLIGHT")}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-[0.98] ${
                activeLight === "DAYLIGHT"
                  ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/60"
                  : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900/90 hover:border-neutral-700"
              }`}
              title="Click to view hair color in direct 6500K outdoor sunlight"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <span>☀️</span> Direct Sunlight
                </span>
                <span className="text-[9px] font-mono text-neutral-400">6500K Sun</span>
              </div>
              <div
                className="w-full h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform"
                style={{
                  backgroundColor: sunlightColor,
                  backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0) 70%)`,
                }}
              >
                <span
                  className={`text-[9px] font-black px-2.5 py-0.5 rounded shadow-xs transition-all flex items-center gap-1 ${
                    activeLight === "DAYLIGHT"
                      ? "bg-white text-neutral-950 ring-1 ring-amber-400 scale-105 font-black"
                      : "bg-white/70 text-neutral-950 group-hover:bg-white/90"
                  }`}
                >
                  <span>Sunlit Radiance</span>
                  {activeLight === "DAYLIGHT" && <span className="text-amber-600 font-black">✓</span>}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Max clarity and vibrant reflections under outdoor sky.
              </p>
            </button>

            {/* 2. Inside Warm Salon */}
            <button
              type="button"
              onClick={() => handleSelectLighting("WARM")}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-amber-400 active:scale-[0.98] ${
                activeLight === "WARM"
                  ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/60"
                  : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900/90 hover:border-neutral-700"
              }`}
              title="Click to view hair color inside warm 3000K salon mirror lighting"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <span>💡</span> Inside Salon
                </span>
                <span className="text-[9px] font-mono text-neutral-400">3000K Warm</span>
              </div>
              <div
                className="w-full h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform"
                style={{
                  backgroundColor: insideSalonColor,
                  backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(254, 243, 199, 0.3) 0%, rgba(254, 243, 199, 0) 70%)`,
                }}
              >
                <span
                  className={`text-[9px] font-black px-2.5 py-0.5 rounded shadow-xs transition-all flex items-center gap-1 ${
                    activeLight === "WARM"
                      ? "bg-amber-100 text-neutral-950 ring-1 ring-amber-400 scale-105 font-black"
                      : "bg-amber-100/70 text-neutral-950 group-hover:bg-amber-100/90"
                  }`}
                >
                  <span>Warm Salon Mirror</span>
                  {activeLight === "WARM" && <span className="text-amber-600 font-black">✓</span>}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Golden & amber undertones highlighted by warm halogen lamps.
              </p>
            </button>

            {/* 3. Cool Indoor Office */}
            <button
              type="button"
              onClick={() => handleSelectLighting("COOL")}
              className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer group focus:outline-none focus:ring-2 focus:ring-blue-400 active:scale-[0.98] ${
                activeLight === "COOL"
                  ? "border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/10 ring-1 ring-amber-400/60"
                  : "border-neutral-800 bg-neutral-900/60 hover:bg-neutral-900/90 hover:border-neutral-700"
              }`}
              title="Click to view hair color in 4000K cool indoor/office light"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-blue-300 flex items-center gap-1.5">
                  <span>🏢</span> Inside Cool Light
                </span>
                <span className="text-[9px] font-mono text-neutral-400">4000K Neutral</span>
              </div>
              <div
                className="w-full h-8 rounded-xl border border-white/20 shadow-inner flex items-center justify-center relative overflow-hidden group-hover:scale-[1.01] transition-transform"
                style={{
                  backgroundColor: coolIndoorColor,
                  backgroundImage: `radial-gradient(ellipse at 50% 30%, rgba(224, 231, 255, 0.28) 0%, rgba(224, 231, 255, 0) 70%)`,
                }}
              >
                <span
                  className={`text-[9px] font-black px-2.5 py-0.5 rounded shadow-xs transition-all flex items-center gap-1 ${
                    activeLight === "COOL"
                      ? "bg-blue-50 text-neutral-950 ring-1 ring-blue-400 scale-105 font-black"
                      : "bg-blue-50/70 text-neutral-950 group-hover:bg-blue-50/90"
                  }`}
                >
                  <span>Cool / Ash Reveal</span>
                  {activeLight === "COOL" && <span className="text-blue-600 font-black">✓</span>}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                Reveals clean ash & cancels unwanted brass under office lights.
              </p>
            </button>
          </div>
        </div>
      )}

      {/* Colorimetric Chemical Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-neutral-800 text-xs">
        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Depth Level</span>
          <strong className="text-white font-black text-sm">Level {level}</strong>
          <span className="text-[10px] text-neutral-400 block mt-0.5">{colorimetry.undertoneSummaryEn}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Exposed Pigment (NRP)</span>
          <strong className="text-amber-400 font-bold text-xs">{nrpInfo.pigment}</strong>
          <span className="text-[10px] text-neutral-400 block mt-0.5">{nrpInfo.desc}</span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Counter-Toner</span>
          <strong className="text-indigo-400 font-bold text-xs">{nrpInfo.counterToner}</strong>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Neutralization rule</span>
        </div>

        <div className="p-2.5 rounded-xl bg-neutral-900/50 border border-neutral-800">
          <span className="text-[9px] font-bold text-neutral-500 uppercase block">Cuticle Luster</span>
          <strong className="text-emerald-400 font-bold text-xs">
            {technique === "GLOSS_TONING" ? "Ultra-Glaze 98%" : "High Gloss 88%"}
          </strong>
          <span className="text-[10px] text-neutral-400 block mt-0.5">Anisotropic shine</span>
        </div>
      </div>
    </div>
  );
}
