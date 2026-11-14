"use client";

import React, { createContext, useContext, useState } from "react";

export type AppMode = "STYLIST" | "CHEMIST";
export type AppLanguage = "en";

interface AppContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
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
  const [mode, setModeState] = useState<AppMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem("nh_app_mode") as AppMode;
        if (savedMode === "STYLIST" || savedMode === "CHEMIST") {
          return savedMode;
        }
      } catch {
        // ignore
      }
    }
    return "STYLIST";
  });

  const [language, setLanguageState] = useState<AppLanguage>("en");

  const setMode = (newMode: AppMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem("nh_app_mode", newMode);
    } catch {
      // ignore
    }
  };

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
  };

  // Safe no-ops since voice/audio feature is disabled
  const noop = () => {};

  return (
    <AppContext.Provider
      value={{
        mode,
        setMode,
        language,
        setLanguage,
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
