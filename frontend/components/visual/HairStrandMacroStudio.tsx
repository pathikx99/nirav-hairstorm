"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { ApplicationTechnique } from "../../types/formulation";
import {
  computeHairColorimetry,
  applyMetamerism,
  getSalonShadeCode,
  getUndertoneColor,
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
  onLevelChange?: (level: UniversalLevel) => void;
  greyPercentage?: number;
  customColor?: string;
  isBleached?: boolean;
  zoneLabel?: string;
  customLightVector?: [number, number];
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
  onLevelChange,
  greyPercentage = 0,
  customColor,
  isBleached = false,
  zoneLabel,
  customLightVector,
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

  // Interactive Zoom & Pan State (1.0x to 4.0x)
  const [zoom, setZoom] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const touchStartRef = useRef<{
    distance: number;
    initialZoom: number;
  }>({
    distance: 0,
    initialZoom: 1.0,
  });

  const clampPan = (targetPan: { x: number; y: number }, targetZoom: number) => {
    if (targetZoom <= 1.0) return { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 600;
    const h = rect?.height || 200;
    const maxX = ((targetZoom - 1) * w) / 2;
    const maxY = ((targetZoom - 1) * h) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, targetPan.x)),
      y: Math.min(maxY, Math.max(-maxY, targetPan.y)),
    };
  };

  const setZoomLevel = (targetZoom: number) => {
    const nextZoom = Math.min(4.0, Math.max(1.0, Number(targetZoom.toFixed(2))));
    setZoom(nextZoom);
    if (nextZoom <= 1.0) {
      setPan({ x: 0, y: 0 });
    } else {
      setPan((prev) => clampPan(prev, nextZoom));
    }
  };

  const handleZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(Math.min(4.0, zoom + 0.5));
  };

  const handleZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoomLevel(Math.max(1.0, zoom - 0.5));
  };

  const handleResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setZoom(1.0);
    setPan({ x: 0, y: 0 });
  };

  // Mouse wheel zoom with native passive: false prevention of page scroll
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const step = -e.deltaY * 0.002;

      setZoom((currentZoom) => {
        const nextZoom = Math.min(4.0, Math.max(1.0, Number((currentZoom + step).toFixed(2))));
        if (nextZoom === currentZoom) return currentZoom;

        setPan((prevPan) => {
          if (nextZoom <= 1.0) return { x: 0, y: 0 };
          const rect = container.getBoundingClientRect();
          const maxX = ((nextZoom - 1) * rect.width) / 2;
          const maxY = ((nextZoom - 1) * rect.height) / 2;
          return {
            x: Math.min(maxX, Math.max(-maxX, prevPan.x)),
            y: Math.min(maxY, Math.max(-maxY, prevPan.y)),
          };
        });

        return nextZoom;
      });
    };

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
    };
  }, []);

  // Mouse drag & pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || zoom <= 1.0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || zoom <= 1.0) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 600;
    const h = rect?.height || 200;
    const maxX = ((zoom - 1) * w) / 2;
    const maxY = ((zoom - 1) * h) / 2;

    const targetX = panStartRef.current.x + deltaX;
    const targetY = panStartRef.current.y + deltaY;

    setPan({
      x: Math.min(maxX, Math.max(-maxX, targetX)),
      y: Math.min(maxY, Math.max(-maxY, targetY)),
    });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (zoom > 1.05) {
      handleResetZoom();
    } else {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) {
        setZoomLevel(2.0);
        return;
      }
      const targetZoom = 2.0;
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const maxX = ((targetZoom - 1) * rect.width) / 2;
      const maxY = ((targetZoom - 1) * rect.height) / 2;
      const rawPanX = (centerX - clickX) * (targetZoom - 1);
      const rawPanY = (centerY - clickY) * (targetZoom - 1);

      setZoom(targetZoom);
      setPan({
        x: Math.min(maxX, Math.max(-maxX, rawPanX)),
        y: Math.min(maxY, Math.max(-maxY, rawPanY)),
      });
    }
  };

  // Touch handlers for mobile pan & pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    if (e.touches.length === 1 && zoom > 1.0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      panStartRef.current = { ...pan };
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStartRef.current = {
        distance: dist,
        initialZoom: zoom,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1 && isDragging && zoom > 1.0) {
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;

      const rect = containerRef.current?.getBoundingClientRect();
      const w = rect?.width || 600;
      const h = rect?.height || 200;
      const maxX = ((zoom - 1) * w) / 2;
      const maxY = ((zoom - 1) * h) / 2;

      setPan({
        x: Math.min(maxX, Math.max(-maxX, panStartRef.current.x + deltaX)),
        y: Math.min(maxY, Math.max(-maxY, panStartRef.current.y + deltaY)),
      });
    } else if (e.touches.length === 2 && touchStartRef.current.distance > 0) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      const ratio = dist / touchStartRef.current.distance;
      const targetZoom = Math.min(4.0, Math.max(1.0, touchStartRef.current.initialZoom * ratio));
      setZoomLevel(targetZoom);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    touchStartRef.current.distance = 0;
  };

  // Compute colorimetry for target look
  const colorimetry = computeHairColorimetry(
    level,
    primaryTone,
    secondaryTone,
    intensity
  );

  const shadeInfo = getSalonShadeCode(level, primaryTone, secondaryTone);

  // Environmental metamerism versions
  const baseHexToUse = customColor || (isBleached ? getUndertoneColor(level).base : colorimetry.baseHex);
  const sunlightColor = applyMetamerism(baseHexToUse, "DAYLIGHT");
  const insideSalonColor = applyMetamerism(baseHexToUse, "WARM");
  const coolIndoorColor = applyMetamerism(baseHexToUse, "COOL");

  const activeColor =
    activeLight === "WARM"
      ? insideSalonColor
      : activeLight === "COOL"
      ? coolIndoorColor
      : sunlightColor;

  // Precompute 1,200 deterministic fiber trajectories for rock-solid stability and zero jitter
  const strandTrajectoryData = useMemo(() => {
    const data: Array<{
      strandRatio: number;
      startXOffset: number;
      depth: number; // 0 (deep core shadow) to 1 (surface specular)
      curvatureSeed: number;
      width: number;
      isFlyaway: boolean;
      flyawayDrift: number;
      canitiesSeed: number;
    }> = [];

    const TOTAL_STRANDS = 1200;

    for (let i = 0; i < TOTAL_STRANDS; i++) {
      // Pseudo-random deterministic hash
      const h1 = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
      const rand1 = h1 - Math.floor(h1);
      const h2 = Math.cos(i * 43.123 + 23.456) * 23456.789;
      const rand2 = h2 - Math.floor(h2);
      const h3 = Math.sin(i * 91.345 + 11.111) * 56789.123;
      const rand3 = h3 - Math.floor(h3);

      const strandRatio = i / TOTAL_STRANDS;
      const startXOffset = (rand1 - 0.5) * 28;
      const depth = rand2;
      const curvatureSeed = rand3;
      const width = 0.75 + rand1 * 1.05; // 0.75px to 1.8px (realistic 50-90um caliber)
      const isFlyaway = i % 29 === 0; // ~40 natural stray flyaway fibers
      const flyawayDrift = (rand2 - 0.5) * 45;
      const canitiesSeed = (i * 73 + 17) % 100;

      data.push({
        strandRatio,
        startXOffset,
        depth,
        curvatureSeed,
        width,
        isFlyaway,
        flyawayDrift,
        canitiesSeed,
      });
    }

    return data;
  }, []);

  // Photorealistic Hair Fiber Rendering on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Use internal supersampled canvas resolution (1440x640) for razor-sharp micro-strands
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // 1. Deep Volumetric Salon Studio Background
    const bgGrad = ctx.createRadialGradient(
      width * 0.5,
      height * 0.45,
      width * 0.1,
      width * 0.5,
      height * 0.5,
      width * 0.75
    );
    bgGrad.addColorStop(0, "#16161b");
    bgGrad.addColorStop(0.4, "#0e0e13");
    bgGrad.addColorStop(0.85, "#07070a");
    bgGrad.addColorStop(1, "#030305");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Parse Pigment Colorimetry
    const hex = activeColor.replace("#", "");
    const rBase = parseInt(hex.slice(0, 2), 16);
    const gBase = parseInt(hex.slice(2, 4), 16);
    const bBase = parseInt(hex.slice(4, 6), 16);

    // Environment Specular Luster Tone (Marschner Specular Lobe)
    let shineR = 255;
    let shineG = 255;
    let shineB = 255;
    let lusterStrength = 0.32;

    if (activeLight === "WARM") {
      shineR = 255;
      shineG = 246;
      shineB = 224;
      lusterStrength = 0.30;
    } else if (activeLight === "COOL") {
      shineR = 232;
      shineG = 242;
      shineB = 255;
      lusterStrength = 0.28;
    } else {
      // Sunlight: 6500K balanced daylight
      shineR = 255;
      shineG = 254;
      shineB = 248;
      lusterStrength = 0.34;
    }

    if (technique === "GLOSS_TONING") {
      lusterStrength = Math.min(0.48, lusterStrength + 0.12);
    }

    // Specular highlight band positioning (cuticle angle tilt)
    const lightOffsetY = customLightVector ? customLightVector[1] * (height * 0.22) : 0;
    const lightOffsetX = customLightVector ? customLightVector[0] * (width * 0.25) : 0;
    const highlightY = Math.max(height * 0.2, Math.min(height * 0.8, height * 0.42 + lightOffsetY));
    const highlightX = Math.max(width * 0.2, Math.min(width * 0.8, width * 0.5 + lightOffsetX));

    // 3. Render 1,200 Multi-Layered Individual Hair Filaments
    // Rendered in 3 distinct optical passes:
    // Pass A: Deep Core Underlayer (Ambient Occlusion & Self-Shadowing)
    // Pass B: Mid-Body Fibers (True Pigment Matrix & Canities Core)
    // Pass C: Surface Illuminated Fibers (Specular Gleam & Micro Flyaways)

    // Helper to evaluate Bezier path for a fiber
    const buildFiberPath = (startX: number, curvatureSeed: number, isFlyaway: boolean, flyawayDrift: number) => {
      ctx.beginPath();
      ctx.moveTo(startX, -5);

      if (strandTexture === "WAVY") {
        // Natural Volumetric Wave Locks
        const waveAmp = (isFlyaway ? 45 : 32) + curvatureSeed * 12;
        const waveFreq = 0.0055;
        const cp1x = startX + Math.sin(height * 0.28 * waveFreq + curvatureSeed) * waveAmp;
        const cp1y = height * 0.32;
        const cp2x = startX - Math.sin(height * 0.65 * waveFreq + curvatureSeed) * waveAmp * 0.95;
        const cp2y = height * 0.68;
        const endX = startX + (isFlyaway ? flyawayDrift : Math.sin(height * waveFreq) * waveAmp * 0.6);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height + 10);
      } else if (strandTexture === "CURLY") {
        // Three-Dimensional Helical Spiral Curls
        const curlRadius = (isFlyaway ? 55 : 42) + curvatureSeed * 16;
        const cp1x = startX + curlRadius * 1.1;
        const cp1y = height * 0.26;
        const cp2x = startX - curlRadius * 1.25;
        const cp2y = height * 0.58;
        const endX = startX + (isFlyaway ? flyawayDrift : curlRadius * 0.4);
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height + 10);
      } else {
        // Silky Straight Hair Flow with Microscopic Natural Drift
        const straightDrift = (isFlyaway ? flyawayDrift * 1.4 : (curvatureSeed - 0.5) * 22);
        const cp1x = startX + straightDrift * 0.3;
        const cp1y = height * 0.35;
        const cp2x = startX + straightDrift * 0.7;
        const cp2y = height * 0.72;
        const endX = startX + straightDrift;
        ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, height + 10);
      }
    };

    // Sort fibers by depth for realistic volumetric self-shadowing
    const sortedStrands = [...strandTrajectoryData].sort((a, b) => a.depth - b.depth);

    for (let i = 0; i < sortedStrands.length; i++) {
      const strand = sortedStrands[i];
      const startX = strand.strandRatio * width + strand.startXOffset;

      // Real Human White Hair (Canities) Physics:
      // In real trichology, grey hair is amelanotic (lacks melanin pigment entirely).
      // The hair fiber is a translucent, hollow-cored keratin cylinder with high internal optical scattering.
      const isWhiteFiber = greyPercentage > 0 && strand.canitiesSeed < greyPercentage;

      let r: number;
      let g: number;
      let b: number;
      let alpha: number;

      if (isWhiteFiber) {
        // Canities Amelanotic Fiber
        // Internal scattering creates gleaming silver-white with translucent depth falloff
        const whiteLum = 0.72 + 0.28 * strand.depth;
        if (activeLight === "WARM") {
          // Warm halogen reflection: subtle champagne ivory gleam
          r = Math.round(250 * whiteLum);
          g = Math.round(247 * whiteLum);
          b = Math.round(238 * whiteLum);
        } else if (activeLight === "COOL") {
          // Cool office reflection: icy diamond silver-white
          r = Math.round(236 * whiteLum);
          g = Math.round(244 * whiteLum);
          b = Math.round(255 * whiteLum);
        } else {
          // Sunlight: crisp pure silver-white
          r = Math.round(246 * whiteLum);
          g = Math.round(250 * whiteLum);
          b = Math.round(255 * whiteLum);
        }
        // White hair fibers are slightly more wiry and reflective
        alpha = strand.isFlyaway ? 0.75 : 0.65 + 0.35 * strand.depth;
      } else {
        // Melanin-Pigmented Fiber
        // Deep fibers have intense self-shadowing (ambient occlusion)
        const aoFactor = 0.28 + 0.72 * strand.depth;
        r = Math.round(rBase * aoFactor);
        g = Math.round(gBase * aoFactor);
        b = Math.round(bBase * aoFactor);
        alpha = strand.isFlyaway ? 0.65 : 0.45 + 0.55 * strand.depth;
      }

      ctx.save();
      buildFiberPath(startX, strand.curvatureSeed, strand.isFlyaway, strand.flyawayDrift);
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      // White fibers often present slightly increased caliber (coarser wiry cuticle)
      ctx.lineWidth = isWhiteFiber ? strand.width * 1.25 : strand.width;
      ctx.stroke();
      ctx.restore();
    }

    // 4. Anisotropic Cuticle Specular Reflection (Marschner R-Lobe & TRT Colored Lobe)
    // Continuous volumetric sheen across the natural curvature of the hair lock.
    // No disjointed, floating short ticks or artificial dashes.
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    // Primary Specular Lobe (R-Lobe): Natural smooth reflection across hair bundle
    const highlightGrad = ctx.createRadialGradient(
      highlightX,
      highlightY,
      width * 0.04,
      highlightX,
      highlightY,
      width * 0.65
    );
    highlightGrad.addColorStop(0, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.20 * lusterStrength})`);
    highlightGrad.addColorStop(0.25, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.11 * lusterStrength})`);
    highlightGrad.addColorStop(0.65, `rgba(${shineR}, ${shineG}, ${shineB}, ${0.03 * lusterStrength})`);
    highlightGrad.addColorStop(1, `rgba(${shineR}, ${shineG}, ${shineB}, 0)`);
    ctx.fillStyle = highlightGrad;
    ctx.fillRect(0, 0, width, height);

    // Secondary colored TRT transmission lobe (reflects cortex pigment through cuticle)
    if (greyPercentage < 100) {
      const trtGlow = ctx.createRadialGradient(
        highlightX,
        highlightY + height * 0.06,
        width * 0.02,
        highlightX,
        highlightY + height * 0.06,
        width * 0.50
      );
      trtGlow.addColorStop(0, `rgba(${Math.min(255, rBase + 35)}, ${Math.min(255, gBase + 25)}, ${bBase}, ${0.14 * lusterStrength})`);
      trtGlow.addColorStop(0.45, `rgba(${rBase}, ${gBase}, ${bBase}, ${0.05 * lusterStrength})`);
      trtGlow.addColorStop(1, `rgba(${rBase}, ${gBase}, ${bBase}, 0)`);
      ctx.fillStyle = trtGlow;
      ctx.fillRect(0, 0, width, height);
    }
    ctx.restore();

    // 5. Delicate Lens Vignette & Studio Lighting Framing
    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    const vignette = ctx.createRadialGradient(
      width * 0.5,
      height * 0.5,
      width * 0.32,
      width * 0.5,
      height * 0.5,
      width * 0.72
    );
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.65, "rgba(0, 0, 0, 0.25)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.72)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    ctx.restore();
  }, [
    activeColor,
    activeLight,
    strandTexture,
    technique,
    customLightVector,
    greyPercentage,
    level,
    primaryTone,
    secondaryTone,
    intensity,
    isBleached,
    strandTrajectoryData,
  ]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-neutral-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15 text-base border border-amber-500/30 shrink-0">
            🔬
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-white">
                Fiber Macro Inspection
              </h3>
              <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                {Math.round(zoom * 100)}x Optical
              </span>
              {isBleached && (
                <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40">
                  ⚡ Bleached
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400">
              1,200 micro-cuticle filaments • Real-time scattering & canities
            </p>
          </div>
        </div>

        {/* Texture Switcher */}
        <div className="flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800 text-[10px] font-bold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setStrandTexture("WAVY")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              strandTexture === "WAVY"
                ? "bg-amber-500 text-neutral-950 font-black shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Waves
          </button>
          <button
            type="button"
            onClick={() => setStrandTexture("SILKY_STRAIGHT")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              strandTexture === "SILKY_STRAIGHT"
                ? "bg-amber-500 text-neutral-950 font-black shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Straight
          </button>
          <button
            type="button"
            onClick={() => setStrandTexture("CURLY")}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              strandTexture === "CURLY"
                ? "bg-amber-500 text-neutral-950 font-black shadow-xs"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Curls
          </button>
        </div>
      </div>

      {/* Main High-Definition Hair Strand Canvas Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="relative w-full h-56 sm:h-64 rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl group select-none touch-none bg-neutral-950"
        style={{
          cursor: zoom > 1.0 ? (isDragging ? "grabbing" : "grab") : "default",
        }}
      >
        {/* Pannable & Zoomable Canvas Wrapper */}
        <div
          className="w-full h-full transform-gpu"
          style={{
            transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={1920}
            height={800}
            className="w-full h-full object-cover pointer-events-none"
          />
        </div>

        {/* Top Floating Control Bar */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
          {/* Left: Shade Identity Tag */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/85 backdrop-blur-md border border-neutral-700/60 text-white text-xs shadow-xl pointer-events-auto max-w-[calc(100%-100px)] min-w-0">
            <span
              className="w-3 h-3 rounded-full ring-1 ring-white/50 shrink-0 shadow-sm"
              style={{ backgroundColor: activeColor }}
            />
            {zoneLabel && (
              <span className="text-amber-400 font-bold bg-amber-500/20 px-1.5 py-0.5 rounded text-[10px] shrink-0">
                {zoneLabel}
              </span>
            )}
            <strong className="text-amber-400 font-mono font-black shrink-0">{shadeInfo.code}</strong>
            <span className="text-neutral-300 truncate text-[11px] font-medium">• {shadeInfo.name}</span>
            {greyPercentage > 0 && (
              <span className="shrink-0 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-mono font-black border border-white/30 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                <span>{greyPercentage}%</span>
              </span>
            )}
          </div>

          {/* Right: Sleek Zoom Controls Pill */}
          <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-950/85 backdrop-blur-md border border-neutral-700/60 shadow-xl pointer-events-auto shrink-0 font-mono">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoom <= 1.0}
              className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-black text-neutral-300 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer active:scale-90"
              title="Zoom Out (Scroll Down)"
              aria-label="Zoom Out"
            >
              −
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Click to reset zoom to 1.0x"
            >
              {zoom.toFixed(1)}x
            </button>
            <button
              type="button"
              onClick={handleZoomIn}
              disabled={zoom >= 4.0}
              className="w-6 h-6 flex items-center justify-center rounded-full text-xs font-black text-neutral-300 hover:text-white hover:bg-white/15 disabled:opacity-25 disabled:pointer-events-none transition-all cursor-pointer active:scale-90"
              title="Zoom In (Scroll Up)"
              aria-label="Zoom In"
            >
              +
            </button>
          </div>
        </div>

        {/* Bottom Floating Control Bar */}
        <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 pointer-events-none z-10">
          {/* Bottom-Left: Interactive Hint or Preset Levels */}
          <div className="pointer-events-auto">
            {zoom > 1.0 ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/85 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono text-amber-300 shadow-xl animate-in fade-in duration-150">
                <span>✋ Drag to pan</span>
                <span className="text-white/30">•</span>
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="underline hover:text-white cursor-pointer font-bold"
                >
                  ↺ Reset
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 p-0.5 rounded-full bg-neutral-950/80 backdrop-blur-md border border-neutral-700/60 shadow-lg text-[9px] font-mono">
                <span className="text-neutral-500 px-1.5 text-[8px] uppercase tracking-wider font-bold">Zoom:</span>
                {[
                  { label: "1x", val: 1.0, title: "100x Overview" },
                  { label: "2x", val: 2.0, title: "200x Cuticle View" },
                  { label: "3x", val: 3.0, title: "300x Fiber Macro" },
                  { label: "4x", val: 4.0, title: "400x Cellular Macro" },
                ].map((preset) => {
                  const isActive = Math.abs(zoom - preset.val) < 0.15;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoomLevel(preset.val);
                      }}
                      className={`px-1.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                        isActive
                          ? "bg-amber-500 text-neutral-950 font-black shadow-xs"
                          : "text-neutral-400 hover:text-white hover:bg-white/10"
                      }`}
                      title={preset.title}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bottom-Right: Environmental Lighting Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950/85 backdrop-blur-md border border-neutral-700/60 text-[10px] font-medium text-neutral-300 shadow-xl pointer-events-auto shrink-0 whitespace-nowrap leading-none">
            <span>
              {activeLight === "WARM"
                ? "💡 Warm Salon Halogen (3000K)"
                : activeLight === "COOL"
                ? "🏢 Clean Indoor Light (4000K)"
                : "☀️ Direct Outdoor Sunlight (6500K)"}
            </span>
          </div>
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
              Observe how pigments & silver strands react under different lights
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
                <span className="text-[9px] font-mono text-neutral-400">6500K D65</span>
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
                Maximum clarity and vibrant reflections under outdoor sky.
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
                <span className="text-[9px] font-mono text-neutral-400">4000K Clean</span>
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
