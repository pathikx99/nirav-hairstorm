"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { HairRenderer } from "../../features/avatar/rendering/HairRenderer";
import { LoadedAvatarTextures } from "../../features/avatar/services/avatarAssetService";
import { globalHairMaskManager } from "../../features/avatar/rendering/HairMaskManager";
import { resolveAvatarShading } from "../../features/avatar/services/avatarColourAdapter";
import {
  AvatarLightingEnvironment,
  AvatarView,
  HairRegionId,
  HairstyleId,
  RegionColourConfig,
  SkinCustomAdjustment,
} from "../../features/avatar/types/avatar.types";
import { SkinTone } from "../../constants/skinTones";
import { getHairstyleMetadata } from "../../features/avatar/data/avatarRegistry";
import { getLightingMetadata } from "../../features/avatar/data/lightingProfiles";

interface HairAvatarViewportProps {
  hairstyle: HairstyleId;
  viewAngle: AvatarView;
  skinTone: SkinTone;
  skinCustom: SkinCustomAdjustment;
  regions: Record<HairRegionId, RegionColourConfig>;
  lighting: AvatarLightingEnvironment;
  zoom: number;
  pan: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (pan: { x: number; y: number }) => void;
  beforeAfterMode: "split" | "toggle" | "off";
  beforeAfterSplit: number;
  onSplitChange: (split: number) => void;
  showOriginal: boolean;
  className?: string;
}

export function HairAvatarViewport({
  hairstyle,
  viewAngle,
  skinTone,
  skinCustom,
  regions,
  lighting,
  zoom,
  pan,
  onZoomChange,
  onPanChange,
  beforeAfterMode,
  beforeAfterSplit,
  onSplitChange,
  showOriginal,
  className = "",
}: HairAvatarViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<HairRenderer | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTextures, setCurrentTextures] = useState<LoadedAvatarTextures | null>(null);
  const [rendererType, setRendererType] = useState<"webgl2" | "canvas2d">("webgl2");

  // Drag-to-pan state
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Draggable split divider
  const isDraggingSplitRef = useRef(false);

  // Initialize renderer
  useEffect(() => {
    if (!canvasRef.current) return;
    const renderer = new HairRenderer(canvasRef.current);
    rendererRef.current = renderer;
    setRendererType(renderer.isWebGL ? "webgl2" : "canvas2d");

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  // Load textures for the active hairstyle & perspective
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    globalHairMaskManager
      .getTextures(hairstyle, viewAngle)
      .then((textures) => {
        if (cancelled) return;
        setCurrentTextures(textures);
        setLoading(false);
        // Warm up alternate perspective in background
        globalHairMaskManager.preloadAdjacent(hairstyle, viewAngle);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Avatar asset load failure:", err);
        setError("Failed to load photorealistic avatar assets. Please check network connection.");
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hairstyle, viewAngle]);

  // Execute render pass on any parameter change
  const triggerRender = useCallback(() => {
    if (!rendererRef.current || !currentTextures) return;

    const shading = resolveAvatarShading(regions);

    rendererRef.current.render({
      textures: currentTextures,
      shading,
      skinTone,
      skinCustom,
      lighting,
      hairstyle,
      viewAngle,
      splitX: beforeAfterSplit,
      splitActive: beforeAfterMode === "split",
      showOriginal: showOriginal || beforeAfterMode === "toggle",
    });
  }, [
    currentTextures,
    regions,
    skinTone,
    skinCustom,
    lighting,
    hairstyle,
    viewAngle,
    beforeAfterSplit,
    beforeAfterMode,
    showOriginal,
  ]);

  useEffect(() => {
    triggerRender();
  }, [triggerRender]);

  // Pan boundary clamping
  const clampPan = (targetPan: { x: number; y: number }, targetZoom: number) => {
    if (targetZoom <= 1.0) return { x: 0, y: 0 };
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width || 500;
    const h = rect?.height || 670;
    const maxX = ((targetZoom - 1) * w) / 2;
    const maxY = ((targetZoom - 1) * h) / 2;
    return {
      x: Math.min(maxX, Math.max(-maxX, targetPan.x)),
      y: Math.min(maxY, Math.max(-maxY, targetPan.y)),
    };
  };

  // Pan event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // If clicking on or near the split slider line
    if (beforeAfterMode === "split" && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickNormX = (e.clientX - rect.left) / rect.width;
      if (Math.abs(clickNormX - beforeAfterSplit) < 0.04) {
        isDraggingSplitRef.current = true;
        return;
      }
    }

    if (zoom <= 1.0) return;
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingSplitRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const normX = Math.max(0.05, Math.min(0.95, (e.clientX - rect.left) / rect.width));
      onSplitChange(normX);
      return;
    }

    if (!isDraggingRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const nextPan = clampPan(
      { x: panStartRef.current.x + dx, y: panStartRef.current.y + dy },
      zoom
    );
    onPanChange(nextPan);
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
    isDraggingSplitRef.current = false;
  };

  const archMeta = getHairstyleMetadata(hairstyle);
  const lightMeta = getLightingMetadata(lighting);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950 shadow-2xl flex items-center justify-center select-none ${
        zoom > 1.0 ? "cursor-grab active:cursor-grabbing" : "cursor-default"
      } ${className}`}
      style={{ minHeight: "560px" }}
    >
      {/* Canvas Viewport */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-contain pointer-events-none transition-transform duration-75"
        style={{
          transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
          maxHeight: "720px",
        }}
      />

      {/* Loading Overlay */}
      {loading && (
        <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent shadow-lg" />
          <span className="text-xs font-bold text-amber-300 tracking-wide uppercase">
            Loading {archMeta.name} ({viewAngle === "front" ? "Front" : "Back"})...
          </span>
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 bg-neutral-950/90 flex flex-col items-center justify-center p-6 text-center z-30 space-y-3">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm font-bold text-rose-400 max-w-sm">{error}</p>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setLoading(true);
              globalHairMaskManager.getTextures(hairstyle, viewAngle).then(setCurrentTextures);
            }}
            className="px-4 py-1.5 rounded-xl bg-amber-500 text-neutral-950 text-xs font-black"
          >
            Retry Loading
          </button>
        </div>
      )}

      {/* Split Comparison Floating Indicator Handle */}
      {beforeAfterMode === "split" && !loading && (
        <div
          className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center justify-center"
          style={{ left: `${beforeAfterSplit * 100}%` }}
        >
          <div className="w-0.5 h-full bg-gradient-to-b from-amber-500 via-amber-400 to-amber-500 shadow-md" />
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-xs font-black shadow-xl ring-2 ring-neutral-950 pointer-events-auto cursor-ew-resize">
            <span>↔</span>
          </div>
        </div>
      )}

      {/* Top Floating Badges */}
      <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none z-10">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="rounded-xl bg-neutral-900/90 border border-neutral-800 px-2.5 py-1 text-[10px] font-black text-amber-400 shadow-md backdrop-blur-md">
            {archMeta.name} • {viewAngle === "front" ? "Front View" : "Back Cascade"}
          </span>

          <span className="rounded-xl bg-neutral-900/90 border border-neutral-800 px-2 py-1 text-[10px] font-bold text-neutral-300 shadow-md backdrop-blur-md hidden sm:inline-block">
            {lightMeta.icon} {lightMeta.name} ({lightMeta.cct})
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="rounded-xl bg-neutral-900/90 border border-neutral-800 px-2 py-1 text-[9px] font-mono text-neutral-400 shadow-md backdrop-blur-md">
            {rendererType === "webgl2" ? "GPU: WebGL 2.0" : "2D Canvas Fallback"}
          </span>
        </div>
      </div>

      {/* Bottom Floating Zoom / Pan Controls */}
      <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 bg-neutral-900/90 border border-neutral-800 rounded-2xl p-1 shadow-xl backdrop-blur-md z-10">
        <button
          type="button"
          onClick={() => onZoomChange(Math.max(1.0, zoom - 0.5))}
          disabled={zoom <= 1.0}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom Out"
        >
          −
        </button>

        <span className="text-[10px] font-mono font-bold text-amber-400 px-1">
          {zoom.toFixed(1)}x
        </span>

        <button
          type="button"
          onClick={() => onZoomChange(Math.min(3.0, zoom + 0.5))}
          disabled={zoom >= 3.0}
          className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:bg-transparent"
          title="Zoom In"
        >
          +
        </button>

        {zoom > 1.0 && (
          <button
            type="button"
            onClick={() => {
              onZoomChange(1.0);
              onPanChange({ x: 0, y: 0 });
            }}
            className="text-[9px] font-bold text-neutral-400 hover:text-white px-2 py-1 rounded-lg bg-neutral-800"
            title="Reset Zoom"
          >
            Reset
          </button>
        )}
      </div>

      {/* Before/After Indicator Labels */}
      {beforeAfterMode === "split" && (
        <div className="absolute bottom-3.5 left-3.5 flex items-center gap-3 text-[10px] font-black tracking-wider uppercase pointer-events-none z-10">
          <span className="rounded-lg bg-neutral-900/80 px-2 py-0.5 text-neutral-400 border border-neutral-800">
            ← Before (Base)
          </span>
          <span className="rounded-lg bg-amber-500/20 px-2 py-0.5 text-amber-300 border border-amber-500/40">
            After (Look) →
          </span>
        </div>
      )}
    </div>
  );
}
