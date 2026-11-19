/**
 * useHairAvatar.ts
 * Master React state management hook for Nirav Hairstorm Hair Avatar Studio.
 */

import { useCallback, useEffect, useState } from "react";
import {
  AvatarLightingEnvironment,
  AvatarStudioState,
  AvatarView,
  HairRegionId,
  HairstyleId,
  RegionColourConfig,
  SkinCustomAdjustment,
} from "../types/avatar.types";
import { SkinTone } from "../../../constants/skinTones";
import { useApp } from "../../../context/AppContext";
import {
  createDefaultRegionsFromTarget,
  extractRegionsFromAssessment,
  extractRegionsFromFormulation,
} from "../services/avatarColourAdapter";
import { TargetColourInput } from "../../../types/formulation";
import { HairAssessmentInput } from "../../../types/assessment";

const STORAGE_KEY_STATE = "nh_avatar_studio_state";

const DEFAULT_REGIONS: Record<HairRegionId, RegionColourConfig> = {
  roots: {
    level: 4,
    primaryTone: "NATURAL",
    secondaryTone: null,
    intensity: "STANDARD",
    isBleached: false,
    greyPercentage: 0,
  },
  mid_lengths: {
    level: 6,
    primaryTone: "GOLD",
    secondaryTone: "COPPER",
    intensity: "STANDARD",
    isBleached: false,
    greyPercentage: 0,
  },
  ends: {
    level: 7,
    primaryTone: "GOLD",
    secondaryTone: null,
    intensity: "STANDARD",
    isBleached: false,
    greyPercentage: 0,
  },
};

function mapAppContextLighting(appLight?: string): AvatarLightingEnvironment {
  if (appLight === "DAYLIGHT" || appLight === "SUNLIGHT") return "SUNLIGHT";
  if (appLight === "COOL" || appLight === "OFFICE") return "OFFICE";
  return "SALON";
}

export function useHairAvatar() {
  const appContext = useApp();

  const [state, setState] = useState<AvatarStudioState>({
    hairstyle: "wavy",
    viewAngle: "front",
    skinTone: appContext?.skinTone || "MEDIUM",
    skinCustom: { melaninDepth: 0.48, warmth: 0.4 },
    regions: DEFAULT_REGIONS,
    lighting: mapAppContextLighting(appContext?.lightingMode),
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    beforeAfterMode: "off",
    beforeAfterSplit: 0.5,
    showOriginal: false,
    formulationSynced: false,
    loading: false,
    error: null,
    rendererMode: "webgl2",
  });

  // Load saved state or integrate with active formulation
  useEffect(() => {
    try {
      // 1. Check if user already customized studio
      const saved = localStorage.getItem(STORAGE_KEY_STATE);
      if (saved) {
        const parsed = JSON.parse(saved);
        setState((prev) => ({
          ...prev,
          hairstyle: parsed.hairstyle || prev.hairstyle,
          viewAngle: parsed.viewAngle || prev.viewAngle,
          skinTone: parsed.skinTone || prev.skinTone,
          skinCustom: parsed.skinCustom || prev.skinCustom,
          regions: parsed.regions || prev.regions,
          lighting: mapAppContextLighting(parsed.lighting) || prev.lighting,
        }));
        return;
      }

      // 2. Otherwise auto-populate from active formulation or target colour
      const savedFormulation = localStorage.getItem("nh_formulation_result");
      const savedTarget = localStorage.getItem("nh_target_colour");
      const savedAssessment = localStorage.getItem("nh_hair_assessment");

      let targetParsed: TargetColourInput | null = null;
      if (savedTarget) targetParsed = JSON.parse(savedTarget);

      if (savedFormulation) {
        const formResult = JSON.parse(savedFormulation);
        const derivedRegions = extractRegionsFromFormulation(formResult, targetParsed);
        setState((prev) => ({
          ...prev,
          regions: derivedRegions,
          formulationSynced: true,
        }));
      } else if (targetParsed) {
        const derived = createDefaultRegionsFromTarget(targetParsed);
        setState((prev) => ({
          ...prev,
          regions: derived,
          formulationSynced: true,
        }));
      } else if (savedAssessment) {
        const assessParsed: HairAssessmentInput = JSON.parse(savedAssessment);
        const derived = extractRegionsFromAssessment(assessParsed);
        setState((prev) => ({
          ...prev,
          regions: derived,
          formulationSynced: false,
        }));
      }
    } catch (e) {
      console.warn("Could not initialize hair avatar state:", e);
    }
  }, []);

  // Save changes to localStorage
  const persistState = (updater: (prev: AvatarStudioState) => AvatarStudioState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(
          STORAGE_KEY_STATE,
          JSON.stringify({
            hairstyle: next.hairstyle,
            viewAngle: next.viewAngle,
            skinTone: next.skinTone,
            skinCustom: next.skinCustom,
            regions: next.regions,
            lighting: next.lighting,
          })
        );
      } catch {
        // ignore
      }
      return next;
    });
  };

  // State setters
  const setHairstyle = useCallback((hairstyle: HairstyleId) => {
    persistState((prev) => ({ ...prev, hairstyle }));
  }, []);

  const setViewAngle = useCallback((viewAngle: AvatarView) => {
    persistState((prev) => ({ ...prev, viewAngle }));
    if (appContext?.setViewAngle) {
      appContext.setViewAngle(viewAngle === "front" ? "FRONT" : "BACK");
    }
  }, [appContext]);

  const setSkinTone = useCallback((skinTone: SkinTone) => {
    persistState((prev) => ({ ...prev, skinTone }));
    if (appContext?.setSkinTone) {
      appContext.setSkinTone(skinTone);
    }
  }, [appContext]);

  const setSkinCustom = useCallback((skinCustom: SkinCustomAdjustment) => {
    persistState((prev) => ({ ...prev, skinCustom }));
  }, []);

  const setRegion = useCallback((region: HairRegionId, config: Partial<RegionColourConfig>) => {
    persistState((prev) => ({
      ...prev,
      regions: {
        ...prev.regions,
        [region]: {
          ...prev.regions[region],
          ...config,
        },
      },
      formulationSynced: false,
    }));
  }, []);

  const setAllRegions = useCallback((regions: Record<HairRegionId, RegionColourConfig>) => {
    persistState((prev) => ({
      ...prev,
      regions,
      formulationSynced: false,
    }));
  }, []);

  const setLighting = useCallback((lighting: AvatarLightingEnvironment) => {
    persistState((prev) => ({ ...prev, lighting }));
    if (appContext?.setLightingMode) {
      appContext.setLightingMode(
        lighting === "SUNLIGHT" ? "DAYLIGHT" : lighting === "SALON" ? "WARM" : "COOL"
      );
    }
  }, [appContext]);

  const setZoom = useCallback((zoom: number) => {
    setState((prev) => ({
      ...prev,
      zoom: Math.max(1.0, Math.min(3.0, Number(zoom.toFixed(2)))),
      pan: zoom <= 1.0 ? { x: 0, y: 0 } : prev.pan,
    }));
  }, []);

  const setPan = useCallback((pan: { x: number; y: number }) => {
    setState((prev) => ({ ...prev, pan }));
  }, []);

  const setBeforeAfterMode = useCallback((beforeAfterMode: "split" | "toggle" | "off") => {
    setState((prev) => ({ ...prev, beforeAfterMode }));
  }, []);

  const setBeforeAfterSplit = useCallback((beforeAfterSplit: number) => {
    setState((prev) => ({ ...prev, beforeAfterSplit: Math.max(0.0, Math.min(1.0, beforeAfterSplit)) }));
  }, []);

  const setShowOriginal = useCallback((showOriginal: boolean) => {
    setState((prev) => ({ ...prev, showOriginal }));
  }, []);

  const syncWithFormulation = useCallback(() => {
    try {
      const savedFormulation = localStorage.getItem("nh_formulation_result");
      const savedTarget = localStorage.getItem("nh_target_colour");
      let targetParsed: TargetColourInput | null = null;
      if (savedTarget) targetParsed = JSON.parse(savedTarget);

      if (savedFormulation) {
        const formResult = JSON.parse(savedFormulation);
        const derived = extractRegionsFromFormulation(formResult, targetParsed);
        persistState((prev) => ({ ...prev, regions: derived, formulationSynced: true }));
      } else if (targetParsed) {
        const derived = createDefaultRegionsFromTarget(targetParsed);
        persistState((prev) => ({ ...prev, regions: derived, formulationSynced: true }));
      }
    } catch (e) {
      console.warn("Failed to sync formulation with avatar:", e);
    }
  }, []);

  const resetToNatural = useCallback(() => {
    persistState((prev) => ({
      ...prev,
      regions: DEFAULT_REGIONS,
      skinTone: "MEDIUM",
      skinCustom: { melaninDepth: 0.48, warmth: 0.4 },
      formulationSynced: false,
    }));
  }, []);

  const setRendererMode = useCallback((mode: "webgl2" | "canvas2d") => {
    setState((prev) => ({ ...prev, rendererMode: mode }));
  }, []);

  return {
    state,
    setHairstyle,
    setViewAngle,
    setSkinTone,
    setSkinCustom,
    setRegion,
    setAllRegions,
    setLighting,
    setZoom,
    setPan,
    setBeforeAfterMode,
    setBeforeAfterSplit,
    setShowOriginal,
    syncWithFormulation,
    resetToNatural,
    setRendererMode,
  };
}
