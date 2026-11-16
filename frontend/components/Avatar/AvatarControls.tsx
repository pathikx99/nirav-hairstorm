/**
 * AvatarControls.tsx
 * Comprehensive salon control interface for the procedural hair avatar.
 * Controls 3 independent zones, natural base, skin tones, undertones,
 * lighting presets, view switcher, and blend intensity.
 */

import React from "react";
import {
  AvatarState,
  HairZoneId,
  LightingPreset,
  SkinTonePreset,
  SkinUndertone,
  UniversalLevel,
  ToneFamily,
  PROFESSIONAL_LEVELS,
  TONAL_FAMILIES,
  SKIN_TONE_PRESETS,
  LIGHTING_PRESETS,
  RenderedHairPalette,
} from "./AvatarTypes";

interface AvatarControlsProps {
  state: AvatarState;
  palette: RenderedHairPalette;
  onChange: (updater: (prev: AvatarState) => AvatarState) => void;
  showSkinToneBar?: boolean;
  showViewToggle?: boolean;
  showLightingBar?: boolean;
  showZoneCards?: boolean;
  showLevelSlider?: boolean;
  showToneSelector?: boolean;
  className?: string;
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({
  state,
  palette,
  onChange,
  showSkinToneBar = true,
  showViewToggle = true,
  showLightingBar = true,
  showZoneCards = true,
  showLevelSlider = true,
  showToneSelector = true,
  className = "",
}) => {
  const activeZoneId = state.activeZone;
  const activeZoneData = state.hair[activeZoneId];
  const activeLevel = activeZoneData.level;
  const activeTone = activeZoneData.tone;

  // Active zone name formatting
  const activeZoneTitle =
    activeZoneId === "roots"
      ? "Roots (Zone 1)"
      : activeZoneId === "midLengths"
      ? "Mid-Lengths (Zone 2)"
      : "Ends (Zone 3)";

  // Handlers
  const handleSetView = (view: "front" | "back") => {
    onChange((prev) => ({ ...prev, view }));
  };

  const handleSetLighting = (lighting: LightingPreset) => {
    onChange((prev) => ({ ...prev, lighting }));
  };

  const handleSelectZone = (zone: HairZoneId) => {
    onChange((prev) => ({ ...prev, activeZone: zone }));
  };

  const handleToggleSeparateZones = () => {
    onChange((prev) => {
      const nextSeparate = !prev.hair.separateZones;
      if (!nextSeparate) {
        // Sync mid & ends to active zone
        const source = prev.hair[prev.activeZone];
        return {
          ...prev,
          hair: {
            ...prev.hair,
            separateZones: false,
            roots: { ...source },
            midLengths: { ...source },
            ends: { ...source },
          },
        };
      }
      return {
        ...prev,
        hair: {
          ...prev.hair,
          separateZones: true,
        },
      };
    });
  };

  const handleLevelChange = (newLevel: UniversalLevel) => {
    onChange((prev) => {
      if (!prev.hair.separateZones) {
        // Apply to all
        return {
          ...prev,
          hair: {
            ...prev.hair,
            roots: { ...prev.hair.roots, level: newLevel },
            midLengths: { ...prev.hair.midLengths, level: newLevel },
            ends: { ...prev.hair.ends, level: newLevel },
          },
        };
      }
      return {
        ...prev,
        hair: {
          ...prev.hair,
          [prev.activeZone]: {
            ...prev.hair[prev.activeZone],
            level: newLevel,
          },
        },
      };
    });
  };

  const handleToneChange = (newTone: ToneFamily) => {
    onChange((prev) => {
      if (!prev.hair.separateZones) {
        return {
          ...prev,
          hair: {
            ...prev.hair,
            roots: { ...prev.hair.roots, tone: newTone },
            midLengths: { ...prev.hair.midLengths, tone: newTone },
            ends: { ...prev.hair.ends, tone: newTone },
          },
        };
      }
      return {
        ...prev,
        hair: {
          ...prev.hair,
          [prev.activeZone]: {
            ...prev.hair[prev.activeZone],
            tone: newTone,
          },
        },
      };
    });
  };

  const handleBlendIntensityChange = (intensity: number) => {
    onChange((prev) => ({
      ...prev,
      hair: {
        ...prev.hair,
        blendIntensity: intensity,
      },
    }));
  };

  const handleSkinToneChange = (tone: SkinTonePreset) => {
    onChange((prev) => ({
      ...prev,
      skin: { ...prev.skin, tone },
    }));
  };

  const handleSkinUndertoneChange = (undertone: SkinUndertone) => {
    onChange((prev) => ({
      ...prev,
      skin: { ...prev.skin, undertone },
    }));
  };

  const handleNaturalBaseChange = (level: UniversalLevel) => {
    onChange((prev) => ({
      ...prev,
      hair: {
        ...prev.hair,
        naturalBaseLevel: level,
      },
    }));
  };

  return (
    <div className={`flex flex-col space-y-3.5 w-full text-white ${className}`}>
      {/* 1. Header Toolbar: View Switcher & Active Zone Status */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-neutral-950/80 p-2.5 rounded-2xl border border-neutral-800">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-amber-500/20 text-xs text-amber-400 border border-amber-500/30">
            🎨
          </span>
          <div>
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400">
              {activeZoneTitle}
            </span>
            <span className="text-[10px] text-neutral-400 ml-1.5 font-mono">
              Level {activeLevel} • {activeTone}
            </span>
          </div>
        </div>

        {/* View Toggle */}
        {showViewToggle && (
          <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleSetView("front")}
              className={`px-3 py-1 rounded-lg transition-all ${
                state.view === "front"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Front View
            </button>
            <button
              type="button"
              onClick={() => handleSetView("back")}
              className={`px-3 py-1 rounded-lg transition-all ${
                state.view === "back"
                  ? "bg-amber-500 text-neutral-950 font-black shadow-sm"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Back View
            </button>
          </div>
        )}
      </div>

      {/* 2. Lighting Environment Presets (Direct Sunlight, Inside Salon, Cool Indoor) */}
      {showLightingBar && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 shadow-md">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>💡</span> Lighting Environment:
            </span>
            <span className="text-[10px] font-mono text-amber-400 font-bold">
              {LIGHTING_PRESETS[state.lighting].title}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {(["sunlight", "salon", "cool"] as LightingPreset[]).map((mode) => {
              const cfg = LIGHTING_PRESETS[mode];
              const isSelected = state.lighting === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => handleSetLighting(mode)}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl text-xs font-black transition-all ${
                    isSelected
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-[1.02]"
                      : "bg-neutral-900 text-neutral-300 hover:bg-neutral-800 border border-neutral-800"
                  }`}
                >
                  <span>{cfg.icon}</span>
                  <span className="truncate">
                    {mode === "sunlight" ? "Sunlight" : mode === "salon" ? "Inside Salon" : "Cool Indoor"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. 3-Zone Tactile Cards & Separate Zones Toggle */}
      {showZoneCards && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>📐</span> Hair Zones:
            </span>

            {/* Separate Zones Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-neutral-400 font-medium">Independent:</span>
              <button
                type="button"
                onClick={handleToggleSeparateZones}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  state.hair.separateZones ? "bg-amber-500" : "bg-neutral-800"
                }`}
                title={state.hair.separateZones ? "Independent zone colors enabled" : "Unified all-over color"}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    state.hair.separateZones ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* 3 Interactive Zone Cards */}
          <div className="grid grid-cols-3 gap-2">
            {/* Zone 1: Roots */}
            <button
              type="button"
              onClick={() => handleSelectZone("roots")}
              className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left ${
                state.activeZone === "roots"
                  ? "border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/50 scale-[1.02]"
                  : "border-neutral-800 bg-neutral-900 hover:bg-neutral-850"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 w-full">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/40 shrink-0"
                  style={{ backgroundColor: palette.roots.base }}
                />
                <span className="text-xs font-black truncate">1. Roots</span>
              </div>
              <span className="text-[10px] text-neutral-300 font-bold truncate">
                L{state.hair.roots.level} • {state.hair.roots.tone.slice(0, 4)}
              </span>
            </button>

            {/* Zone 2: Mid-Lengths */}
            <button
              type="button"
              onClick={() => handleSelectZone("midLengths")}
              className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left ${
                state.activeZone === "midLengths"
                  ? "border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/50 scale-[1.02]"
                  : "border-neutral-800 bg-neutral-900 hover:bg-neutral-850"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 w-full">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/40 shrink-0"
                  style={{ backgroundColor: palette.midLengths.base }}
                />
                <span className="text-xs font-black truncate">2. Middle</span>
              </div>
              <span className="text-[10px] text-neutral-300 font-bold truncate">
                L{state.hair.midLengths.level} • {state.hair.midLengths.tone.slice(0, 4)}
              </span>
            </button>

            {/* Zone 3: Ends */}
            <button
              type="button"
              onClick={() => handleSelectZone("ends")}
              className={`flex flex-col items-start p-2 rounded-xl border transition-all text-left ${
                state.activeZone === "ends"
                  ? "border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/50 scale-[1.02]"
                  : "border-neutral-800 bg-neutral-900 hover:bg-neutral-850"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1 w-full">
                <span
                  className="h-3 w-3 rounded-full ring-1 ring-white/40 shrink-0"
                  style={{ backgroundColor: palette.ends.base }}
                />
                <span className="text-xs font-black truncate">3. Ends</span>
              </div>
              <span className="text-[10px] text-neutral-300 font-bold truncate">
                L{state.hair.ends.level} • {state.hair.ends.tone.slice(0, 4)}
              </span>
            </button>
          </div>

          {/* Blend Intensity Slider (when separate zones is enabled) */}
          {state.hair.separateZones && (
            <div className="pt-2 border-t border-neutral-800/80 space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-neutral-400 font-medium">Zone Blend Transition:</span>
                <span className="text-amber-400 font-bold font-mono">
                  {Math.round(state.hair.blendIntensity * 100)}% (
                  {state.hair.blendIntensity < 0.35
                    ? "Defined Ombre"
                    : state.hair.blendIntensity < 0.7
                    ? "Balayage"
                    : "Seamless Melt"}
                  )
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={state.hair.blendIntensity}
                onChange={(e) => handleBlendIntensityChange(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          )}
        </div>
      )}

      {/* 4. Active Zone Depth Level Slider (Levels 1 to 10) */}
      {showLevelSlider && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1">
              <span>🎚️</span> Depth Level:{" "}
              <strong className="text-amber-400">Level {activeLevel}</strong>
            </span>
            <span className="text-[10px] text-neutral-400 font-medium">
              {PROFESSIONAL_LEVELS[activeLevel - 1]?.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleLevelChange(Math.max(1, activeLevel - 1) as UniversalLevel)}
              disabled={activeLevel <= 1}
              className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-black flex items-center justify-center transition-all"
              title="Darker Level (-)"
            >
              -
            </button>

            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={activeLevel}
              onChange={(e) => handleLevelChange(Number(e.target.value) as UniversalLevel)}
              className="w-full h-2.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />

            <button
              type="button"
              onClick={() => handleLevelChange(Math.min(10, activeLevel + 1) as UniversalLevel)}
              disabled={activeLevel >= 10}
              className="h-8 w-8 rounded-xl bg-neutral-800 hover:bg-neutral-700 disabled:opacity-30 text-white font-black flex items-center justify-center transition-all"
              title="Lighter Level (+)"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* 5. Tonal Families Selector (10 Tones: Ash, Beige, Natural, Gold, Copper, Red, Violet, Mahogany, Pearl, Matte) */}
      {showToneSelector && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 space-y-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>🌈</span> Target Tone Family:
            </span>
            <span className="text-[10px] font-mono text-amber-400 capitalize font-bold">
              {activeTone} Reflect
            </span>
          </div>

          <div className="grid grid-cols-5 sm:grid-cols-5 gap-1.5">
            {TONAL_FAMILIES.map((t) => {
              const isSelected = activeTone === t.uhcr;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleToneChange(t.uhcr)}
                  className={`flex flex-col items-center p-1.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-amber-400 bg-amber-500/20 shadow-md ring-2 ring-amber-400/50 scale-[1.04]"
                      : "border-neutral-800 bg-neutral-900 hover:bg-neutral-800"
                  }`}
                  title={`${t.name} (${t.code}) - ${t.description}`}
                >
                  <div
                    className="w-5 h-5 rounded-full shadow-sm mb-1 ring-1 ring-white/20"
                    style={{ backgroundColor: t.hex }}
                  />
                  <span className="text-[9px] font-bold truncate">{t.name}</span>
                  <span className="text-[8px] text-neutral-400 font-mono">{t.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Natural Base Level Selector (Lifting Warmth & Melanin Context) */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 space-y-1.5">
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
            <span>🧬</span> Natural Base Hair Level:
          </span>
          <span className="text-[10px] font-mono text-amber-400 font-bold">
            Level {state.hair.naturalBaseLevel}
          </span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {PROFESSIONAL_LEVELS.map((pl) => {
            const isSelected = state.hair.naturalBaseLevel === pl.level;
            return (
              <button
                key={pl.level}
                type="button"
                onClick={() => handleNaturalBaseChange(pl.level)}
                className={`flex-1 py-1 rounded-lg text-[10px] font-mono font-bold transition-all border ${
                  isSelected
                    ? "bg-amber-500 text-neutral-950 border-amber-400 shadow-sm"
                    : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                }`}
                title={`Natural Base Level ${pl.level}: ${pl.name}`}
              >
                {pl.level}
              </button>
            );
          })}
        </div>
      </div>

      {/* 7. Skin Tone System (8 Fitzpatrick Presets + 4 Undertones) */}
      {showSkinToneBar && (
        <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-2.5 space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1">
              <span>🧑</span> Skin Complexion:
            </span>
            <span className="text-[10px] font-mono text-amber-400 capitalize">
              {(SKIN_TONE_PRESETS[state.skin.tone] || SKIN_TONE_PRESETS["fair"]).label} ({state.skin.undertone})
            </span>
          </div>

          {/* 12 Comprehensive Skin Tone Presets (Fitzpatrick Types I - VI) */}
          <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar scroll-smooth">
            {(Object.keys(SKIN_TONE_PRESETS) as SkinTonePreset[]).map((presetKey) => {
              const preset = SKIN_TONE_PRESETS[presetKey];
              const isSelected = state.skin.tone === presetKey;
              return (
                <button
                  key={presetKey}
                  type="button"
                  onClick={() => handleSkinToneChange(presetKey)}
                  className={`flex-shrink-0 relative flex flex-col items-center transition-all ${
                    isSelected ? "scale-110 z-10" : "opacity-75 hover:opacity-100 hover:scale-105"
                  }`}
                  title={`${preset.label} Complexion`}
                >
                  <div
                    className={`w-6 h-6 rounded-full shadow-md transition-all ${
                      isSelected
                        ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-neutral-950 scale-105"
                        : "border border-white/20"
                    }`}
                    style={{ backgroundColor: preset.preview }}
                  />
                  <span
                    className={`text-[8px] mt-0.5 truncate max-w-[36px] ${
                      isSelected ? "text-amber-400 font-bold" : "text-neutral-500"
                    }`}
                  >
                    {preset.label.slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* 4 Undertone Buttons */}
          <div className="flex items-center gap-1.5 pt-1.5 border-t border-neutral-800/80">
            <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider">
              Undertone:
            </span>
            {(["cool", "neutral", "warm", "olive"] as SkinUndertone[]).map((ut) => {
              const isSelected = state.skin.undertone === ut;
              return (
                <button
                  key={ut}
                  type="button"
                  onClick={() => handleSkinUndertoneChange(ut)}
                  className={`flex-1 py-1 rounded-lg text-[9px] font-bold capitalize transition-all border ${
                    isSelected
                      ? "bg-amber-500/20 text-amber-400 border-amber-400/80 shadow-sm"
                      : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white"
                  }`}
                >
                  {ut}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
