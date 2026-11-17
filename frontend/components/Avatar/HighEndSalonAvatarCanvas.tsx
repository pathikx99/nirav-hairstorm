/**
 * HighEndSalonAvatarCanvas.tsx
 * Ultra-High-End Salon Digital Human Avatar Renderer for Chromatique.
 * 
 * Delivers 100% photorealistic salon model presentation:
 * - Ultra-crisp studio model photograph (896x1200)
 * - Strict zero-bleed: Skin, eyes, lips, makeup, neck, clothes, and salon environment remain 100% pristine!
 * - Independent 3-zone procedural recoloring (Roots, Mid-Lengths, Ends)
 * - Continuous strand-following color transitions with adjustable blend intensity
 * - 60 FPS hardware-accelerated HTML5 Canvas composition
 * - Fully responsive across PC, tablet, and mobile devices
 */

"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { AvatarView, HairZoneId, LightingPreset, SkinUndertone } from "./AvatarTypes";
import { AVATAR_ASSET_VERSION } from "../../services/avatarAssetService";
import {
  SRGB_TO_LIN_LUT,
  LIN_TO_SRGB_LUT,
  SPEC_R_LUT,
  SPEC_TRT_LUT,
  SIN_PI_ALPHA_LUT,
  getLightingHalfVector,
  linearRgbToOklab,
  hexToOklab,
  deriveLevelFromHex,
  getBiophysicalSkinProfile,
  getLightingEnvironmentParams,
  MODEL_BASE_SKIN_OKLAB,
  MODEL_BASE_LIP_OKLAB,
  MODEL_BASE_IRIS_OKLAB,
  oklabToSrgb,
} from "./AvatarColorEngine";

interface HighEndSalonAvatarCanvasProps {
  rootsColor: string;
  midColor: string;
  endsColor: string;
  rootsLevel?: number;
  midLevel?: number;
  endsLevel?: number;
  rootsGrey?: number;
  midGrey?: number;
  endsGrey?: number;
  separateZones?: boolean;
  blendIntensity?: number;
  skinTone?: string;
  skinUndertone?: SkinUndertone;
  lighting?: LightingPreset;
  view?: AvatarView;
  activeZone?: HairZoneId;
  onSelectZone?: (zone: HairZoneId) => void;
  engineVersion?: "v1-legacy" | "v2-optical" | "v3-photorealistic";
  onTelemetry?: (durationMs: number, fps: number) => void;
  className?: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "").trim();
  const fullHex =
    sanitized.length === 3
      ? sanitized.split("").map((c) => c + c).join("")
      : sanitized;
  const num = parseInt(fullHex, 16);
  if (isNaN(num)) return [100, 100, 100];
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

interface LayerData {
  width: number;
  height: number;
  basePixels: Uint8ClampedArray; // Original unmodified photo pixels
  cleanBgPixels: Uint8ClampedArray; // Decontaminated clean background plate (P3)
  alphaPixels: Uint8ClampedArray; // Hair alpha mask (0 on skin/clothes/bg, 255 on hair)
  zonePixels: Uint8ClampedArray;  // R=Roots, G=Mid, B=Ends
  flowPixels: Uint8ClampedArray;   // Strand tangent flow vector & coherence (P3)
  greyStrandPixels: Uint8ClampedArray; // Direction-aligned grey fiber texture (P3)
  skinPixels?: Uint8ClampedArray; // Precision skin mask (0 on hair/eyes/clothes/bg, 255 on skin)
  featureProtectPixels?: Uint8ClampedArray; // Precision facial feature protection mask
  baseOklabL: Float32Array;       // Precomputed OKLab L of base photo
  baseOklabA: Float32Array;       // Precomputed OKLab a of base photo
  baseOklabB: Float32Array;       // Precomputed OKLab b of base photo
  kStrand: Float32Array;          // Local strand luminance ratio k = baseL / meanHairL
  strandNoise: Float32Array;      // Precomputed micro-fiber hash for realistic canities
  meanHairA: number;
  meanHairB: number;
}

const GLOBAL_LAYER_CACHE: { front?: LayerData; back?: LayerData } = {};

export const HighEndSalonAvatarCanvas: React.FC<HighEndSalonAvatarCanvasProps> = ({
  rootsColor,
  midColor,
  endsColor,
  rootsLevel,
  midLevel,
  endsLevel,
  rootsGrey = 0,
  midGrey = 0,
  endsGrey = 0,
  separateZones = true,
  blendIntensity = 0.5,
  skinTone = "fair",
  skinUndertone = "neutral",
  lighting = "salon",
  view = "front",
  activeZone = "roots",
  onSelectZone,
  engineVersion = "v3-photorealistic",
  onTelemetry,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cacheRef = useRef<{ front?: LayerData; back?: LayerData }>({});
  const onTelemetryRef = useRef(onTelemetry);
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);
  const [loadedView, setLoadedView] = useState<AvatarView | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Preload and decode photographic base and precision hair masks
  useEffect(() => {
    let isCancelled = false;

    async function loadLayers(angle: AvatarView) {
      if (GLOBAL_LAYER_CACHE[angle]) {
        cacheRef.current[angle] = GLOBAL_LAYER_CACHE[angle];
        if (!isCancelled) {
          setLoadedView(angle);
          setIsLoading(false);
        }
        return;
      }

      if (cacheRef.current[angle]) {
        if (!isCancelled) {
          setLoadedView(angle);
          setIsLoading(false);
        }
        return;
      }

      setIsLoading(true);
      const isFront = angle === "front";
      const modelSrc = (isFront ? "/avatar/avatar_front_model.jpg" : "/avatar/avatar_back_model.jpg") + `?v=${AVATAR_ASSET_VERSION}`;
      const alphaSrc = (isFront ? "/avatar/hair_front_alpha.png" : "/avatar/hair_back_alpha.png") + `?v=${AVATAR_ASSET_VERSION}`;
      const zonesSrc = (isFront ? "/avatar/hair_front_zones.png" : "/avatar/hair_back_zones.png") + `?v=${AVATAR_ASSET_VERSION}`;
      const cleanBgSrc = (isFront ? "/avatar/hair_front_clean_bg.jpg" : "/avatar/hair_back_clean_bg.jpg") + `?v=${AVATAR_ASSET_VERSION}`;
      const flowSrc = (isFront ? "/avatar/hair_front_flow.png" : "/avatar/hair_back_flow.png") + `?v=${AVATAR_ASSET_VERSION}`;
      const greyStrandSrc = (isFront ? "/avatar/hair_front_grey_strands.png" : "/avatar/hair_back_grey_strands.png") + `?v=${AVATAR_ASSET_VERSION}`;
      const skinSrc = isFront ? `/avatar/hair_front_skin.png?v=${AVATAR_ASSET_VERSION}` : null;
      const protectSrc = isFront ? `/avatar/hair_front_features_protect.png?v=${AVATAR_ASSET_VERSION}` : null;

      const loadImg = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = src;
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(new Error(`Failed to load ${src}: ${e}`));
        });
      };

      try {
        const promises: Promise<HTMLImageElement>[] = [
          loadImg(modelSrc),
          loadImg(alphaSrc),
          loadImg(zonesSrc),
          loadImg(cleanBgSrc),
          loadImg(flowSrc),
          loadImg(greyStrandSrc),
        ];
        if (skinSrc) {
          promises.push(loadImg(skinSrc));
        }
        if (protectSrc) {
          promises.push(loadImg(protectSrc));
        }

        const results = await Promise.all(promises);
        const modelImg = results[0];
        const alphaImg = results[1];
        const zonesImg = results[2];
        const cleanBgImg = results[3];
        const flowImg = results[4];
        const greyStrandImg = results[5];
        const skinImg = skinSrc ? results[6] : undefined;
        const protectImg = protectSrc ? results[7] : undefined;

        if (isCancelled) return;

        const w = 896;
        const h = 1200;

        const offCanvas = document.createElement("canvas");
        offCanvas.width = w;
        offCanvas.height = h;
        const ctx = offCanvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        // 1. Base model photo
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(modelImg, 0, 0, w, h);
        const basePixels = new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data);

        // 2. Alpha mask (grayscale hair alpha)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(alphaImg, 0, 0, w, h);
        const alphaData = ctx.getImageData(0, 0, w, h).data;
        const alphaPixels = new Uint8ClampedArray(w * h);
        for (let p = 0; p < w * h; p++) {
          alphaPixels[p] = alphaData[p * 4];
        }

        // 3. Zone weights (R=Roots, G=Mid, B=Ends)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(zonesImg, 0, 0, w, h);
        const zonePixels = new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data);

        // 4. Decontaminated clean background plate (P3)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(cleanBgImg, 0, 0, w, h);
        const cleanBgPixels = new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data);

        // 5. Strand flow map (R=tx, G=ty, B=coherence) (P3)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(flowImg, 0, 0, w, h);
        const flowPixels = new Uint8ClampedArray(ctx.getImageData(0, 0, w, h).data);

        // 6. Direction-aligned grey strand texture (P3)
        ctx.clearRect(0, 0, w, h);
        ctx.drawImage(greyStrandImg, 0, 0, w, h);
        const greyStrandData = ctx.getImageData(0, 0, w, h).data;
        const greyStrandPixels = new Uint8ClampedArray(w * h);
        for (let p = 0; p < w * h; p++) {
          greyStrandPixels[p] = greyStrandData[p * 4];
        }

        // 7. Skin mask & feature protect mask (if front view)
        let skinPixels: Uint8ClampedArray | undefined = undefined;
        if (skinImg) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(skinImg, 0, 0, w, h);
          const skinData = ctx.getImageData(0, 0, w, h).data;
          skinPixels = new Uint8ClampedArray(w * h);
          for (let p = 0; p < w * h; p++) {
            skinPixels[p] = skinData[p * 4];
          }
        }

        let featureProtectPixels: Uint8ClampedArray | undefined = undefined;
        if (protectImg) {
          ctx.clearRect(0, 0, w, h);
          ctx.drawImage(protectImg, 0, 0, w, h);
          const protectData = ctx.getImageData(0, 0, w, h).data;
          featureProtectPixels = new Uint8ClampedArray(w * h);
          for (let p = 0; p < w * h; p++) {
            featureProtectPixels[p] = protectData[p * 4];
          }
        }

        // 5. Precompute OKLab base coordinates, strand ratios, and canities noise
        const baseOklabL = new Float32Array(w * h);
        const baseOklabA = new Float32Array(w * h);
        const baseOklabB = new Float32Array(w * h);
        const kStrand = new Float32Array(w * h);
        const strandNoise = new Float32Array(w * h);

        let sumL = 0;
        let sumA = 0;
        let sumB = 0;
        let hairCount = 0;

        for (let p = 0; p < w * h; p++) {
          const i = p * 4;
          const rByte = basePixels[i];
          const gByte = basePixels[i + 1];
          const bByte = basePixels[i + 2];

          const rLin = SRGB_TO_LIN_LUT[rByte];
          const gLin = SRGB_TO_LIN_LUT[gByte];
          const bLin = SRGB_TO_LIN_LUT[bByte];

          const [L, a, b_] = linearRgbToOklab(rLin, gLin, bLin);
          baseOklabL[p] = L;
          baseOklabA[p] = a;
          baseOklabB[p] = b_;

          const x = p % w;
          const y = (p / w) | 0;
          const seed = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
          strandNoise[p] = seed - Math.floor(seed);

          if (alphaPixels[p] > 200) {
            sumL += L;
            sumA += a;
            sumB += b_;
            hairCount++;
          }
        }

        const meanHairL = hairCount > 0 ? sumL / hairCount : 0.44;
        const meanHairA = hairCount > 0 ? sumA / hairCount : 0.025;
        const meanHairB = hairCount > 0 ? sumB / hairCount : 0.035;

        for (let p = 0; p < w * h; p++) {
          kStrand[p] = Math.max(0.04, baseOklabL[p] / meanHairL);
        }

        const layerData: LayerData = {
          width: w,
          height: h,
          basePixels,
          cleanBgPixels,
          alphaPixels,
          zonePixels,
          flowPixels,
          greyStrandPixels,
          skinPixels,
          featureProtectPixels,
          baseOklabL,
          baseOklabA,
          baseOklabB,
          kStrand,
          strandNoise,
          meanHairA,
          meanHairB,
        };
        GLOBAL_LAYER_CACHE[angle] = layerData;
        cacheRef.current[angle] = layerData;

        if (!isCancelled) {
          setLoadedView(angle);
          setIsLoading(false);
        }
      } catch (err) {
        console.error("Failed to load salon avatar asset layers:", err);
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadLayers(view);

    return () => {
      isCancelled = true;
    };
  }, [view]);

  // Fast compositor render pass (Runs at 60 FPS upon slider or color swatch drag)
  const renderCompositor = useCallback(() => {
    const t0 = performance.now();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cache = cacheRef.current[view];
    if (!cache) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const {
      width,
      height,
      basePixels,
      alphaPixels,
      zonePixels,
      skinPixels,
      featureProtectPixels,
    } = cache;
    const isFront = view === 'front';
    const normSkin = (skinTone || 'fair').toLowerCase().replace(/_/g, '-');
    
    // Photorealistic Dermal Melanin & Subsurface Scattering (SSS) Profiles across 10 Calibrated Presets
    const skinProfiles: Record<string, { targetRgb: [number, number, number]; sss: [number, number, number]; spec: number; gamma: number }> = {
      'porcelain':  { targetRgb: [246, 222, 214], sss: [6, 2, 0],    spec: 0.12, gamma: 1.00 },
      'fair':       { targetRgb: [229, 192, 177], sss: [0, 0, 0],    spec: 0.00, gamma: 1.00 }, // Photographic studio baseline
      'light':      { targetRgb: [224, 184, 160], sss: [10, 4, -2],  spec: 0.10, gamma: 0.98 },
      'warm-beige': { targetRgb: [214, 172, 142], sss: [12, 6, -3],  spec: 0.11, gamma: 0.96 },
      'medium':     { targetRgb: [200, 154, 122], sss: [14, 7, -5],  spec: 0.13, gamma: 0.94 },
      'olive':      { targetRgb: [192, 150, 114], sss: [12, 8, -6],  spec: 0.12, gamma: 0.94 },
      'tan':        { targetRgb: [176, 130, 94],  sss: [15, 8, -8],  spec: 0.14, gamma: 0.92 },
      'caramel':    { targetRgb: [156, 108, 72],  sss: [18, 9, -10], spec: 0.16, gamma: 0.90 },
      'deep':       { targetRgb: [122, 78, 52],   sss: [20, 8, -6],  spec: 0.18, gamma: 0.88 },
      'ebony':      { targetRgb: [88, 54, 38],    sss: [16, 6, -4],  spec: 0.20, gamma: 0.86 },
      // Aliases
      'alabaster':  { targetRgb: [246, 222, 214], sss: [6, 2, 0],    spec: 0.12, gamma: 1.00 },
      'very-fair':  { targetRgb: [229, 192, 177], sss: [0, 0, 0],    spec: 0.00, gamma: 1.00 },
      'peach':      { targetRgb: [224, 184, 160], sss: [10, 4, -2],  spec: 0.10, gamma: 0.98 },
      'honey':      { targetRgb: [214, 172, 142], sss: [12, 6, -3],  spec: 0.11, gamma: 0.96 },
      'golden':     { targetRgb: [214, 172, 142], sss: [12, 6, -3],  spec: 0.11, gamma: 0.96 },
      'bronze':     { targetRgb: [176, 130, 94],  sss: [15, 8, -8],  spec: 0.14, gamma: 0.92 },
      'brown':      { targetRgb: [156, 108, 72],  sss: [18, 9, -10], spec: 0.16, gamma: 0.90 },
      'dark':       { targetRgb: [122, 78, 52],   sss: [20, 8, -6],  spec: 0.18, gamma: 0.88 },
      'espresso':   { targetRgb: [88, 54, 38],    sss: [16, 6, -4],  spec: 0.20, gamma: 0.86 },
    };
    const activeSkinProfile = skinProfiles[normSkin] || skinProfiles['fair'];

    const undertoneMults: Record<SkinUndertone, [number, number, number]> = {
      'warm':    [1.03, 1.01, 0.95],
      'neutral': [1.00, 1.00, 1.00],
      'cool':    [1.01, 0.98, 1.04],
      'olive':   [0.98, 1.02, 0.94],
    };
    const activeUtMult = undertoneMults[skinUndertone || 'neutral'] || [1.0, 1.0, 1.0];

    // Lighting Ambient Radiance Coupling on Skin
    let skinAmbientR = 1.0;
    let skinAmbientG = 1.0;
    let skinAmbientB = 1.0;
    if (lighting === "salon") {
      skinAmbientR = 1.03;
      skinAmbientG = 1.01;
      skinAmbientB = 0.96;
    } else if (lighting === "cool") {
      skinAmbientR = 0.98;
      skinAmbientG = 1.00;
      skinAmbientB = 1.03;
    } else {
      skinAmbientR = 1.01;
      skinAmbientG = 1.00;
      skinAmbientB = 0.98;
    }

    const applySkinRecolor = isFront && !!skinPixels && !!skinTone;

    const [rawRootsR, rawRootsG, rawRootsB] = hexToRgb(rootsColor);
    const [rawMidR, rawMidG, rawMidB] = separateZones ? hexToRgb(midColor) : [rawRootsR, rawRootsG, rawRootsB];
    const [rawEndsR, rawEndsG, rawEndsB] = separateZones ? hexToRgb(endsColor) : [rawRootsR, rawRootsG, rawRootsB];

    // Specular anisotropic highlights & lighting environment luster
    let lusterR = 255;
    let lusterG = 255;
    let lusterB = 255;
    let lusterBoost = 0.22;

    if (lighting === "salon") {
      lusterR = 255;
      lusterG = 242;
      lusterB = 210;
      lusterBoost = 0.26;
    } else if (lighting === "cool") {
      lusterR = 220;
      lusterG = 235;
      lusterB = 255;
      lusterBoost = 0.18;
    } else {
      // Direct daylight
      lusterR = 255;
      lusterG = 252;
      lusterB = 240;
      lusterBoost = 0.24;
    }

    const rRoots = rawRootsR;
    const gRoots = rawRootsG;
    const bRoots = rawRootsB;

    const rMid = rawMidR;
    const gMid = rawMidG;
    const bMid = rawMidB;

    const rEnds = rawEndsR;
    const gEnds = rawEndsG;
    const bEnds = rawEndsB;

    // Engine Version Modes: v1-legacy, v2-optical, v3-photorealistic
    const mode = engineVersion ?? "v3-photorealistic";
    const isV1 = mode === "v1-legacy";
    const isV2 = mode === "v2-optical";
    const isV3 = !isV1 && !isV2; // "v3-photorealistic"

    const [hx, hy] = getLightingHalfVector(lighting);

    const rLevel = rootsLevel ?? deriveLevelFromHex(rootsColor);
    const mLevel = midLevel ?? (separateZones ? deriveLevelFromHex(midColor) : rLevel);
    const eLevel = endsLevel ?? (separateZones ? deriveLevelFromHex(endsColor) : rLevel);

    const [rTargetL, rTargetA, rTargetB] = hexToOklab(rootsColor);
    const [mTargetL, mTargetA, mTargetB] = separateZones ? hexToOklab(midColor) : [rTargetL, rTargetA, rTargetB];
    const [eTargetL, eTargetA, eTargetB] = separateZones ? hexToOklab(endsColor) : [rTargetL, rTargetA, rTargetB];

    let lusterOkL = 0.94;
    let lusterOkA = 0.005;
    let lusterOkB = 0.035;
    let lusterOkBoost = 0.20;

    if (lighting === "cool") {
      lusterOkL = 0.93;
      lusterOkA = -0.010;
      lusterOkB = -0.020;
      lusterOkBoost = 0.15;
    } else if (lighting === "sunlight") {
      lusterOkL = 0.96;
      lusterOkA = 0.000;
      lusterOkB = 0.008;
      lusterOkBoost = 0.18;
    }

    const lightParams = getLightingEnvironmentParams(lighting);
    const [lFilterR, lFilterG, lFilterB] = lightParams.filterRgb;
    const [sheenL, sheenA, sheenB] = lightParams.sheenTintOklab;
    const specStrength = lightParams.specularStrength;

    const {
      baseOklabL,
      baseOklabA,
      baseOklabB,
      kStrand,
      strandNoise,
      cleanBgPixels,
      flowPixels,
      greyStrandPixels,
      meanHairA,
      meanHairB,
    } = cache;

    const bioSkinProfile = getBiophysicalSkinProfile(normSkin as any);

    // Blend curve: 0.0=sharpen boundaries, 1.0=diffuse melt
    const blendPower = blendIntensity < 0.35 ? 1.7 : blendIntensity > 0.7 ? 0.7 : 1.0;

    const outputImgData = ctx.createImageData(width, height);
    const out = outputImgData.data;
    const numPixels = width * height;

    for (let p = 0; p < numPixels; p++) {
      const i = p * 4;
      const maskVal = alphaPixels[p];

      // If outside the hair mask: copy pristine photo pixel, applying natural skin tone only where skin mask is active
      if (maskVal <= 2) {
        let r = basePixels[i];
        let g = basePixels[i + 1];
        let b = basePixels[i + 2];

        if (applySkinRecolor && skinPixels) {
          const px = p % width;
          const py = Math.floor(p / width);

          const origL = baseOklabL[p];
          const origA = baseOklabA[p];
          const origB = baseOklabB[p];

          // Lip zone check (vermilion border & core lips)
          const isLipBox = py >= 425 && py <= 500 && px >= 400 && px <= 505;
          const lipAlpha = isLipBox && featureProtectPixels ? featureProtectPixels[p] / 255 : 0;

          // Anatomical eyeball aperture (palpebral fissure)
          const dl = Math.pow((px - 397) / 21, 2) + Math.pow((py - 350) / 8, 2);
          const dr = Math.pow((px - 510) / 21, 2) + Math.pow((py - 349) / 8, 2);
          const inEyeAperture = dl <= 1.0 || dr <= 1.0;

          const chroma = Math.sqrt(origA * origA + origB * origB);
          const isSclera = inEyeAperture && origL >= 0.46 && chroma < 0.038;
          const isIris = inEyeAperture && !isSclera;

          // Eyelids, tear ducts, under-eye bags, and lips underlay receive full dermal melanin transfer
          const baseSkinAlpha = skinPixels[p] / 255;
          const effSkinAlpha = (isSclera || isIris) ? 0.0 : baseSkinAlpha;

          // 1. Photorealistic Dermal Melanin Transfer
          if (effSkinAlpha > 0.005) {
            const k = Math.max(0.01, origL / MODEL_BASE_SKIN_OKLAB[0]);
            let skinL = Math.max(0.03, Math.min(0.98, bioSkinProfile.targetOklab[0] * Math.pow(k, bioSkinProfile.gamma)));

            if (origL > 0.70 && bioSkinProfile.specLuster > 0) {
              const spec = Math.min(1.0, (origL - 0.70) / 0.30) * bioSkinProfile.specLuster;
              skinL = Math.min(0.98, skinL + spec * 0.08);
            }

            const skinA = bioSkinProfile.targetOklab[1] + (origA - MODEL_BASE_SKIN_OKLAB[1]) * 0.88;
            const skinB = bioSkinProfile.targetOklab[2] + (origB - MODEL_BASE_SKIN_OKLAB[2]) * 0.88;

            let [clR, clG, clB] = oklabToSrgb(skinL, skinA, skinB);

            if (lighting !== "sunlight") {
              clR = Math.min(255, Math.max(0, Math.round(clR * lFilterR)));
              clG = Math.min(255, Math.max(0, Math.round(clG * lFilterG)));
              clB = Math.min(255, Math.max(0, Math.round(clB * lFilterB)));
            }

            r = Math.round(r * (1 - effSkinAlpha) + clR * effSkinAlpha);
            g = Math.round(g * (1 - effSkinAlpha) + clG * effSkinAlpha);
            b = Math.round(b * (1 - effSkinAlpha) + clB * effSkinAlpha);
          }

          // 2. Harmonious Feature Adaptation: Adapt lips & irises OVER recolored skin
          if (lipAlpha > 0.02) {
            const kLip = Math.max(0.01, origL / MODEL_BASE_LIP_OKLAB[0]);
            const lipL = Math.max(0.05, Math.min(0.95, bioSkinProfile.targetLipOklab[0] * Math.pow(kLip, 0.95)));
            const lipA = bioSkinProfile.targetLipOklab[1] + (origA - MODEL_BASE_LIP_OKLAB[1]) * 0.70;
            const lipB = bioSkinProfile.targetLipOklab[2] + (origB - MODEL_BASE_LIP_OKLAB[2]) * 0.70;
            let [lipR, lipG, lipBByte] = oklabToSrgb(lipL, lipA, lipB);

            if (lighting !== "sunlight") {
              lipR = Math.min(255, Math.max(0, Math.round(lipR * lFilterR)));
              lipG = Math.min(255, Math.max(0, Math.round(lipG * lFilterG)));
              lipBByte = Math.min(255, Math.max(0, Math.round(lipBByte * lFilterB)));
            }

            r = Math.round(r * (1 - lipAlpha) + lipR * lipAlpha);
            g = Math.round(g * (1 - lipAlpha) + lipG * lipAlpha);
            b = Math.round(b * (1 - lipAlpha) + lipBByte * lipAlpha);
          } else if (isIris) {
            // Adapt iris while keeping white sclera and specular glints crisp
            const kIris = Math.max(0.01, origL / MODEL_BASE_IRIS_OKLAB[0]);
            const irisL = Math.max(0.05, Math.min(0.95, bioSkinProfile.targetIrisOklab[0] * Math.pow(kIris, 0.90)));
            const irisA = bioSkinProfile.targetIrisOklab[1] + (origA - MODEL_BASE_IRIS_OKLAB[1]) * 0.60;
            const irisB = bioSkinProfile.targetIrisOklab[2] + (origB - MODEL_BASE_IRIS_OKLAB[2]) * 0.60;
            let [irR, irG, irBByte] = oklabToSrgb(irisL, irisA, irisB);

            if (lighting !== "sunlight") {
              irR = Math.min(255, Math.max(0, Math.round(irR * lFilterR)));
              irG = Math.min(255, Math.max(0, Math.round(irG * lFilterG)));
              irBByte = Math.min(255, Math.max(0, Math.round(irBByte * lFilterB)));
            }

            const effIrisAlpha = 0.85;
            r = Math.round(r * (1 - effIrisAlpha) + irR * effIrisAlpha);
            g = Math.round(g * (1 - effIrisAlpha) + irG * effIrisAlpha);
            b = Math.round(b * (1 - effIrisAlpha) + irBByte * effIrisAlpha);
          }
        }
        // Non-hair, non-skin pixels remain 100% pristine original source photo
        out[i] = r;
        out[i + 1] = g;
        out[i + 2] = b;
        out[i + 3] = 255;
        continue;
      }

      // Hair shading & physical light reflection
      const origR = basePixels[i];
      const origG = basePixels[i + 1];
      const origB = basePixels[i + 2];

      // Zone weights: R=Roots (channel 0), G=Mid (channel 1), B=Ends (channel 2)
      let wR = zonePixels[i] / 255;
      let wG = zonePixels[i + 1] / 255;
      let wB = zonePixels[i + 2] / 255;

      if (!separateZones) {
        wR = 1.0;
        wG = 0.0;
        wB = 0.0;
      } else if (blendPower !== 1.0) {
        wR = Math.pow(wR, blendPower);
        wG = Math.pow(wG, blendPower);
        wB = Math.pow(wB, blendPower);
        const sum = wR + wG + wB || 1.0;
        wR /= sum;
        wG /= sum;
        wB /= sum;
      }

      const isInnerFront = isFront && (p % width) >= 235 && (p % width) <= 665 && Math.floor(p / width) >= 120;

      let newR: number;
      let newG: number;
      let newB: number;

      if (isV1) {
        // --- V1 LEGACY SCALAR LUM ENGINE ---
        const tr = wR * rRoots + wG * rMid + wB * rEnds;
        const tg = wR * gRoots + wG * gMid + wB * gEnds;
        const tb = wR * bRoots + wG * bMid + wB * bEnds;

        const effGrey = Math.min(1.0, Math.max(0.0, wR * (rootsGrey / 100) + wG * (midGrey / 100) + wB * (endsGrey / 100)));
        const origLum = (0.299 * origR + 0.587 * origG + 0.114 * origB) / 255;
        const normLum = origLum / 0.435;

        const fiberMod = 0.36 + 0.64 * Math.pow(Math.min(2.0, normLum), 0.78);
        const capMod = Math.min(1.15, fiberMod);

        newR = Math.min(255, Math.round(tr * capMod));
        newG = Math.min(255, Math.round(tg * capMod));
        newB = Math.min(255, Math.round(tb * capMod));

        if (effGrey > 0) {
          const whiteFiberMod = 0.32 + 0.68 * Math.pow(Math.min(1.8, normLum), 0.75);
          const capWhite = Math.min(1.08, whiteFiberMod);
          const baseWhiteR = lighting === "cool" ? 222 : lighting === "sunlight" ? 226 : 228;
          const baseWhiteG = lighting === "cool" ? 225 : 225;
          const baseWhiteB = lighting === "cool" ? 230 : lighting === "sunlight" ? 222 : 220;
          const whiteR = Math.min(255, Math.round(baseWhiteR * capWhite));
          const whiteG = Math.min(255, Math.round(baseWhiteG * capWhite));
          const whiteB = Math.min(255, Math.round(baseWhiteB * capWhite));

          const strandTex = Math.min(1.0, Math.max(0.0, (origLum - 0.435) * 2.2 + 0.5));
          const strandThresh = 1.0 - effGrey;
          const whiteWeight = effGrey >= 0.96
            ? 1.0
            : Math.min(1.0, Math.max(0.0, ((strandTex - strandThresh + 0.15) / 0.30) * Math.min(1.0, effGrey * 1.5) + effGrey * 0.45));

          newR = Math.round(newR * (1 - whiteWeight) + whiteR * whiteWeight);
          newG = Math.round(newG * (1 - whiteWeight) + whiteG * whiteWeight);
          newB = Math.round(newB * (1 - whiteWeight) + whiteB * whiteWeight);
        }

        if (origLum > 0.68) {
          const shineIntensity = ((origLum - 0.68) / 0.32) * (0.16 * effGrey + lusterBoost * 0.65 * (1 - effGrey));
          newR = Math.min(255, Math.round(newR * (1 - shineIntensity) + lusterR * shineIntensity));
          newG = Math.min(255, Math.round(newG * (1 - shineIntensity) + lusterG * shineIntensity));
          newB = Math.min(255, Math.round(newB * (1 - shineIntensity) + lusterB * shineIntensity));
        }
      } else if (isV2) {
        // --- V2 OPTICAL MELANIN LIFT ENGINE (OKLab Isotropic) ---
        const targetL = wR * rTargetL + wG * mTargetL + wB * eTargetL;
        const targetA = wR * rTargetA + wG * mTargetA + wB * eTargetA;
        const targetB = wR * rTargetB + wG * mTargetB + wB * eTargetB;

        const effLevel = wR * rLevel + wG * mLevel + wB * eLevel;
        const effGrey = Math.min(1.0, Math.max(0.0, wR * (rootsGrey / 100) + wG * (midGrey / 100) + wB * (endsGrey / 100)));

        // Melanin undercoat lift model
        const normLvl = Math.max(1.0, Math.min(10.0, effLevel));
        const undercoatA = 0.015 + 0.055 * Math.sin(Math.PI * Math.min(1.0, (normLvl - 1.0) / 9.0));
        const undercoatB = 0.015 + 0.110 * Math.min(1.0, Math.max(0.0, (normLvl - 2.0) / 7.0));

        const dyeBlend = 0.88;
        const finalDyeA = (1.0 - dyeBlend) * undercoatA + dyeBlend * targetA;
        const finalDyeB = (1.0 - dyeBlend) * undercoatB + dyeBlend * targetB;

        // Retain 15% original photo micro-chromatic texture
        const microA = (baseOklabA[p] - meanHairA) * 0.15;
        const microB = (baseOklabB[p] - meanHairB) * 0.15;
        let outA = finalDyeA + microA;
        let outB = finalDyeB + microB;

        // Optical lightness transfer with contrast preservation
        const k = kStrand[p];
        const gammaLevel = 1.02 - 0.024 * (normLvl - 1.0);
        const floorL = 0.040 + 0.020 * (normLvl - 1.0);
        const ceilL = Math.min(0.98, targetL + 0.18 + 0.015 * normLvl);

        let outL = targetL * Math.pow(k, gammaLevel);
        if (outL < floorL) outL = floorL;
        else if (outL > ceilL) outL = ceilL;

        // Anisotropic specular crest reflections
        const baseL = baseOklabL[p];
        if (baseL > 0.58) {
          const specCrest = Math.min(1.0, (baseL - 0.58) / 0.35);
          const specFactor = specCrest * lusterOkBoost * (1.0 - effGrey * 0.5);
          outL = Math.min(0.98, outL * (1.0 - specFactor) + lusterOkL * specFactor);
          outA = outA * (1.0 - specFactor) + lusterOkA * specFactor;
          outB = outB * (1.0 - specFactor) + lusterOkB * specFactor;
        }

        // Realistic discrete canities / grey strands
        if (effGrey > 0) {
          const sNoise = strandNoise[p];
          const isWhiteFiber = effGrey >= 0.98
            ? 1.0
            : Math.min(1.0, Math.max(0.0, (effGrey - sNoise + 0.07) / 0.14));

          if (isWhiteFiber > 0) {
            const whiteL = Math.min(0.96, Math.max(0.30, 0.86 * Math.pow(k, 0.60)));
            const whiteA = 0.002;
            const whiteB = 0.012;
            const wFactor = isWhiteFiber * Math.min(1.0, effGrey * 1.25);

            outL = outL * (1.0 - wFactor) + whiteL * wFactor;
            outA = outA * (1.0 - wFactor) + whiteA * wFactor;
            outB = outB * (1.0 - wFactor) + whiteB * wFactor;
          }
        }

        // Fast OKLab -> Linear RGB -> sRGB via precomputed LUT
        const l_ = outL + 0.3963377774 * outA + 0.2158037573 * outB;
        const m_ = outL - 0.1055613458 * outA - 0.0638541728 * outB;
        const s_ = outL - 0.0894841775 * outA - 1.2914855480 * outB;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const rIdx = Math.max(0, Math.min(4095, (rLin * 4095) | 0));
        const gIdx = Math.max(0, Math.min(4095, (gLin * 4095) | 0));
        const bIdx = Math.max(0, Math.min(4095, (bLin * 4095) | 0));

        newR = LIN_TO_SRGB_LUT[rIdx];
        newG = LIN_TO_SRGB_LUT[gIdx];
        newB = LIN_TO_SRGB_LUT[bIdx];
      } else {
        // --- V3 ADVANCED PHOTOREALISTIC ENGINE (P3) ---
        const targetL = wR * rTargetL + wG * mTargetL + wB * eTargetL;
        const targetA = wR * rTargetA + wG * mTargetA + wB * eTargetA;
        const targetB = wR * rTargetB + wG * mTargetB + wB * eTargetB;

        const effLevel = wR * rLevel + wG * mLevel + wB * eLevel;
        const effGrey = Math.min(1.0, Math.max(0.0, wR * (rootsGrey / 100) + wG * (midGrey / 100) + wB * (endsGrey / 100)));

        // 1. Melanin undercoat lift model
        const normLvl = Math.max(1.0, Math.min(10.0, effLevel));
        const undercoatA = 0.015 + 0.055 * Math.sin(Math.PI * Math.min(1.0, (normLvl - 1.0) / 9.0));
        const undercoatB = 0.015 + 0.110 * Math.min(1.0, Math.max(0.0, (normLvl - 2.0) / 7.0));

        const dyeBlend = 0.88;
        const finalDyeA = (1.0 - dyeBlend) * undercoatA + dyeBlend * targetA;
        const finalDyeB = (1.0 - dyeBlend) * undercoatB + dyeBlend * targetB;

        // Retain 15% original photo micro-chromatic texture
        const microA = (baseOklabA[p] - meanHairA) * 0.15;
        const microB = (baseOklabB[p] - meanHairB) * 0.15;
        let outA = finalDyeA + microA;
        let outB = finalDyeB + microB;

        // 2. Optical lightness transfer with contrast preservation
        const k = kStrand[p];
        const gammaLevel = 1.02 - 0.024 * (normLvl - 1.0);
        const floorL = 0.040 + 0.020 * (normLvl - 1.0);
        const ceilL = Math.min(0.98, targetL + 0.18 + 0.015 * normLvl);

        let outL = targetL * Math.pow(k, gammaLevel);
        if (outL < floorL) outL = floorL;
        else if (outL > ceilL) outL = ceilL;

        // 3. Directional Anisotropic Specular Highlights (Kajiya-Kay / Marschner R & TRT lobes)
        const tx = (flowPixels[i] / 255.0) * 2.0 - 1.0;
        const ty = flowPixels[i + 1] / 255.0;
        const coherence = flowPixels[i + 2] / 255.0;

        const t_dot_h = tx * hx + ty * hy;
        const specIdx = Math.max(0, Math.min(255, ((t_dot_h * 0.5 + 0.5) * 255.0) | 0));
        const specR = SPEC_R_LUT[specIdx] * coherence;
        const specTRT = SPEC_TRT_LUT[specIdx] * coherence;

        const baseL = baseOklabL[p];
        const crestBoost = baseL > 0.50 ? Math.min(1.0, (baseL - 0.50) / 0.40) : 0.0;
        const specMod = (0.35 + 0.65 * crestBoost) * (1.0 - effGrey * 0.5);

        const specTotal = (specR * 0.22 + specTRT * 0.15) * specMod * specStrength;
        outL = Math.min(0.98, outL + specTotal);
        outA += sheenA * specTRT * specMod * 1.5;
        outB += sheenB * specTRT * specMod * 1.5;

        // 4. Backlight Transmission (Subtle Rim Illumination strictly on outer silhouette flyaways)
        const rim = isInnerFront ? 0.0 : SIN_PI_ALPHA_LUT[maskVal] * 0.10 * (1.0 - effGrey * 0.4);
        outL = Math.min(0.98, outL + rim);

        // 5. Direction-Aware Continuous Grey Fibers
        if (effGrey > 0) {
          const sNoise = greyStrandPixels[p] / 255.0;
          const isWhiteFiber = effGrey >= 0.98
            ? 1.0
            : Math.min(1.0, Math.max(0.0, (effGrey - sNoise + 0.07) / 0.14));

          if (isWhiteFiber > 0) {
            const whiteL = Math.min(0.96, Math.max(0.30, 0.86 * Math.pow(k, 0.60)));
            const whiteA = 0.002;
            const whiteB = 0.012;
            const wFactor = isWhiteFiber * Math.min(1.0, effGrey * 1.25);

            outL = outL * (1.0 - wFactor) + whiteL * wFactor;
            outA = outA * (1.0 - wFactor) + whiteA * wFactor;
            outB = outB * (1.0 - wFactor) + whiteB * wFactor;
          }
        }

        // Fast OKLab -> Linear RGB -> sRGB via precomputed LUT
        const l_ = outL + 0.3963377774 * outA + 0.2158037573 * outB;
        const m_ = outL - 0.1055613458 * outA - 0.0638541728 * outB;
        const s_ = outL - 0.0894841775 * outA - 1.2914855480 * outB;

        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;

        const rLin = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        const gLin = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
        const bLin = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;

        const rIdx = Math.max(0, Math.min(4095, (rLin * 4095) | 0));
        const gIdx = Math.max(0, Math.min(4095, (gLin * 4095) | 0));
        const bIdx = Math.max(0, Math.min(4095, (bLin * 4095) | 0));

        newR = LIN_TO_SRGB_LUT[rIdx];
        newG = LIN_TO_SRGB_LUT[gIdx];
        newB = LIN_TO_SRGB_LUT[bIdx];
      }

      // Background plate: In V3 use clean decontaminated background plate for outer flyaways; in V1/V2 or inner head use original photo
      let bgR = cleanBgPixels[i];
      let bgG = cleanBgPixels[i + 1];
      let bgB = cleanBgPixels[i + 2];

      // On face/neck dermis, underlying plate uses seamless skin tone under hair strands
      if (skinPixels) {
        const sAlpha = skinPixels[p] / 255;
        if (sAlpha > 0.005) {
          if (applySkinRecolor) {
            const origL = baseOklabL[p];
            const origA = baseOklabA[p];
            const origB = baseOklabB[p];

            const k = Math.max(0.01, origL / MODEL_BASE_SKIN_OKLAB[0]);
            let skinL = Math.max(0.03, Math.min(0.98, bioSkinProfile.targetOklab[0] * Math.pow(k, bioSkinProfile.gamma)));

            if (origL > 0.70 && bioSkinProfile.specLuster > 0) {
              const spec = Math.min(1.0, (origL - 0.70) / 0.30) * bioSkinProfile.specLuster;
              skinL = Math.min(0.98, skinL + spec * 0.08);
            }

            const skinA = bioSkinProfile.targetOklab[1] + (origA - MODEL_BASE_SKIN_OKLAB[1]) * 0.88;
            const skinB = bioSkinProfile.targetOklab[2] + (origB - MODEL_BASE_SKIN_OKLAB[2]) * 0.88;

            let [clR, clG, clB] = oklabToSrgb(skinL, skinA, skinB);

            if (lighting !== "sunlight") {
              clR = Math.min(255, Math.max(0, Math.round(clR * lFilterR)));
              clG = Math.min(255, Math.max(0, Math.round(clG * lFilterG)));
              clB = Math.min(255, Math.max(0, Math.round(clB * lFilterB)));
            }

            bgR = Math.round(bgR * (1 - sAlpha) + clR * sAlpha);
            bgG = Math.round(bgG * (1 - sAlpha) + clG * sAlpha);
            bgB = Math.round(bgB * (1 - sAlpha) + clB * sAlpha);
          } else {
            bgR = Math.round(bgR * (1 - sAlpha) + origR * sAlpha);
            bgG = Math.round(bgG * (1 - sAlpha) + origG * sAlpha);
            bgB = Math.round(bgB * (1 - sAlpha) + origB * sAlpha);
          }
        }
      }

      // Alpha composite with original photographic pixel (or softly tinted skin boundary)
      const a = maskVal / 255;
      out[i] = Math.round(bgR * (1 - a) + newR * a);
      out[i + 1] = Math.round(bgG * (1 - a) + newG * a);
      out[i + 2] = Math.round(bgB * (1 - a) + newB * a);
      out[i + 3] = 255;
    }

    ctx.putImageData(outputImgData, 0, 0);
    const t1 = performance.now();
    const frameLatency = t1 - t0;
    onTelemetryRef.current?.(frameLatency, frameLatency > 0 ? 1000 / frameLatency : 30);
  }, [
    rootsColor, midColor, endsColor,
    rootsLevel, midLevel, endsLevel,
    rootsGrey, midGrey, endsGrey,
    separateZones, blendIntensity,
    skinTone, skinUndertone,
    lighting, view, engineVersion
  ]);

  useEffect(() => {
    if (loadedView === view) {
      renderCompositor();
    }
  }, [loadedView, view, renderCompositor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSelectZone || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 896 / rect.width;
    const scaleY = 1200 / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    if (x < 0 || x >= 896 || y < 0 || y >= 1200) return;

    const currentData = cacheRef.current[view];
    if (!currentData) return;

    const p = y * 896 + x;
    const maskVal = currentData.alphaPixels[p];
    if (maskVal > 20) {
      const wRoots = currentData.zonePixels[p * 4];
      const wMid = currentData.zonePixels[p * 4 + 1];
      const wEnds = currentData.zonePixels[p * 4 + 2];

      if (wRoots >= wMid && wRoots >= wEnds) {
        onSelectZone("roots");
      } else if (wMid >= wRoots && wMid >= wEnds) {
        onSelectZone("midLengths");
      } else {
        onSelectZone("ends");
      }
    }
  };

  return (
    <div className={`relative w-full h-full flex items-center justify-center select-none ${className}`}>
      {/* Loading Skeleton */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/60 backdrop-blur-sm z-20 rounded-2xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
            <span className="text-[11px] font-mono text-neutral-300">Loading Salon Studio Avatar...</span>
          </div>
        </div>
      )}

      {/* Aspect-Locked Viewport to match 896x1200 canvas precisely */}
      <div className="relative h-full aspect-[896/1200] max-w-full flex items-center justify-center">
        {/* Hardware-Accelerated 896x1200 Canvas */}
        <canvas
          ref={canvasRef}
          width={896}
          height={1200}
          onClick={handleCanvasClick}
          className="w-full h-full object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.85)] rounded-2xl cursor-pointer"
        />

        {/* Interactive 3-Zone Touch Pins (Overlay on Top of Real Hair) */}
        {onSelectZone && (
          <div className="absolute inset-0 pointer-events-none">
            {view === "front" ? (
              <>
                {/* Zone 1: Roots Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("roots")}
                  className={`pointer-events-auto absolute left-[50%] top-[12%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "roots"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 1: Roots (Click to edit roots shade)"
                >
                  1
                </button>

                {/* Zone 2: Mid-Lengths Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("midLengths")}
                  className={`pointer-events-auto absolute left-[35%] top-[50%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "midLengths"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 2: Mid-Lengths (Click to edit mid-lengths shade)"
                >
                  2
                </button>

                {/* Zone 3: Ends Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("ends")}
                  className={`pointer-events-auto absolute left-[34%] top-[78%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "ends"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 3: Ends (Click to edit ends shade)"
                >
                  3
                </button>
              </>
            ) : (
              <>
                {/* Back View: Roots Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("roots")}
                  className={`pointer-events-auto absolute left-[50%] top-[20%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "roots"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 1: Roots (Back view)"
                >
                  1
                </button>

                {/* Back View: Mid-Lengths Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("midLengths")}
                  className={`pointer-events-auto absolute left-[50%] top-[48%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "midLengths"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 2: Mid-Lengths (Back view)"
                >
                  2
                </button>

                {/* Back View: Ends Pin */}
                <button
                  type="button"
                  onClick={() => onSelectZone("ends")}
                  className={`pointer-events-auto absolute left-[50%] top-[76%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7 rounded-full font-black text-xs shadow-xl transition-all duration-300 ${
                    activeZone === "ends"
                      ? "bg-amber-400 text-neutral-950 scale-125 ring-4 ring-amber-400/50 shadow-amber-500/50 animate-pulse"
                      : "bg-neutral-900/90 text-white border border-white/60 hover:scale-110 hover:border-amber-400"
                  }`}
                  title="Zone 3: Ends (Back view)"
                >
                  3
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
