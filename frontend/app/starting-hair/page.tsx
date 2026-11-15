"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClientHistoryInput,
  HairAssessmentInput,
  HairRegionInput,
} from "../../types/assessment";
import { UniversalLevel } from "../../types/uhcr";
import { useApp } from "../../context/AppContext";
import { RegionAssessmentCard } from "../../features/assessment/RegionAssessmentCard";
import { HistoryChecklist } from "../../features/assessment/HistoryChecklist";
import { PhotoAnalysisModal } from "../../features/assessment/PhotoAnalysisModal";
import { InteractiveHeadAvatar } from "../../components/visual/InteractiveHeadAvatar";
import { HairStrandMacroStudio } from "../../components/visual/HairStrandMacroStudio";
import { RealisticHairSwatch } from "../../components/visual/RealisticHairSwatch";
import { VisualGreySelector } from "../../components/visual/VisualGreySelector";
import { VisualSafetyChecklist } from "../../components/visual/VisualSafetyChecklist";
import { VisualCameraScanModal } from "../../components/visual/VisualCameraScanModal";
import { StickyBottomBar } from "../../components/StickyBottomBar";

export default function StartingHairPage() {
  const router = useRouter();
  const { mode, consultationMode, setConsultationMode, lightingMode, setLightingMode } = useApp();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<"ROOTS" | "MID_LENGTHS" | "ENDS">("ROOTS");
  const [previewTab, setPreviewTab] = useState<"AVATAR" | "STRAND">("AVATAR");
  const [safetyExpanded, setSafetyExpanded] = useState(false);

  const [roots, setRoots] = useState<HairRegionInput>({
    region: "ROOTS",
    observed_level: 5,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    grey_percentage: 0,
    porosity: "NORMAL",
    condition: "HEALTHY",
    is_on_scalp: true,
    colourist_confirmed: true,
  });

  const [midLengths, setMidLengths] = useState<HairRegionInput>({
    region: "MID_LENGTHS",
    observed_level: 5,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    grey_percentage: 0,
    porosity: "NORMAL",
    condition: "HEALTHY",
    is_on_scalp: false,
    colourist_confirmed: true,
  });

  const [ends, setEnds] = useState<HairRegionInput>({
    region: "ENDS",
    observed_level: 5,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    grey_percentage: 0,
    porosity: "NORMAL",
    condition: "HEALTHY",
    is_on_scalp: false,
    colourist_confirmed: true,
  });

  const [history, setHistory] = useState<ClientHistoryInput>({
    has_allergy_history: false,
    allergy_details: null,
    patch_test_completed_48h: true,
    scalp_condition: "normal",
    previous_chemical_services: [],
    has_metallic_salts_or_henna: false,
    has_sodium_hydroxide_relaxer: false,
  });

  // Safely load saved assessment data from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("nh_hair_assessment");
      if (saved) {
        const parsed: HairAssessmentInput = JSON.parse(saved);
        if (parsed.roots) setRoots(parsed.roots);
        if (parsed.mid_lengths) setMidLengths(parsed.mid_lengths);
        if (parsed.ends) setEnds(parsed.ends);
        if (parsed.history) setHistory(parsed.history);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveAndProceed = () => {
            const assessment: HairAssessmentInput = {
      market: "IN",
      roots,
      mid_lengths: midLengths,
      ends,
      history,
      colourist_confirmation_status: true,
    };
    try {
      localStorage.setItem("nh_hair_assessment", JSON.stringify(assessment));
    } catch {
      // ignore
    }
    router.push("/target-colour");
  };

  const handleApplyPhotoPredictions = (
    pRoots: Partial<HairRegionInput>,
    pMid: Partial<HairRegionInput>,
    pEnds: Partial<HairRegionInput>
  ) => {
    setRoots((prev) => ({ ...prev, ...pRoots }));
    setMidLengths((prev) => ({ ...prev, ...pMid }));
    setEnds((prev) => ({ ...prev, ...pEnds }));
  };

  const [syncAllZones, setSyncAllZones] = useState(false);

  const currentRegion =
    activeZone === "ROOTS"
      ? roots
      : activeZone === "MID_LENGTHS"
      ? midLengths
      : ends;

  const setCurrentRegion = (updated: HairRegionInput) => {
    if (syncAllZones) {
      setRoots((prev) => ({ ...prev, ...updated, region: "ROOTS", is_on_scalp: true }));
      setMidLengths((prev) => ({ ...prev, ...updated, region: "MID_LENGTHS", is_on_scalp: false }));
      setEnds((prev) => ({ ...prev, ...updated, region: "ENDS", is_on_scalp: false }));
    } else {
      if (activeZone === "ROOTS") {
        setRoots((prev) => ({ ...prev, ...updated, region: "ROOTS", is_on_scalp: true }));
      } else if (activeZone === "MID_LENGTHS") {
        setMidLengths((prev) => ({ ...prev, ...updated, region: "MID_LENGTHS", is_on_scalp: false }));
      } else {
        setEnds((prev) => ({ ...prev, ...updated, region: "ENDS", is_on_scalp: false }));
      }
    }
  };

  const handleApplyToAllZones = () => {
            setRoots((prev) => ({
      ...prev,
      observed_level: currentRegion.observed_level,
      observed_undertone: currentRegion.observed_undertone,
      grey_percentage: currentRegion.grey_percentage,
      existing_artificial_colour: currentRegion.existing_artificial_colour,
    }));
    setMidLengths((prev) => ({
      ...prev,
      observed_level: currentRegion.observed_level,
      observed_undertone: currentRegion.observed_undertone,
      grey_percentage: currentRegion.grey_percentage,
      existing_artificial_colour: currentRegion.existing_artificial_colour,
    }));
    setEnds((prev) => ({
      ...prev,
      observed_level: currentRegion.observed_level,
      observed_undertone: currentRegion.observed_undertone,
      grey_percentage: currentRegion.grey_percentage,
      existing_artificial_colour: currentRegion.existing_artificial_colour,
    }));
  };

  const handleQuickPreset = (preset: "VIRGIN_BLACK" | "VIRGIN_BROWN" | "GREY_ROOTS" | "COLOURED_ENDS" | "HENNA") => {
        if (preset === "VIRGIN_BLACK") {
            const r: HairRegionInput = { region: "ROOTS", observed_level: 3, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true };
      setRoots(r);
      setMidLengths({ ...r, region: "MID_LENGTHS", is_on_scalp: false });
      setEnds({ ...r, region: "ENDS", is_on_scalp: false });
      setSyncAllZones(false);
    } else if (preset === "VIRGIN_BROWN") {
            const r: HairRegionInput = { region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true };
      setRoots(r);
      setMidLengths({ ...r, region: "MID_LENGTHS", is_on_scalp: false });
      setEnds({ ...r, region: "ENDS", is_on_scalp: false });
      setSyncAllZones(false);
    } else if (preset === "GREY_ROOTS") {
            setRoots({ region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 50, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true });
      setMidLengths({ region: "MID_LENGTHS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 15, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true });
      setEnds({ region: "ENDS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true });
      setSyncAllZones(false);
    } else if (preset === "COLOURED_ENDS") {
            setRoots({ region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true });
      setMidLengths({ region: "MID_LENGTHS", observed_level: 6, observed_undertone: "COPPER", existing_artificial_colour: true, grey_percentage: 0, porosity: "HIGH", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true });
      setEnds({ region: "ENDS", observed_level: 6, observed_undertone: "COPPER", existing_artificial_colour: true, grey_percentage: 0, porosity: "HIGH", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true });
      setSyncAllZones(false);
    } else if (preset === "HENNA") {
            setHistory((prev) => ({ ...prev, has_metallic_salts_or_henna: true }));
    }
  };

  const levels: UniversalLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  // Visual Stylist View (Default)
  if (mode === "STYLIST") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 pb-28 sm:pb-24">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <span className="text-xs font-black text-amber-400 uppercase tracking-widest">
              Step 1 of 3 • Hair Assessment
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              <span>👤</span> Customer Hair Check
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Touch hair zone on avatar to adjust level • Use camera auto-scan if desired
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            
            <button
              type="button"
              onClick={() => setPhotoModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <span>📸</span> AUTO-SCAN WITH CAMERA
            </button>
          </div>
        </div>

        {/* Mode Selector Pill: Express vs Pro Lab */}
        <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/60 p-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-400">Consultation Flow:</span>
            <span className="text-xs font-black text-amber-400">
              {consultationMode === "EXPRESS" ? "⚡ Express 10s Mode" : "🔬 Pro Lab Multi-Zone Mode"}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setConsultationMode("EXPRESS")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                consultationMode === "EXPRESS"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              ⚡ Express
            </button>
            <button
              type="button"
              onClick={() => setConsultationMode("PRO")}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                consultationMode === "PRO"
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "bg-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              🔬 Pro Lab
            </button>
          </div>
        </div>

        {/* Express Consultation Quick Card */}
        {consultationMode === "EXPRESS" && (
          <div className="rounded-3xl border border-amber-500/40 bg-linear-to-b from-neutral-900 via-neutral-900/90 to-neutral-950 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">
                  ⚡ 10-Second Express Salon Check
                </span>
                <h2 className="text-xl font-black text-white">
                  Client Natural Starting Level & Grey Cover
                </h2>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 w-fit">
                Fast Uniform Setup
              </span>
            </div>

            {/* Quick Level Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white uppercase tracking-wider">
                  1. Current Starting Depth Level:
                </label>
                <span className="text-xs font-mono font-bold text-amber-400">
                  Level {roots.observed_level} Selected
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-10 gap-2">
                {levels.map((lvl) => (
                  <RealisticHairSwatch
                    key={lvl}
                    level={lvl}
                    selected={roots.observed_level === lvl}
                    onClick={(l) => {
                      setRoots((prev) => ({ ...prev, observed_level: l }));
                      setMidLengths((prev) => ({ ...prev, observed_level: l }));
                      setEnds((prev) => ({ ...prev, observed_level: l }));
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Quick Grey Percentage Pills */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                2. Grey Hair Percentage:
              </label>
              <div className="flex flex-wrap gap-2">
                {[0, 25, 50, 75, 100].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setRoots((prev) => ({ ...prev, grey_percentage: pct }));
                      setMidLengths((prev) => ({ ...prev, grey_percentage: Math.min(pct, 25) }));
                      setEnds((prev) => ({ ...prev, grey_percentage: 0 }));
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                      roots.grey_percentage === pct
                        ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-[1.02]"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    {pct === 0 ? "0% (No Grey)" : `${pct}% Grey`}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Prior Colour Check */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-white uppercase tracking-wider block">
                3. Previous Artificial Colour:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoots((prev) => ({ ...prev, existing_artificial_colour: false }));
                    setMidLengths((prev) => ({ ...prev, existing_artificial_colour: false }));
                    setEnds((prev) => ({ ...prev, existing_artificial_colour: false }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    !roots.existing_artificial_colour
                      ? "bg-emerald-500 text-neutral-950 shadow-md ring-2 ring-emerald-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  🌿 Virgin Natural Hair
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRoots((prev) => ({ ...prev, existing_artificial_colour: false }));
                    setMidLengths((prev) => ({ ...prev, existing_artificial_colour: true }));
                    setEnds((prev) => ({ ...prev, existing_artificial_colour: true }));
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    midLengths.existing_artificial_colour
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  🎨 Previously Coloured Lengths
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setHistory((prev) => ({
                      ...prev,
                      has_metallic_salts_or_henna: !prev.has_metallic_salts_or_henna,
                    }))
                  }
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                    history.has_metallic_salts_or_henna
                      ? "bg-rose-600 text-white shadow-md ring-2 ring-rose-400"
                      : "bg-neutral-800 text-rose-300 border border-rose-900/50 hover:bg-neutral-700"
                  }`}
                >
                  {history.has_metallic_salts_or_henna ? "⚠️ Henna / Mehendi Detected" : "🌿 Henna / Mehendi Used?"}
                </button>
              </div>
            </div>

            {/* Instant Express Proceed Button */}
            <div className="pt-4 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-neutral-400">
                Want multi-zone head mapping? Switch to <strong>Pro Lab Mode</strong> above.
              </span>
              <button
                type="button"
                onClick={handleSaveAndProceed}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
              >
                <span>⚡ PROCEED TO TARGET LOOK</span>
                <span className="text-lg">➔</span>
              </button>
            </div>
          </div>
        )}

        {/* Safety Warning Banner if Allergy Checked */}
        {history.has_allergy_history && (
          <div className="rounded-2xl border-2 border-rose-500 bg-rose-500/15 p-4 text-xs text-rose-200 flex items-center gap-3">
            <span className="text-2xl">🛑</span>
            <div>
              <strong className="block font-black text-sm text-rose-100">
                Allergy Safety Warning:
              </strong>
              Client has a history of chemical allergy. Do not apply chemical hair color.
            </div>
          </div>
        )}

        {/* Pro Lab Multi-Zone Head Mapping Section */}
        {consultationMode === "PRO" && (
          <>
            {/* Quick Hair Profile Presets (1-Tap Salon Presets) */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-4 sm:p-5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <span>⚡</span> 1-Tap Quick Hair Profiles:
            </span>
            <span className="text-[11px] text-neutral-400">
              Select in 1 tap without manual zone setup
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickPreset("VIRGIN_BLACK")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all hover:scale-[1.02]"
            >
              <span>🖤</span>
              <span>Virgin Indian Black (L3)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("VIRGIN_BROWN")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all hover:scale-[1.02]"
            >
              <span>🟤</span>
              <span>Medium Brown Virgin (L4)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("GREY_ROOTS")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all hover:scale-[1.02]"
            >
              <span>👵</span>
              <span>50% Grey at Roots</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("COLOURED_ENDS")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 transition-all hover:scale-[1.02]"
            >
              <span>🎨</span>
              <span>Dyed Ends (L6 Copper)</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickPreset("HENNA")}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-black bg-rose-950/50 hover:bg-rose-900/50 text-rose-300 border border-rose-800/60 transition-all hover:scale-[1.02]"
            >
              <span>🌿</span>
              <span>Henna / Mehendi Alert</span>
            </button>
          </div>
        </div>

        {/* Dual-Column Interactive Avatar + Zone Swatch Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Interactive Head Avatar (5 cols) + Hair Strand Macro Studio */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
            {/* View switcher between Avatar Head Map and Macro Strand */}
            <div className="flex items-center justify-between rounded-2xl border border-neutral-800 bg-neutral-900/80 p-1.5 shadow-sm">
              <button
                type="button"
                onClick={() => setPreviewTab("AVATAR")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                  previewTab === "AVATAR"
                    ? "bg-amber-500 text-neutral-950 shadow-md"
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                <span>👤</span>
                <span>Head Map ({activeZone === "ROOTS" ? "Roots" : activeZone === "MID_LENGTHS" ? "Mid" : "Ends"})</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("STRAND")}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
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
              <InteractiveHeadAvatar
                activeRegion={activeZone}
                onSelectRegion={(zone) => {
                  setActiveZone(zone);
                  setSyncAllZones(false);
                }}
                roots={roots}
                midLengths={midLengths}
                ends={ends}
              />
            ) : (
              <HairStrandMacroStudio
                level={currentRegion.observed_level || 5}
                primaryTone={(currentRegion.observed_undertone as any) || "NATURAL"}
                greyPercentage={currentRegion.grey_percentage || 0}
                lightingMode={lightingMode}
                onLightingModeChange={setLightingMode}
                showLightingComparison={true}
                className="w-full"
              />
            )}
          </div>

          {/* Column 2: Swatch & Detail Picker for Active Zone (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                    Editing Selected Zone
                  </span>
                  {!syncAllZones ? (
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                      Independent Zone (This Zone Only)
                    </span>
                  ) : (
                    <span className="text-[10px] font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30">
                      Uniform Linked (All Zones)
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-black text-white">
                  {activeZone === "ROOTS" && "1. Roots / Scalp Regrowth"}
                  {activeZone === "MID_LENGTHS" && "2. Mid-Lengths"}
                  {activeZone === "ENDS" && "3. Hair Ends / Tips"}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyToAllZones}
                  className="px-3 py-1.5 rounded-xl text-xs font-black bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 flex items-center gap-1.5 active:scale-95 transition-all"
                  title="Apply current level across all 3 zones"
                >
                  <span>🔄</span>
                  <span>Apply to All 3 Zones</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                                        setSyncAllZones(!syncAllZones);
                                      }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all ${
                    syncAllZones
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-1 ring-amber-400"
                      : "bg-neutral-900 text-neutral-400 hover:text-neutral-200 border border-neutral-800"
                  }`}
                  title="Toggle permanent uniform link across zones"
                >
                  <span>{syncAllZones ? "🔗" : "✂️"}</span>
                  <span>{syncAllZones ? "Uniform Linked" : "Separate Zones"}</span>
                </button>

                
              </div>
            </div>

            {/* Realistic Hair Swatches (Levels 1 to 10) */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-neutral-300 block">
                Hair Depth Level (Select Depth Level 1–10):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {levels.map((lvl) => (
                  <RealisticHairSwatch
                    key={lvl}
                    level={lvl}
                    selected={currentRegion.observed_level === lvl}
                    onClick={(l) =>
                      setCurrentRegion({ ...currentRegion, observed_level: l })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Grey Percentage Visual Selector */}
            <VisualGreySelector
              value={currentRegion.grey_percentage || 0}
              onChange={(pct) =>
                setCurrentRegion({ ...currentRegion, grey_percentage: pct })
              }
            />

            {/* Artificial Dye Check */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-white block">
                  Has this zone been coloured before?
                </span>
                <span className="text-xs text-neutral-400 block mt-0.5">
                  Is there existing artificial hair colour on this zone?
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                                        setCurrentRegion({
                      ...currentRegion,
                      existing_artificial_colour: true,
                    });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    currentRegion.existing_artificial_colour
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  YES (Coloured)
                </button>
                <button
                  type="button"
                  onClick={() => {
                                        setCurrentRegion({
                      ...currentRegion,
                      existing_artificial_colour: false,
                    });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    !currentRegion.existing_artificial_colour
                      ? "bg-neutral-700 text-white shadow-md ring-1 ring-neutral-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  NO (Virgin Hair)
                </button>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

        {/* Collapsible Customer Safety & Chemical History Accordion */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 overflow-hidden shadow-lg transition-all">
          <button
            type="button"
            onClick={() => setSafetyExpanded(!safetyExpanded)}
            className="w-full p-4 sm:p-5 flex items-center justify-between gap-4 text-left hover:bg-neutral-900/90 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400 text-xl border border-rose-500/30">
                🛡️
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm sm:text-base font-black text-white">
                    Customer Safety & Chemical Checkpoints
                  </h3>
                  {history.has_metallic_salts_or_henna && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      ⚠️ Henna Active
                    </span>
                  )}
                  {history.has_allergy_history && (
                    <span className="text-[10px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-full">
                      🛑 Allergy Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Henna: {history.has_metallic_salts_or_henna ? "⚠️ Yes" : "✓ None"} •
                  Allergy: {history.has_allergy_history ? "🛑 Yes" : "✓ None"} •
                  Patch Test: {history.patch_test_completed_48h ? "✓ Verified" : "Pending"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs font-bold text-amber-400 hidden sm:inline">
                {safetyExpanded ? "Collapse Checkpoints ▲" : "Review All 5 Questions ▼"}
              </span>
              <span className="text-sm text-neutral-400">
                {safetyExpanded ? "▲" : "▼"}
              </span>
            </div>
          </button>

          {safetyExpanded && (
            <div className="p-4 sm:p-6 border-t border-neutral-800 bg-neutral-950/60">
              <VisualSafetyChecklist history={history} onChange={setHistory} />
            </div>
          )}
        </div>

        {/* Primary Action Button to Proceed (Inline) */}
        <div className="pt-2 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={handleSaveAndProceed}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-500 hover:bg-amber-400 px-8 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/25 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>NEXT: CHOOSE TARGET LOOK</span>
            <span className="text-lg">➔</span>
          </button>
        </div>

        {/* Sticky Bottom Action Dock: Always visible on screen, zero scrolling required! */}
        <StickyBottomBar
          summary={
            <>
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold mr-1">
                Hair State:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-amber-300 whitespace-nowrap">
                Roots: L{roots.observed_level} ({roots.grey_percentage}% grey)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-200 whitespace-nowrap">
                Lengths: L{midLengths.observed_level}
              </span>
              {history.has_metallic_salts_or_henna ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-xs font-black text-rose-300 whitespace-nowrap">
                  ⚠️ Henna Flagged
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-xs font-black text-emerald-300 whitespace-nowrap hidden sm:inline">
                  ✓ Safety OK
                </span>
              )}
            </>
          }
          nextAction={{
            label: "CHOOSE TARGET LOOK",
            onClick: handleSaveAndProceed,
            icon: "➔",
          }}
        />

        {/* Visual Camera Scan Modal */}
        <VisualCameraScanModal
          isOpen={photoModalOpen}
          onClose={() => setPhotoModalOpen(false)}
          onApply={handleApplyPhotoPredictions}
        />
      </div>
    );
  }

  // Chemist Mode View (Technical Data)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 pb-28 sm:pb-24">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Step 1 of 3 • Chemist Data Mode
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Starting Hair Assessment
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Independent assessment of Roots, Mid-lengths, and Ends per UHCR v1 §2.9.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setPhotoModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-4 py-2.5 text-xs font-semibold text-white transition-all shadow-sm"
        >
          <span>📸</span> Photo-Assisted Assessment
        </button>
      </div>

      {/* Safety Alert if Allergy Checked */}
      {history.has_allergy_history && (
        <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-xs text-rose-300 flex items-start gap-3">
          <span className="text-lg">⛔</span>
          <div>
            <strong className="block font-bold">Safety Invariant Warning:</strong>
            Prior allergic reaction reported. Automated formulation engine will enforce a hard BLOCKED status on oxidative colour formulas.
          </div>
        </div>
      )}

      {/* Multi-Zone Region Assessments */}
      <div className="space-y-6">
        <RegionAssessmentCard
          title="Roots / Regrowth Region"
          subtitle="Direct scalp contact zone (typically on-scalp application)."
          region={roots}
          onChange={setRoots}
        />

        <RegionAssessmentCard
          title="Mid-Lengths Region"
          subtitle="Intermediate zone between regrowth and ends."
          region={midLengths}
          onChange={setMidLengths}
        />

        <RegionAssessmentCard
          title="Ends Region"
          subtitle="Most porous and chemically processed zone; high risk of tonal grab."
          region={ends}
          onChange={setEnds}
        />
      </div>

      {/* Client Health & Chemical History */}
      <HistoryChecklist history={history} onChange={setHistory} />

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
        <span className="text-xs text-neutral-500">
          Principle 8: Regional variation requires independent technical consideration.
        </span>

        <button
          type="button"
          onClick={handleSaveAndProceed}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          Proceed to Target Colour <span>→</span>
        </button>
      </div>

      {/* Sticky Bottom Action Dock */}
      <StickyBottomBar
        summary={
          <>
            <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold mr-1">
              Chemist Mode:
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-amber-300">
              R: L{roots.observed_level} • M: L{midLengths.observed_level} • E: L{ends.observed_level}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-300">
              {history.has_allergy_history ? "🛑 Allergy Blocked" : "✓ Formula Safe"}
            </span>
          </>
        }
        nextAction={{
          label: "PROCEED TO TARGET COLOUR",
          onClick: handleSaveAndProceed,
          icon: "→",
        }}
      />

      {/* Photo Assessment Modal */}
      <PhotoAnalysisModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onApplyPredictions={handleApplyPhotoPredictions}
      />
    </div>
  );
}
