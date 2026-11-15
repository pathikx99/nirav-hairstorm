"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { LightingMode, ViewAngle } from "../../context/AppContext";
import { AvatarZone } from "./RealisticAvatar";
import { SkinTone, getSkinToneConfig } from "../../constants/skinTones";

interface CgiRealisticHairCanvasProps {
  rootsColor: string;
  midColor: string;
  endsColor: string;
  skinTone?: SkinTone;
  lightingMode?: LightingMode;
  viewAngle?: ViewAngle;
  activeRegion?: AvatarZone;
  onSelectRegion?: (region: AvatarZone) => void;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface LayerCache {
  width: number;
  height: number;
  alpha: Uint8ClampedArray;
  luminance: Uint8ClampedArray;
  zones: Uint8ClampedArray;
  specular: Uint8ClampedArray;
  faceBody: Uint8ClampedArray;
  skinMask: Uint8ClampedArray;
}

export function CgiRealisticHairCanvas({
  rootsColor,
  midColor,
  endsColor,
  skinTone = "MEDIUM",
  lightingMode = "DAYLIGHT",
  viewAngle = "FRONT",
  activeRegion,
  onSelectRegion,
  className = "",
}: CgiRealisticHairCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheRef = useRef<{ FRONT?: LayerCache; BACK?: LayerCache }>({});
  const [loadedView, setLoadedView] = useState<ViewAngle | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Preload and cache raw pixel arrays for front/back
  useEffect(() => {
    let isCancelled = false;

    async function loadLayers(angle: ViewAngle) {
      if (cacheRef.current[angle]) {
        if (!isCancelled) {
          setLoadedView(angle);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const prefix = angle === "FRONT" ? "avatar_front" : "avatar_back";

      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = reject;
        });
      };

      try {
        const [faceBodyImg, alphaImg, lumImg, zonesImg, specImg, skinImg] =
          await Promise.all([
            loadImg(`/avatar/${prefix}_face_body.png`),
            loadImg(`/avatar/${prefix}_hair_alpha.png`),
            loadImg(`/avatar/${prefix}_hair_luminance.png`),
            loadImg(`/avatar/${prefix}_hair_zones.png`),
            loadImg(`/avatar/${prefix}_hair_specular.png`),
            loadImg(`/avatar/${prefix}_skin_mask.png`),
          ]);

        if (isCancelled) return;

        const w = 720;
        const h = 720;

        const offCanvas = document.createElement("canvas");
        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        const getPixels = (img: HTMLImageElement) => {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(img, 0, 0, w, h);
          return ctx.getImageData(0, 0, w, h).data;
        };

        const faceBody = getPixels(faceBodyImg);
        const alpha = getPixels(alphaImg);
        const luminance = getPixels(lumImg);
        const zones = getPixels(zonesImg);
        const specular = getPixels(specImg);
        const skinMask = getPixels(skinImg);

        cacheRef.current[angle] = {
          width: w,
          height: h,
          alpha,
          luminance,
          zones,
          specular,
          faceBody,
          skinMask,
        };

        if (!isCancelled) {
          setLoadedView(angle);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load realistic avatar asset layers:", err);
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadLayers(viewAngle);

    return () => {
      isCancelled = true;
    };
  }, [viewAngle]);

  // Fast compositor render pass (Runs at 60 FPS)
  const renderCompositor = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cache = cacheRef.current[viewAngle];
    if (!cache) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, alpha, luminance, zones, specular, faceBody, skinMask } = cache;

    const [rawRootsR, rawRootsG, rawRootsB] = hexToRgb(rootsColor);
    const [rawMidR, rawMidG, rawMidB] = hexToRgb(midColor);
    const [rawEndsR, rawEndsG, rawEndsB] = hexToRgb(endsColor);

    // Physical Lighting Metamerism Spectral Shift Multipliers (Planckian CCT transform)
    // Daylight 6500K: Neutral D65 balance (1.0, 1.0, 1.0)
    // Warm Salon 3000K: Halogen long-wavelength shift (+16% Red, +6% Green, -24% Blue)
    // Cool Indoor 4000K: Fluorescent blue/cyan spike (-12% Red, +2% Green, +18% Blue)
    let metaR = 1.0;
    let metaG = 1.0;
    let metaB = 1.0;
    let lusterR = 1.0;
    let lusterG = 1.0;
    let lusterB = 1.0;
    let lusterBoost = 0.36;

    if (lightingMode === "WARM") {
      metaR = 1.16;
      metaG = 1.06;
      metaB = 0.76;
      lusterR = 1.08;
      lusterG = 0.96;
      lusterB = 0.72;
      lusterBoost = 0.48; // Enhanced warm spotlight luster
    } else if (lightingMode === "COOL") {
      metaR = 0.88;
      metaG = 1.02;
      metaB = 1.18;
      lusterR = 0.84;
      lusterG = 0.94;
      lusterB = 1.14;
      lusterBoost = 0.32; // Crisp cool silver/blue luster
    }

    const rRoots = Math.min(255, Math.round(rawRootsR * metaR));
    const gRoots = Math.min(255, Math.round(rawRootsG * metaG));
    const bRoots = Math.max(0, Math.round(rawRootsB * metaB));

    const rMid = Math.min(255, Math.round(rawMidR * metaR));
    const gMid = Math.min(255, Math.round(rawMidG * metaG));
    const bMid = Math.max(0, Math.round(rawMidB * metaB));

    const rEnds = Math.min(255, Math.round(rawEndsR * metaR));
    const gEnds = Math.min(255, Math.round(rawEndsG * metaG));
    const bEnds = Math.max(0, Math.round(rawEndsB * metaB));

    // Skin tone adjustment multiplier
    const skinConfig = getSkinToneConfig(skinTone);
    const [targetSkinR, targetSkinG, targetSkinB] = hexToRgb(skinConfig.faceHex);
    // Base reference character skin tone is around [246, 196, 158]
    const skinFactorR = targetSkinR / 246;
    const skinFactorG = targetSkinG / 196;
    const skinFactorB = targetSkinB / 158;

    const outputImgData = ctx.createImageData(width, height);
    const out = outputImgData.data;

    const numPixels = width * height;

    for (let p = 0; p < numPixels; p++) {
      const i = p * 4;

      const hairA = alpha[i];
      const fbA = faceBody[i + 3];

      // Hair shading
      if (hairA > 0) {
        // Zone weights: R=Roots, G=Mid, B=Ends
        // hair_zones image is RGB
        const wR = zones[i] / 255;
        const wG = zones[i + 1] / 255;
        const wB = zones[i + 2] / 255;

        // Interpolated Target Color
        const tr = (wR * rRoots + wG * rMid + wB * rEnds) / 255;
        const tg = (wR * gRoots + wG * gMid + wB * gEnds) / 255;
        const tb = (wR * bRoots + wG * bMid + wB * bEnds) / 255;

        // Strand Luminance (0 to 1) representing volumetric depth and strand definition
        const L = luminance[i] / 255;

        // Chemical Hair Shading:
        // Deep strand crevices: ambient factor 0.38 (deep, rich shadowed version of target tone)
        // Strand wave crests: ambient factor 1.0 (vibrant target tone)
        const ambientFactor = 0.38 + 0.62 * L;
        let outR = tr * ambientFactor;
        let outG = tg * ambientFactor;
        let outB = tb * ambientFactor;

        // Specular cuticle luster (anisotropic shine reacting to metamerism lighting)
        const spec = specular[i] / 255;
        if (spec > 0.04) {
          const specBoost = spec * lusterBoost;
          outR = Math.min(1.0, outR + specBoost * lusterR);
          outG = Math.min(1.0, outG + specBoost * lusterG);
          outB = Math.min(1.0, outB + specBoost * lusterB);
        }

        out[i] = Math.round(outR * 255);
        out[i + 1] = Math.round(outG * 255);
        out[i + 2] = Math.round(outB * 255);
        out[i + 3] = hairA;
      }

      // Overlay Face and Body Plate (Preserves 100% skin, eyes, lips, and dress)
      if (fbA > 0) {
        let fR = faceBody[i];
        let fG = faceBody[i + 1];
        let fB = faceBody[i + 2];

        // If skin tone selection is not default medium, modulate skin mask area with smooth alpha blend
        const sA = skinMask[i] / 255;
        if (sA > 0.02 && skinTone !== "MEDIUM") {
          const modR = Math.min(255, Math.round(fR * skinFactorR));
          const modG = Math.min(255, Math.round(fG * skinFactorG));
          const modB = Math.min(255, Math.round(fB * skinFactorB));
          fR = Math.round(fR * (1 - sA) + modR * sA);
          fG = Math.round(fG * (1 - sA) + modG * sA);
          fB = Math.round(fB * (1 - sA) + modB * sA);
        }

        // Ambient lighting tone on skin and face
        if (lightingMode === "WARM") {
          fR = Math.min(255, Math.round(fR * 1.03));
          fG = Math.min(255, Math.round(fG * 1.01));
          fB = Math.max(0, Math.round(fB * 0.96));
        } else if (lightingMode === "COOL") {
          fR = Math.max(0, Math.round(fR * 0.97));
          fG = Math.min(255, Math.round(fG * 1.00));
          fB = Math.min(255, Math.round(fB * 1.03));
        }

        const alphaNorm = fbA / 255;
        if (alphaNorm >= 0.99) {
          out[i] = fR;
          out[i + 1] = fG;
          out[i + 2] = fB;
          out[i + 3] = 255;
        } else {
          // Alpha compositing
          const bgA = out[i + 3] / 255;
          const finalA = alphaNorm + bgA * (1 - alphaNorm);
          out[i] = Math.round((fR * alphaNorm + out[i] * bgA * (1 - alphaNorm)) / finalA);
          out[i + 1] = Math.round((fG * alphaNorm + out[i + 1] * bgA * (1 - alphaNorm)) / finalA);
          out[i + 2] = Math.round((fB * alphaNorm + out[i + 2] * bgA * (1 - alphaNorm)) / finalA);
          out[i + 3] = Math.round(finalA * 255);
        }
      }
    }

    ctx.putImageData(outputImgData, 0, 0);
  }, [rootsColor, midColor, endsColor, skinTone, lightingMode, viewAngle]);

  useEffect(() => {
    if (loadedView === viewAngle) {
      renderCompositor();
    }
  }, [loadedView, viewAngle, renderCompositor]);

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      {/* Loading Skeleton Indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm z-20 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-[11px] font-mono text-neutral-300">Rendering 3D Hair Strands...</span>
          </div>
        </div>
      )}

      {/* Hardware-Accelerated 720p Canvas */}
      <canvas
        ref={canvasRef}
        width={720}
        height={720}
        className="w-full h-full object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] rounded-2xl"
      />

      {/* Interactive 3-Zone Touch Pins (Overlay on Top of Real Hair) */}
      {onSelectRegion && (
        <div className="absolute inset-0 pointer-events-none">
          {viewAngle === "FRONT" ? (
            <>
              {/* Zone 1: Roots Pin */}
              <button
                type="button"
                onClick={() => onSelectRegion("ROOTS")}
                className={`pointer-events-auto absolute left-[48%] top-[12%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "ROOTS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 1: Roots & Scalp Regrowth"
              >
                1
              </button>

              {/* Zone 2: Mid-Lengths Pin */}
              <button
                type="button"
                onClick={() => onSelectRegion("MID_LENGTHS")}
                className={`pointer-events-auto absolute left-[22%] top-[45%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "MID_LENGTHS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 2: Mid-Lengths Wavy Strands"
              >
                2
              </button>

              {/* Zone 3: Ends Pin */}
              <button
                type="button"
                onClick={() => onSelectRegion("ENDS")}
                className={`pointer-events-auto absolute left-[25%] top-[78%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "ENDS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 3: Ends & Tips"
              >
                3
              </button>
            </>
          ) : (
            <>
              {/* Back View Zone 1: Roots */}
              <button
                type="button"
                onClick={() => onSelectRegion("ROOTS")}
                className={`pointer-events-auto absolute left-[50%] top-[14%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "ROOTS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 1: Back Crown Roots"
              >
                1
              </button>

              {/* Back View Zone 2: Mid-Lengths */}
              <button
                type="button"
                onClick={() => onSelectRegion("MID_LENGTHS")}
                className={`pointer-events-auto absolute left-[50%] top-[40%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "MID_LENGTHS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 2: Back Wave Waterfall"
              >
                2
              </button>

              {/* Back View Zone 3: Ends */}
              <button
                type="button"
                onClick={() => onSelectRegion("ENDS")}
                className={`pointer-events-auto absolute left-[50%] top-[66%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                  activeRegion === "ENDS"
                    ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                    : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                }`}
                title="Zone 3: Back Tips & Curls"
              >
                3
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
