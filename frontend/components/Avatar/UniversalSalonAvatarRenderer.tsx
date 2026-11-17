"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { AvatarView, LightingPreset, SkinTonePreset } from "./AvatarTypes";
import { avatarTelemetry } from "../../services/telemetryService";

// Dynamic code splitting for Canvas 2D fallback engine
const HighEndSalonAvatarCanvas = dynamic(
  () =>
    import("./HighEndSalonAvatarCanvas").then((mod) => mod.HighEndSalonAvatarCanvas),
  { ssr: false }
);

// Dynamic code splitting for WebGL 2.0 GPU fragment shader engine
const WebGLSalonAvatarCanvas = dynamic(
  () =>
    import("./WebGLSalonAvatarCanvas").then((mod) => mod.WebGLSalonAvatarCanvas),
  { ssr: false }
);

export type RendererSelection = "auto" | "webgl" | "canvas";

export interface UniversalSalonAvatarRendererProps {
  rootsColor: string;
  midColor: string;
  endsColor: string;
  rootsLevel?: number;
  midLevel?: number;
  endsLevel?: number;
  rootsGrey?: number;
  midGrey?: number;
  endsGrey?: number;
  blendIntensity?: number;
  separateZones?: boolean;
  view?: AvatarView;
  skinTone?: SkinTonePreset;
  lighting?: LightingPreset;
  rendererPreference?: RendererSelection;
  engineVersion?: "v1-legacy" | "v2-optical" | "v3-photorealistic";
  onRendererChange?: (activeRenderer: "webgl" | "canvas") => void;
  onTelemetry?: (durationMs: number, fps: number) => void;
  className?: string;
}

export function isWebGL2Available(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return !!(window.WebGL2RenderingContext && canvas.getContext("webgl2"));
  } catch {
    return false;
  }
}

export function UniversalSalonAvatarRenderer({
  rootsColor,
  midColor,
  endsColor,
  rootsLevel = 3,
  midLevel = 5,
  endsLevel = 7,
  rootsGrey = 0,
  midGrey = 0,
  endsGrey = 0,
  blendIntensity = 0.5,
  separateZones = true,
  view = "front",
  skinTone = "fair",
  lighting = "salon",
  rendererPreference = "auto",
  engineVersion = "v3-photorealistic",
  onRendererChange,
  onTelemetry,
  className = "",
}: UniversalSalonAvatarRendererProps) {
  // Feature flag check
  const isWebGLEnabledByEnv =
    process.env.NEXT_PUBLIC_ENABLE_P4_WEBGL !== "false";

  // Determine initial candidate renderer
  const determineInitialRenderer = (): "webgl" | "canvas" => {
    if (rendererPreference === "canvas" || !isWebGLEnabledByEnv) {
      return "canvas";
    }
    if (rendererPreference === "webgl" || rendererPreference === "auto") {
      return isWebGL2Available() ? "webgl" : "canvas";
    }
    return "canvas";
  };

  const [activeRenderer, setActiveRenderer] = useState<"webgl" | "canvas">("canvas");
  const [hasCheckedSupport, setHasCheckedSupport] = useState<boolean>(false);

  const onRendererChangeRef = useRef(onRendererChange);
  useEffect(() => {
    onRendererChangeRef.current = onRendererChange;
  }, [onRendererChange]);

  const onTelemetryRef = useRef(onTelemetry);
  useEffect(() => {
    onTelemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  useEffect(() => {
    const initial = determineInitialRenderer();
    setActiveRenderer(initial);
    setHasCheckedSupport(true);
    onRendererChangeRef.current?.(initial);

    avatarTelemetry.logEvent({
      renderer: initial === "webgl" ? "webgl2" : "canvas2d",
      event: "init",
      metadata: { rendererPreference, isWebGLEnabledByEnv },
    });
  }, [rendererPreference, isWebGLEnabledByEnv]);

  // Handle runtime GPU failure & automatic graceful fallback to Canvas 2D
  const handleFallback = useCallback(
    (reason: string) => {
      console.warn(
        `[UniversalSalonAvatarRenderer] Fallback triggered: ${reason}. Switching seamlessly to Canvas 2D.`
      );
      setActiveRenderer("canvas");
      onRendererChangeRef.current?.("canvas");

      avatarTelemetry.logEvent({
        renderer: "webgl2",
        event: "fallback",
        errorReason: reason,
      });
    },
    []
  );

  if (!hasCheckedSupport) {
    return (
      <div className={`relative flex items-center justify-center w-full h-full bg-neutral-950 ${className}`}>
        <div className="flex flex-col items-center gap-2">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-amber-500/40 border-t-amber-400" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            Selecting Optimal Hardware Renderer...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      {activeRenderer === "webgl" ? (
        <WebGLSalonAvatarCanvas
          rootsColor={rootsColor}
          midColor={midColor}
          endsColor={endsColor}
          rootsLevel={rootsLevel}
          midLevel={midLevel}
          endsLevel={endsLevel}
          rootsGrey={rootsGrey}
          midGrey={midGrey}
          endsGrey={endsGrey}
          blendIntensity={blendIntensity}
          separateZones={separateZones}
          view={view}
          skinTone={skinTone}
          lighting={lighting}
          onFallback={handleFallback}
          onTelemetry={(ms, fps) => onTelemetryRef.current?.(ms, fps)}
          className="w-full h-full"
        />
      ) : (
        <HighEndSalonAvatarCanvas
          rootsColor={rootsColor}
          midColor={midColor}
          endsColor={endsColor}
          rootsLevel={rootsLevel}
          midLevel={midLevel}
          endsLevel={endsLevel}
          rootsGrey={rootsGrey}
          midGrey={midGrey}
          endsGrey={endsGrey}
          blendIntensity={blendIntensity}
          separateZones={separateZones}
          view={view}
          skinTone={skinTone}
          lighting={lighting}
          engineVersion={engineVersion}
          onTelemetry={(ms, fps) => onTelemetryRef.current?.(ms, fps)}
          className="w-full h-full"
        />
      )}
    </div>
  );
}
