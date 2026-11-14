"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessMode, TargetColourInput } from "../../types/formulation";
import { Manufacturer } from "../../types/manufacturer";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { HairAssessmentInput } from "../../types/assessment";
import { useApp } from "../../context/AppContext";
import { LevelSelector } from "../../features/colour-selection/LevelSelector";
import { ToneSelector } from "../../features/colour-selection/ToneSelector";
import { ModeSelector } from "../../features/colour-selection/ModeSelector";
import { VisualLookbook } from "../../components/visual/VisualLookbook";
import { HairColourWheel } from "../../components/visual/HairColourWheel";
import { ColourAchievementSteps } from "../../components/visual/ColourAchievementSteps";
import { AnimatedCartoonAvatar } from "../../components/visual/AnimatedCartoonAvatar";
import { computeHairColorimetry } from "../../services/hairColorimetryService";
import { getManufacturers } from "../../services/formulationService";

type SelectionTab = "WHEEL" | "LOOKBOOK" | "SLIDERS";

export default function TargetColourPage() {
  const router = useRouter();
  const { mode: appMode } = useApp();

  const [activeTab, setActiveTab] = useState<SelectionTab>(() => {
    return appMode === "CHEMIST" ? "SLIDERS" : "WHEEL";
  });

  const [level, setLevel] = useState<UniversalLevel>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_target_colour");
        if (saved) {
          const parsed: TargetColourInput = JSON.parse(saved);
          if (parsed.universal_level) return parsed.universal_level;
        }
      } catch {
        // ignore
      }
    }
    return 7;
  });

  const [primaryTone, setPrimaryTone] = useState<ToneFamily>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_target_colour");
        if (saved) {
          const parsed: TargetColourInput = JSON.parse(saved);
          if (parsed.primary_tone) return parsed.primary_tone;
        }
      } catch {
        // ignore
      }
    }
    return "COPPER";
  });

  const [secondaryTone, setSecondaryTone] = useState<ToneFamily | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_target_colour");
        if (saved) {
          const parsed: TargetColourInput = JSON.parse(saved);
          if (parsed.secondary_tone !== undefined) return parsed.secondary_tone;
        }
      } catch {
        // ignore
      }
    }
    return "GOLD";
  });

  const [toneIntensity, setToneIntensity] = useState<ToneIntensity>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_target_colour");
        if (saved) {
          const parsed: TargetColourInput = JSON.parse(saved);
          if (parsed.tone_intensity) return parsed.tone_intensity;
        }
      } catch {
        // ignore
      }
    }
    return "STANDARD";
  });

  const [processMode, setProcessMode] = useState<ProcessMode>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedMode = localStorage.getItem("nh_process_mode");
        if (savedMode) return savedMode as ProcessMode;
      } catch {
        // ignore
      }
    }
    return "PREFERRED_MANUFACTURER";
  });

  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_manufacturer_id");
        if (saved && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(saved)) {
          return saved;
        }
      } catch {
        // ignore
      }
    }
    return "531e1113-7fe3-4c6e-a106-96d13f3b3e1d";
  });

  // Full hair assessment data
  const [assessmentData] = useState<HairAssessmentInput | null>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_hair_assessment");
        if (saved) {
          return JSON.parse(saved) as HairAssessmentInput;
        }
      } catch {
        // ignore
      }
    }
    return null;
  });

  const startingLevel = (assessmentData?.roots?.observed_level || 4) as UniversalLevel;

  useEffect(() => {
    async function loadMfgs() {
      try {
        const list = await getManufacturers();
        if (list.length > 0) {
          setManufacturers(list);
          setSelectedManufacturerId((prev) => {
            if (prev && list.some((m) => m.id === prev)) return prev;
            return list[0].id;
          });
        }
      } catch {
        const mock: Manufacturer[] = [
          {
            id: "531e1113-7fe3-4c6e-a106-96d13f3b3e1d",
            name: "Wella Professionals India",
            slug: "wella-india",
            supported_markets: ["IN"],
            status: "ACTIVE",
          },
          {
            id: "83d4171d-fa94-4b14-b646-293e3c4b3944",
            name: "L'Oréal Professionnel India",
            slug: "loreal-india",
            supported_markets: ["IN"],
            status: "ACTIVE",
          },
          {
            id: "3c207d16-832c-45be-ba1b-2f882c8a5d61",
            name: "Schwarzkopf Professional India",
            slug: "schwarzkopf-india",
            supported_markets: ["IN"],
            status: "ACTIVE",
          },
        ];
        setManufacturers(mock);
        setSelectedManufacturerId(mock[0].id);
      }
    }
    loadMfgs();
  }, []);

  const handleProceedToFormulation = () => {
        
    const target: TargetColourInput = {
      universal_level: level,
      primary_tone: primaryTone,
      secondary_tone: secondaryTone,
      tone_intensity: toneIntensity,
    };

    try {
      localStorage.setItem("nh_target_colour", JSON.stringify(target));
      localStorage.setItem("nh_process_mode", processMode);
      localStorage.setItem("nh_manufacturer_id", selectedManufacturerId);
    } catch {
      // ignore
    }

    router.push("/formulation");
  };

  const handleSelectFromLookbook = (
    lvl: UniversalLevel,
    primary: ToneFamily,
    secondary: ToneFamily | null
  ) => {
    setLevel(lvl);
    setPrimaryTone(primary);
    setSecondaryTone(secondary);
  };

  const handleSelectFromWheel = (
    lvl: UniversalLevel,
    primary: ToneFamily,
    secondary: ToneFamily | null,
    intensity: ToneIntensity
  ) => {
    setLevel(lvl);
    setPrimaryTone(primary);
    setSecondaryTone(secondary);
    setToneIntensity(intensity);
  };

  const targetColourObj: TargetColourInput = {
    universal_level: level,
    primary_tone: primaryTone,
    secondary_tone: secondaryTone,
    tone_intensity: toneIntensity,
  };

  const targetColorimetry = computeHairColorimetry(
    level,
    primaryTone,
    secondaryTone,
    toneIntensity
  );

  const TOP_TRENDING_LOOKS = [
    {
      id: "quick-choco",
      level: 5 as UniversalLevel,
      primaryTone: "NATURAL" as ToneFamily,
      secondaryTone: "GOLD" as ToneFamily,
      name: "Chocolate 5/7",
      color: "#4a2818",
    },
    {
      id: "quick-honey",
      level: 8 as UniversalLevel,
      primaryTone: "GOLD" as ToneFamily,
      secondaryTone: "NATURAL" as ToneFamily,
      name: "Honey Blonde 8/3",
      color: "#d4a46a",
    },
    {
      id: "quick-copper",
      level: 7 as UniversalLevel,
      primaryTone: "COPPER" as ToneFamily,
      secondaryTone: "GOLD" as ToneFamily,
      name: "Fiery Copper 7/43",
      color: "#aa4320",
    },
    {
      id: "quick-ash",
      level: 7 as UniversalLevel,
      primaryTone: "ASH" as ToneFamily,
      secondaryTone: "PEARL" as ToneFamily,
      name: "Smoky Ash 7/1",
      color: "#5e5e63",
    },
    {
      id: "quick-wine",
      level: 5 as UniversalLevel,
      primaryTone: "RED" as ToneFamily,
      secondaryTone: "VIOLET" as ToneFamily,
      name: "Deep Burgundy 5/46",
      color: "#691733",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-black text-rose-400 uppercase tracking-widest">
            Step 2 of 3 • Choose Target Look
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>🎨</span> Choose Desired Color
          </h1>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select via Colour Wheel or 40+ Salon Lookbook • Steps to achieve calculated automatically
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          
        </div>
      </div>

      {/* Visual Before & After Live Transformation Bar */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Starting Hair */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="h-12 w-12 rounded-2xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center font-black text-white text-base shadow-inner">
            <span>{startingLevel}</span>
            <span className="text-[9px] text-neutral-400 font-normal">START</span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Current Starting Hair
            </span>
            <span className="text-xs font-black text-white">
              Level {startingLevel} {assessmentData?.roots?.existing_artificial_colour ? "Coloured" : "Virgin"}
            </span>
            <span className="text-[10px] text-neutral-400 block">
              Grey: {assessmentData?.roots?.grey_percentage || 0}%
            </span>
          </div>
        </div>

        {/* Center: Shift Indicator */}
        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-950 border border-neutral-800 text-xs font-black text-amber-400">
          <span>{level - startingLevel > 0 ? `⚡ +${level - startingLevel} Levels Lift` : level - startingLevel < 0 ? `⬇️ ${level - startingLevel} Levels Darken` : `🔄 Same Level`}</span>
          <span className="text-neutral-500">➔</span>
        </div>

        {/* Right: Desired Target Hair */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
          <div className="text-right">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Target Hair Look
            </span>
            <span className="text-xs font-black text-amber-400">
              Level {level} {primaryTone}{secondaryTone ? ` / ${secondaryTone}` : ""}
            </span>
            <span className="text-[10px] text-neutral-300 block">
              {targetColourObj.tone_intensity} Intensity
            </span>
          </div>
          <div
            className="h-12 w-12 rounded-2xl flex flex-col items-center justify-center font-black text-base shadow-lg transition-all duration-500 border border-white/20"
            style={{
              background: targetColorimetry.gradient,
              color: level >= 8 ? "#171717" : "#ffffff",
            }}
          >
            <span>{level}</span>
            <span className="text-[9px] font-bold opacity-80">GOAL</span>
          </div>
        </div>
      </div>

      {/* 1-Tap Top 5 Salon Looks */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-2xl border border-neutral-800 bg-neutral-950/70 p-3.5">
        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
          <span>🔥</span> Top 5 Salon Picks:
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {TOP_TRENDING_LOOKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                                setLevel(item.level);
                setPrimaryTone(item.primaryTone);
                setSecondaryTone(item.secondaryTone);
                              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* View Selector Tabs (Colour Wheel vs Lookbook vs Chemist Sliders) */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => {
                        setActiveTab("WHEEL");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === "WHEEL"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🎡</span>
          <span>Colour Wheel</span>
        </button>

        <button
          type="button"
          onClick={() => {
                        setActiveTab("LOOKBOOK");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === "LOOKBOOK"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🎨</span>
          <span>40+ Shades Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => {
                        setActiveTab("SLIDERS");
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-black transition-all ${
            activeTab === "SLIDERS"
              ? "bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🔬</span>
          <span>Level & Tone Matrix</span>
        </button>
      </div>

      {/* Main Dual-View: Live Animated Cartoon Avatar (Left) + Interactive Selector (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Animated Cartoon Avatar (Always synchronized with level & tone changes) */}
        <div className="xl:col-span-4 flex flex-col items-center">
          <AnimatedCartoonAvatar
            level={level}
            primaryTone={primaryTone}
            secondaryTone={secondaryTone}
            intensity={toneIntensity}
            onLevelChange={(newLvl) => {
              setLevel(newLvl);
            }}
            className="w-full"
          />
        </div>

        {/* Right Column: Active Interactive Selector (Wheel / Catalog / Matrix) */}
        <div className="xl:col-span-8">
          {activeTab === "WHEEL" && (
            <HairColourWheel
              selectedLevel={level}
              selectedPrimaryTone={primaryTone}
              selectedSecondaryTone={secondaryTone}
              onSelect={handleSelectFromWheel}
            />
          )}

          {activeTab === "LOOKBOOK" && (
            <VisualLookbook
              selectedLevel={level}
              selectedPrimaryTone={primaryTone}
              onSelectLook={handleSelectFromLookbook}
              startingLevel={startingLevel}
            />
          )}

          {activeTab === "SLIDERS" && (
            <div className="space-y-6">
              <LevelSelector selectedLevel={level} onChange={setLevel} />
              <ToneSelector
                primaryTone={primaryTone}
                secondaryTone={secondaryTone}
                toneIntensity={toneIntensity}
                onPrimaryToneChange={setPrimaryTone}
                onSecondaryToneChange={setSecondaryTone}
                onToneIntensityChange={setToneIntensity}
              />
              <ModeSelector
                mode={processMode}
                selectedManufacturerId={selectedManufacturerId}
                manufacturers={manufacturers}
                onModeChange={setProcessMode}
                onManufacturerChange={setSelectedManufacturerId}
              />
            </div>
          )}
        </div>
      </div>

      {/* Brand & Mode Selector */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-2">
            <span>🏷️</span> Select Salon Brand:
          </label>
          
        </div>
        <div className="flex flex-wrap gap-2.5">
          {manufacturers.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                                setSelectedManufacturerId(m.id);
                              }}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all ${
                selectedManufacturerId === m.id
                  ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              {m.name}
            </button>
          ))}
        </div>
      </div>

      {/* Core Requirement: Steps on How to Achieve It */}
      <ColourAchievementSteps
        assessment={assessmentData}
        targetColour={targetColourObj}
        onProceedToFormulation={handleProceedToFormulation}
      />

      {/* Bottom Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-neutral-800">
        <button
          type="button"
          onClick={() => router.push("/starting-hair")}
          className="w-full sm:w-auto rounded-2xl border border-neutral-800 px-6 py-3.5 text-xs font-bold text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          ← Back to Hair Check
        </button>

        <button
          type="button"
          onClick={handleProceedToFormulation}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-4 text-base font-black text-neutral-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>MAKE MIXING RECIPE</span>
          <span className="text-xl">➔</span>
        </button>
      </div>
    </div>
  );
}
