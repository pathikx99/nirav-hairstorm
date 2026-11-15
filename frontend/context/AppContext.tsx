"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApplicationTechnique } from "../types/formulation";
import { SkinTone } from "../constants/skinTones";
import { ClientHairPhotoAnalysis } from "../services/clientHairPhotoService";

export type AppMode = "STYLIST" | "CHEMIST";
export type ConsultationMode = "EXPRESS" | "PRO";
export type LightingMode = "DAYLIGHT" | "WARM" | "COOL";
export type ViewAngle = "FRONT" | "BACK";
export type AppLanguage = "en";

interface AppContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  consultationMode: ConsultationMode;
  setConsultationMode: (mode: ConsultationMode) => void;
  activeTechnique: ApplicationTechnique;
  setActiveTechnique: (tech: ApplicationTechnique) => void;
  lightingMode: LightingMode;
  setLightingMode: (light: LightingMode) => void;
  skinTone: SkinTone;
  setSkinTone: (tone: SkinTone) => void;
  viewAngle: ViewAngle;
  setViewAngle: (angle: ViewAngle) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  // Exact Customer Hair Photo & Analysis
  clientPhoto: string | null;
  clientPhotoView: ViewAngle;
  isCustomClientPhoto: boolean;
  setClientPhoto: (photo: string | null, isCustom?: boolean, view?: ViewAngle) => void;
  clientHairAnalysis: ClientHairPhotoAnalysis | null;
  setClientHairAnalysis: (analysis: ClientHairPhotoAnalysis | null) => void;
  // Sound & Speech
  speak: (hi: string, en: string) => void;
  stopSpeaking: () => void;
  playChime: () => void;
  playBuzzer: () => void;
  playSiren: () => void;
  playBell: () => void;
  playTick: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("STYLIST");
  const [consultationMode, setConsultationModeState] = useState<ConsultationMode>("EXPRESS");
  const [activeTechnique, setActiveTechniqueState] = useState<ApplicationTechnique>("ALL_OVER");
  const [lightingMode, setLightingModeState] = useState<LightingMode>("WARM");
  const [skinTone, setSkinToneState] = useState<SkinTone>("MEDIUM");
  const [viewAngle, setViewAngleState] = useState<ViewAngle>("FRONT");
  const [language, setLanguageState] = useState<AppLanguage>("en");

  // Client Photo State
  const [clientPhoto, setClientPhotoState] = useState<string | null>(null);
  const [clientPhotoView, setClientPhotoView] = useState<ViewAngle>("FRONT");
  const [isCustomClientPhoto, setIsCustomClientPhoto] = useState<boolean>(false);
  const [clientHairAnalysis, setClientHairAnalysis] = useState<ClientHairPhotoAnalysis | null>(null);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem("nh_app_mode") as AppMode;
      if (savedMode === "STYLIST" || savedMode === "CHEMIST") setModeState(savedMode);
      const savedConsult = localStorage.getItem("nh_consultation_mode") as ConsultationMode;
      if (savedConsult === "EXPRESS" || savedConsult === "PRO") setConsultationModeState(savedConsult);
      const savedTech = localStorage.getItem("nh_active_technique") as ApplicationTechnique;
      if (savedTech) setActiveTechniqueState(savedTech);
      const savedLight = localStorage.getItem("nh_lighting_mode") as LightingMode;
      if (savedLight) setLightingModeState(savedLight);
      const savedSkin = localStorage.getItem("nh_skin_tone") as SkinTone;
      if (savedSkin) setSkinToneState(savedSkin);
      const savedView = localStorage.getItem("nh_view_angle") as ViewAngle;
      if (savedView === "FRONT" || savedView === "BACK") setViewAngleState(savedView);

      // Load saved customer photo
      const savedPhoto = localStorage.getItem("nh_client_photo");
      if (savedPhoto) {
        setClientPhotoState(savedPhoto);
        setIsCustomClientPhoto(true);
      } else {
        // Default to real salon client photo
        setClientPhotoState("/models/model_front.jpg");
        setIsCustomClientPhoto(false);
      }

      const savedAnalysis = localStorage.getItem("nh_client_hair_analysis");
      if (savedAnalysis) {
        setClientHairAnalysis(JSON.parse(savedAnalysis));
      }
    } catch {
      // ignore
    }
  }, []);

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("nh_app_mode", newMode);
    } catch {
      // ignore
    }
  };

  const setConsultationMode = (newConsultationMode: ConsultationMode) => {
    setConsultationModeState(newConsultationMode);
    try {
      localStorage.setItem("nh_consultation_mode", newConsultationMode);
    } catch {
      // ignore
    }
  };

  const setActiveTechnique = (newTech: ApplicationTechnique) => {
    setActiveTechniqueState(newTech);
    try {
      localStorage.setItem("nh_active_technique", newTech);
    } catch {
      // ignore
    }
  };

  const setLightingMode = (newLight: LightingMode) => {
    setLightingModeState(newLight);
    try {
      localStorage.setItem("nh_lighting_mode", newLight);
    } catch {
      // ignore
    }
  };

  const setSkinTone = (newTone: SkinTone) => {
    setSkinToneState(newTone);
    try {
      localStorage.setItem("nh_skin_tone", newTone);
    } catch {
      // ignore
    }
  };

  const setViewAngle = (newAngle: ViewAngle) => {
    setViewAngleState(newAngle);
    try {
      localStorage.setItem("nh_view_angle", newAngle);
      if (!isCustomClientPhoto) {
        // Switch between front and back client model photo
        const defaultPath = newAngle === "FRONT" ? "/models/model_front.jpg" : "/models/model_back.jpg";
        setClientPhotoState(defaultPath);
        setClientPhotoView(newAngle);
      }
    } catch {
      // ignore
    }
  };

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
  };

  const setClientPhoto = (photo: string | null, isCustom: boolean = true, view: ViewAngle = "FRONT") => {
    setClientPhotoState(photo);
    setIsCustomClientPhoto(isCustom);
    setClientPhotoView(view);
    try {
      if (photo && isCustom) {
        localStorage.setItem("nh_client_photo", photo);
        localStorage.setItem("nh_is_custom_client_photo", "true");
      } else if (!isCustom) {
        localStorage.removeItem("nh_client_photo");
        localStorage.removeItem("nh_is_custom_client_photo");
      }
    } catch {
      // ignore storage quota exceeded
    }
  };

  const setClientHairAnalysisHandler = (analysis: ClientHairPhotoAnalysis | null) => {
    setClientHairAnalysis(analysis);
    try {
      if (analysis) {
        localStorage.setItem("nh_client_hair_analysis", JSON.stringify(analysis));
      } else {
        localStorage.removeItem("nh_client_hair_analysis");
      }
    } catch {
      // ignore
    }
  };

  // Safe no-ops
  const noop = () => {};

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        consultationMode,
        setConsultationMode,
        activeTechnique,
        setActiveTechnique,
        lightingMode,
        setLightingMode,
        skinTone,
        setSkinTone,
        viewAngle,
        setViewAngle,
        language,
        setLanguage,
        clientPhoto,
        clientPhotoView,
        isCustomClientPhoto,
        setClientPhoto,
        clientHairAnalysis,
        setClientHairAnalysis: setClientHairAnalysisHandler,
        speak: noop,
        stopSpeaking: noop,
        playChime: noop,
        playBuzzer: noop,
        playSiren: noop,
        playBell: noop,
        playTick: noop,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
