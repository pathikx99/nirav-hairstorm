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
import { AvatarZone, RealisticAvatar } from "../../components/visual/RealisticAvatar";
import { HairStrandMacroStudio } from "../../components/visual/HairStrandMacroStudio";
import {
  computeHairColorimetry,
  applyMetamerism,
  getSalonShadeCode,
} from "../../services/hairColorimetryService";
import { getManufacturers } from "../../services/formulationService";
import { StickyBottomBar } from "../../components/StickyBottomBar";

type SelectionTab = "WHEEL" | "LOOKBOOK" | "SLIDERS" | "STEPS";
type ColourApplicationTarget = "ALL" | "ROOTS" | "MID_LENGTHS" | "ENDS";

export default function TargetColourPage() {
  const router = useRouter();
  const {
    mode: appMode,
    activeTechnique,
    setActiveTechnique,
    lightingMode,
    setLightingMode,
    skinTone,
    setSkinTone,
    viewAngle,
    setViewAngle,
  } = useApp();

  const [activeTab, setActiveTab] = useState<SelectionTab>(() => {
    return appMode === "CHEMIST" ? "SLIDERS" : "WHEEL";
  });

  const [previewTab, setPreviewTab] = useState<"AVATAR" | "STRAND">("AVATAR");

  const [colourTargetZone, setColourTargetZone] = useState<ColourApplicationTarget>("ALL");
  const [customRootsTone, setCustomRootsTone] = useState<ToneFamily | null>(null);
  const [customRootsLevel, setCustomRootsLevel] = useState<UniversalLevel | null>(null);
  const [customMidTone, setCustomMidTone] = useState<ToneFamily | null>(null);
  const [customMidLevel, setCustomMidLevel] = useState<UniversalLevel | null>(null);
  const [customEndsTone, setCustomEndsTone] = useState<ToneFamily | null>(null);
  const [customEndsLevel, setCustomEndsLevel] = useState<UniversalLevel | null>(null);

  const [level, setLevel] = useState<UniversalLevel>(7);
  const [primaryTone, setPrimaryTone] = useState<ToneFamily>("COPPER");
  const [secondaryTone, setSecondaryTone] = useState<ToneFamily | null>("GOLD");
  const [toneIntensity, setToneIntensity] = useState<ToneIntensity>("STANDARD");
  const [processMode, setProcessMode] = useState<ProcessMode>("PREFERRED_MANUFACTURER");
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>(
    "531e1113-7fe3-4c6e-a106-96d13f3b3e1d"
  );
  const [assessmentData, setAssessmentData] = useState<HairAssessmentInput | null>(null);

  // Load client-stored assessment and target preferences safely after hydration
  useEffect(() => {
    try {
      const savedAssessment = localStorage.getItem("nh_hair_assessment");
      if (savedAssessment) {
        setAssessmentData(JSON.parse(savedAssessment) as HairAssessmentInput);
      }
      const savedTarget = localStorage.getItem("nh_target_colour");
      if (savedTarget) {
        const parsed: TargetColourInput = JSON.parse(savedTarget);
        if (parsed.universal_level) setLevel(parsed.universal_level);
        if (parsed.primary_tone) setPrimaryTone(parsed.primary_tone);
        if (parsed.secondary_tone !== undefined) setSecondaryTone(parsed.secondary_tone);
        if (parsed.tone_intensity) setToneIntensity(parsed.tone_intensity);
      }
      const savedMode = localStorage.getItem("nh_process_mode");
      if (savedMode) setProcessMode(savedMode as ProcessMode);
      const savedMfg = localStorage.getItem("nh_manufacturer_id");
      if (savedMfg && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(savedMfg)) {
        setSelectedManufacturerId(savedMfg);
      }
      const savedRoots = localStorage.getItem("nh_custom_roots");
      if (savedRoots) {
        const parsed = JSON.parse(savedRoots);
        if (parsed.level) setCustomRootsLevel(parsed.level);
        if (parsed.tone) setCustomRootsTone(parsed.tone);
      }
      const savedMid = localStorage.getItem("nh_custom_mid");
      if (savedMid) {
        const parsed = JSON.parse(savedMid);
        if (parsed.level) setCustomMidLevel(parsed.level);
        if (parsed.tone) setCustomMidTone(parsed.tone);
      }
      const savedEnds = localStorage.getItem("nh_custom_ends");
      if (savedEnds) {
        const parsed = JSON.parse(savedEnds);
        if (parsed.level) setCustomEndsLevel(parsed.level);
        if (parsed.tone) setCustomEndsTone(parsed.tone);
      }
    } catch {
      // ignore
    }
  }, []);

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
      localStorage.setItem("nh_active_technique", activeTechnique);
      localStorage.setItem("nh_lighting_mode", lightingMode);
      if (customRootsLevel && customRootsTone) {
        localStorage.setItem("nh_custom_roots", JSON.stringify({ level: customRootsLevel, tone: customRootsTone }));
      } else {
        localStorage.removeItem("nh_custom_roots");
      }
      if (customMidLevel && customMidTone) {
        localStorage.setItem("nh_custom_mid", JSON.stringify({ level: customMidLevel, tone: customMidTone }));
      } else {
        localStorage.removeItem("nh_custom_mid");
      }
      if (customEndsLevel && customEndsTone) {
        localStorage.setItem("nh_custom_ends", JSON.stringify({ level: customEndsLevel, tone: customEndsTone }));
      } else {
        localStorage.removeItem("nh_custom_ends");
      }
    } catch {
      // ignore
    }

    router.push("/formulation");
  };

  const handleLevelChange = (newLvl: UniversalLevel) => {
    if (colourTargetZone === "ROOTS") {
      setCustomRootsLevel(newLvl);
      if (!customRootsTone) setCustomRootsTone(primaryTone);
    } else if (colourTargetZone === "MID_LENGTHS") {
      setCustomMidLevel(newLvl);
      if (!customMidTone) setCustomMidTone(primaryTone);
    } else if (colourTargetZone === "ENDS") {
      setCustomEndsLevel(newLvl);
      if (!customEndsTone) setCustomEndsTone(primaryTone);
    } else {
      setLevel(newLvl);
    }
  };

  const handleToneChange = (newTone: ToneFamily) => {
    if (colourTargetZone === "ROOTS") {
      setCustomRootsTone(newTone);
      if (!customRootsLevel) setCustomRootsLevel(level);
    } else if (colourTargetZone === "MID_LENGTHS") {
      setCustomMidTone(newTone);
      if (!customMidLevel) setCustomMidLevel(level);
    } else if (colourTargetZone === "ENDS") {
      setCustomEndsTone(newTone);
      if (!customEndsLevel) setCustomEndsLevel(level);
    } else {
      setPrimaryTone(newTone);
    }
  };

  const handleSelectFromLookbook = (
    lvl: UniversalLevel,
    primary: ToneFamily,
    secondary: ToneFamily | null
  ) => {
    if (colourTargetZone === "ROOTS") {
      setCustomRootsLevel(lvl);
      setCustomRootsTone(primary);
    } else if (colourTargetZone === "MID_LENGTHS") {
      setCustomMidLevel(lvl);
      setCustomMidTone(primary);
    } else if (colourTargetZone === "ENDS") {
      setCustomEndsLevel(lvl);
      setCustomEndsTone(primary);
    } else {
      setLevel(lvl);
      setPrimaryTone(primary);
      setSecondaryTone(secondary);
    }
  };

  const handleSelectFromWheel = (
    lvl: UniversalLevel,
    primary: ToneFamily,
    secondary: ToneFamily | null,
    intensity: ToneIntensity
  ) => {
    if (colourTargetZone === "ROOTS") {
      setCustomRootsLevel(lvl);
      setCustomRootsTone(primary);
    } else if (colourTargetZone === "MID_LENGTHS") {
      setCustomMidLevel(lvl);
      setCustomMidTone(primary);
    } else if (colourTargetZone === "ENDS") {
      setCustomEndsLevel(lvl);
      setCustomEndsTone(primary);
    } else {
      setLevel(lvl);
      setPrimaryTone(primary);
      setSecondaryTone(secondary);
      setToneIntensity(intensity);
    }
  };

  // Active level and tone for whichever zone is currently selected for editing
  const activeZoneLevel: UniversalLevel =
    colourTargetZone === "ROOTS"
      ? (customRootsLevel ?? level)
      : colourTargetZone === "MID_LENGTHS"
      ? (customMidLevel ?? level)
      : colourTargetZone === "ENDS"
      ? (customEndsLevel ?? level)
      : level;

  const activeZonePrimaryTone: ToneFamily =
    colourTargetZone === "ROOTS"
      ? (customRootsTone ?? primaryTone)
      : colourTargetZone === "MID_LENGTHS"
      ? (customMidTone ?? primaryTone)
      : colourTargetZone === "ENDS"
      ? (customEndsTone ?? primaryTone)
      : primaryTone;

  const activeZoneSecondaryTone: ToneFamily | null =
    colourTargetZone === "ALL" ? secondaryTone : null;

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

  const targetShade = getSalonShadeCode(level, primaryTone, secondaryTone);

  // Metamerism-shifted colors for Daylight, Warm Salon, and Cool Indoor previews
  const metaDaylightBase = applyMetamerism(targetColorimetry.baseHex, "DAYLIGHT");
  const metaWarmBase = applyMetamerism(targetColorimetry.baseHex, "WARM");
  const metaCoolBase = applyMetamerism(targetColorimetry.baseHex, "COOL");

  const metaDaylightHighlight = applyMetamerism(targetColorimetry.highlightHex, "DAYLIGHT");
  const metaWarmHighlight = applyMetamerism(targetColorimetry.highlightHex, "WARM");
  const metaCoolHighlight = applyMetamerism(targetColorimetry.highlightHex, "COOL");

  const metaDaylightShadow = applyMetamerism(targetColorimetry.shadowHex, "DAYLIGHT");
  const metaWarmShadow = applyMetamerism(targetColorimetry.shadowHex, "WARM");
  const metaCoolShadow = applyMetamerism(targetColorimetry.shadowHex, "COOL");

  const targetGradientAdapted =
    lightingMode === "WARM"
      ? `linear-gradient(135deg, ${metaWarmShadow} 0%, ${metaWarmBase} 45%, ${metaWarmHighlight} 70%, ${metaWarmShadow} 100%)`
      : lightingMode === "COOL"
      ? `linear-gradient(135deg, ${metaCoolShadow} 0%, ${metaCoolBase} 45%, ${metaCoolHighlight} 70%, ${metaCoolShadow} 100%)`
      : `linear-gradient(135deg, ${metaDaylightShadow} 0%, ${metaDaylightBase} 45%, ${metaDaylightHighlight} 70%, ${metaDaylightShadow} 100%)`;

  let customRootsColor: string | undefined = undefined;
  let customMidColor: string | undefined = undefined;
  let customEndsColor: string | undefined = undefined;
  if (customRootsLevel || customRootsTone) {
    customRootsColor = computeHairColorimetry(
      customRootsLevel ?? level,
      customRootsTone ?? primaryTone
    ).baseHex;
  }
  if (customMidLevel || customMidTone) {
    customMidColor = computeHairColorimetry(
      customMidLevel ?? level,
      customMidTone ?? (secondaryTone || primaryTone)
    ).baseHex;
  }
  if (customEndsLevel || customEndsTone) {
    customEndsColor = computeHairColorimetry(
      customEndsLevel ?? level,
      customEndsTone ?? (secondaryTone || primaryTone)
    ).baseHex;
  }

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
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-5 pb-28 sm:pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3">
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
      </div>

      {/* Streamlined Live Control Hub: Compact Before & After, Lighting, Technique, and Quick Looks */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4 shadow-xl space-y-3" suppressHydrationWarning>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3" suppressHydrationWarning>
          {/* Left: Live Before & After Transformation Badge */}
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="flex items-center gap-2" suppressHydrationWarning>
              <div className="h-10 w-10 rounded-xl bg-neutral-800 border border-neutral-700 flex flex-col items-center justify-center font-black text-white text-xs shadow-inner" suppressHydrationWarning>
                <span suppressHydrationWarning>{startingLevel}</span>
                <span className="text-[8px] text-neutral-400 font-normal">START</span>
              </div>
              <div suppressHydrationWarning>
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Starting
                </span>
                <span className="text-xs font-black text-white" suppressHydrationWarning>
                  L{startingLevel} {assessmentData?.roots?.existing_artificial_colour ? "Coloured" : "Virgin"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-[11px] font-black text-amber-400" suppressHydrationWarning>
              <span suppressHydrationWarning>{level - startingLevel > 0 ? `+${level - startingLevel} Lift` : level - startingLevel < 0 ? `${level - startingLevel} Dark` : `Same Level`}</span>
              <span className="text-neutral-500">➔</span>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="relative h-10 w-10 rounded-xl flex flex-col items-center justify-center font-black text-xs shadow-lg border border-white/25 overflow-hidden shrink-0"
                style={{
                  background: targetGradientAdapted,
                  color: level >= 8 ? "#171717" : "#ffffff",
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/35 to-transparent pointer-events-none" />
                <span className="relative z-10 leading-none">{level}</span>
                <span className="relative z-10 text-[7px] tracking-wider uppercase font-black">{targetShade.code}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider block">
                  Target Look
                </span>
                <span className="text-xs font-black text-white block truncate max-w-[150px] sm:max-w-[200px]">
                  {targetShade.name}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Lighting, Technique & Zone Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Lighting Metamerism Quick Toggle */}
            <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
              {[
                { id: "DAYLIGHT", icon: "☀️", label: "Sun" },
                { id: "WARM", icon: "💡", label: "Salon" },
                { id: "COOL", icon: "🏢", label: "Office" },
              ].map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLightingMode(l.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                    lightingMode === l.id
                      ? "bg-amber-500 text-neutral-950 shadow-xs font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                  title={`${l.label} lighting`}
                >
                  <span>{l.icon}</span>
                  <span className="hidden sm:inline">{l.label}</span>
                </button>
              ))}
            </div>

            {/* Technique Selector */}
            <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
              {[
                { id: "ALL_OVER", label: "All-Over" },
                { id: "SHADOW_ROOT", label: "Shadow Root" },
                { id: "COLOR_MELT", label: "Melt" },
                { id: "GLOSS_TONING", label: "Gloss" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveTechnique(t.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTechnique === t.id
                      ? "bg-rose-500 text-white shadow-xs font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Zone Target Toggle */}
            <div className="flex items-center rounded-xl border border-neutral-800 bg-neutral-950 p-1">
              {[
                { id: "ALL", label: "Global" },
                { id: "ROOTS", label: "Roots" },
                { id: "MID_LENGTHS", label: "Mid" },
                { id: "ENDS", label: "Ends" },
              ].map((z) => (
                <button
                  key={z.id}
                  type="button"
                  onClick={() => setColourTargetZone(z.id as any)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    colourTargetZone === z.id
                      ? "bg-indigo-500 text-white font-black"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {z.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 1-Tap Top 5 Salon Picks Strip */}
        <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <span>🔥</span> Top Picks:
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {TOP_TRENDING_LOOKS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (colourTargetZone === "ROOTS") {
                    setCustomRootsLevel(item.level);
                    setCustomRootsTone(item.primaryTone);
                  } else if (colourTargetZone === "MID_LENGTHS") {
                    setCustomMidLevel(item.level);
                    setCustomMidTone(item.primaryTone);
                  } else if (colourTargetZone === "ENDS") {
                    setCustomEndsLevel(item.level);
                    setCustomEndsTone(item.primaryTone);
                  } else {
                    setLevel(item.level);
                    setPrimaryTone(item.primaryTone);
                    setSecondaryTone(item.secondaryTone);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-black bg-neutral-950 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 hover:border-neutral-700 transition-all active:scale-95 cursor-pointer"
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* View Selector Tabs (Colour Wheel vs Lookbook vs Chemist Sliders vs Roadmap Steps) */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2.5 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("WHEEL")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "WHEEL"
              ? "bg-amber-500 text-neutral-950 shadow-md scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🎡</span>
          <span>Colour Wheel</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("LOOKBOOK")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "LOOKBOOK"
              ? "bg-amber-500 text-neutral-950 shadow-md scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🎨</span>
          <span>40+ Shades Catalog</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("SLIDERS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "SLIDERS"
              ? "bg-amber-500 text-neutral-950 shadow-md scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>🔬</span>
          <span>Level & Tone Matrix</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("STEPS")}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all cursor-pointer ${
            activeTab === "STEPS"
              ? "bg-amber-500 text-neutral-950 shadow-md scale-[1.02]"
              : "bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800"
          }`}
        >
          <span>📋</span>
          <span>Chemical Roadmap & Steps</span>
        </button>
      </div>

      {/* Main Dual-View: Sticky Avatar (Left) + Interactive Selector / Steps (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sticky Avatar & Strand Studio (5 cols) */}
        <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-16">
          {/* Switcher between 3D Avatar and Hair Strand Zoom */}
          <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/80 p-1.5 shadow-sm">
            <button
              type="button"
              onClick={() => setPreviewTab("AVATAR")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === "AVATAR"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>👤</span>
              <span>3D Avatar View</span>
            </button>
            <button
              type="button"
              onClick={() => setPreviewTab("STRAND")}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                previewTab === "STRAND"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              <span>🔬</span>
              <span>Strand Texture</span>
            </button>
          </div>

          {previewTab === "AVATAR" ? (
            <RealisticAvatar
              level={level}
              primaryTone={primaryTone}
              secondaryTone={secondaryTone}
              intensity={toneIntensity}
              technique={activeTechnique}
              lightingMode={lightingMode}
              onLightingModeChange={setLightingMode}
              skinTone={skinTone}
              onSkinToneChange={setSkinTone}
              viewAngle={viewAngle}
              onViewAngleChange={setViewAngle}
              rootsInput={assessmentData?.roots}
              midLengthsInput={assessmentData?.mid_lengths}
              endsInput={assessmentData?.ends}
              activeRegion={colourTargetZone === "ALL" ? undefined : (colourTargetZone as AvatarZone)}
              onSelectRegion={(region) => setColourTargetZone(region)}
              customRootsLevel={customRootsLevel}
              customRootsTone={customRootsTone}
              customMidLevel={customMidLevel}
              customMidTone={customMidTone}
              customEndsLevel={customEndsLevel}
              customEndsTone={customEndsTone}
              customRootsColor={customRootsColor}
              customMidColor={customMidColor}
              customEndsColor={customEndsColor}
              onLevelChange={handleLevelChange}
              className="w-full"
            />
          ) : (
            <HairStrandMacroStudio
              level={level}
              primaryTone={primaryTone}
              secondaryTone={secondaryTone}
              intensity={toneIntensity}
              technique={activeTechnique}
              lightingMode={lightingMode}
              onLightingModeChange={setLightingMode}
              showLightingComparison={true}
              className="w-full"
            />
          )}

          {/* Compact Salon Brand Selector directly underneath preview */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900/70 p-3 flex items-center justify-between gap-2 shadow-sm">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <span>🏷️</span> Brand:
            </span>
            <div className="flex flex-wrap gap-1.5 justify-end">
              {manufacturers.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedManufacturerId(m.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                    selectedManufacturerId === m.id
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400"
                      : "bg-neutral-800 text-neutral-400 hover:text-white"
                  }`}
                >
                  {m.name.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Active Interactive Selector (7 cols) */}
        <div className="lg:col-span-7">
          {activeTab === "WHEEL" && (
            <div className="space-y-4">
              {colourTargetZone !== "ALL" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🎯</span> Setting Hue for:{" "}
                    <span className="text-amber-400 font-black">
                      {colourTargetZone === "ROOTS"
                        ? "Roots (Zone 1)"
                        : colourTargetZone === "MID_LENGTHS"
                        ? "Mid-Lengths (Zone 2)"
                        : "Ends (Zone 3)"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setColourTargetZone("ALL")}
                    className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Switch to All-Over
                  </button>
                </div>
              )}
              <HairColourWheel
                selectedLevel={activeZoneLevel}
                selectedPrimaryTone={activeZonePrimaryTone}
                selectedSecondaryTone={activeZoneSecondaryTone}
                onSelect={handleSelectFromWheel}
              />
            </div>
          )}

          {activeTab === "LOOKBOOK" && (
            <div className="space-y-4">
              {colourTargetZone !== "ALL" && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>🎯</span> Applying Preset Look To:{" "}
                    <span className="text-amber-400 font-black">
                      {colourTargetZone === "ROOTS"
                        ? "Roots (Zone 1)"
                        : colourTargetZone === "MID_LENGTHS"
                        ? "Mid-Lengths (Zone 2)"
                        : "Ends (Zone 3)"}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setColourTargetZone("ALL")}
                    className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Switch to All-Over
                  </button>
                </div>
              )}
              <VisualLookbook
                selectedLevel={activeZoneLevel}
                selectedPrimaryTone={activeZonePrimaryTone}
                onSelectLook={handleSelectFromLookbook}
                startingLevel={startingLevel}
              />
            </div>
          )}

          {activeTab === "SLIDERS" && (
            <div className="space-y-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>🎯</span> Editing Sliders For:{" "}
                  <span className="text-amber-400 font-black">
                    {colourTargetZone === "ALL"
                      ? "All Hair (Global)"
                      : colourTargetZone === "ROOTS"
                      ? "Roots (Zone 1)"
                      : colourTargetZone === "MID_LENGTHS"
                      ? "Mid-Lengths (Zone 2)"
                      : "Ends (Zone 3)"}
                  </span>
                </span>
                {colourTargetZone !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setColourTargetZone("ALL")}
                    className="text-[10px] font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    Switch to All-Over
                  </button>
                )}
              </div>
              <LevelSelector selectedLevel={activeZoneLevel} onChange={handleLevelChange} />
              <ToneSelector
                primaryTone={activeZonePrimaryTone}
                secondaryTone={activeZoneSecondaryTone}
                toneIntensity={toneIntensity}
                onPrimaryToneChange={handleToneChange}
                onSecondaryToneChange={(sec) => {
                  if (colourTargetZone === "ALL") setSecondaryTone(sec);
                }}
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

          {activeTab === "STEPS" && (
            <div className="space-y-4">
              <ColourAchievementSteps
                assessment={assessmentData}
                targetColour={targetColourObj}
                onProceedToFormulation={handleProceedToFormulation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Inline Bottom Action Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-neutral-800">
        <button
          type="button"
          onClick={() => router.push("/starting-hair")}
          className="w-full sm:w-auto rounded-2xl border border-neutral-800 px-6 py-3 text-xs font-bold text-neutral-300 hover:bg-neutral-900 transition-colors cursor-pointer"
        >
          ← Back to Hair Check
        </button>

        <button
          type="button"
          onClick={handleProceedToFormulation}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <span>MAKE MIXING RECIPE</span>
          <span className="text-lg">➔</span>
        </button>
      </div>

      {/* Sticky Bottom Action Dock: Always visible on screen, zero scrolling required! */}
      <StickyBottomBar
        summary={
          <>
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold mr-1">
              Target Look:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-amber-300 whitespace-nowrap">
              {targetShade.code} {targetShade.name}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-300 whitespace-nowrap">
              Level {level} {primaryTone}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-400 whitespace-nowrap hidden sm:inline">
              {manufacturers.find((m) => m.id === selectedManufacturerId)?.name.split(" ")[0] || "Wella"}
            </span>
          </>
        }
        backAction={{
          label: "Hair Check",
          href: "/starting-hair",
          icon: "←",
        }}
        nextAction={{
          label: "MAKE MIXING RECIPE",
          onClick: handleProceedToFormulation,
          icon: "➔",
        }}
      />
    </div>
  );
}
