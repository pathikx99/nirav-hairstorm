"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ClientHistoryInput,
  HairAssessmentInput,
  HairRegionInput,
} from "../../types/assessment";
import { ToneFamily, UniversalLevel } from "../../types/uhcr";
import { useApp } from "../../context/AppContext";
import { HairStrandMacroStudio } from "../../components/visual/HairStrandMacroStudio";
import { RealisticHairSwatch } from "../../components/visual/RealisticHairSwatch";
import { VisualGreySelector } from "../../components/visual/VisualGreySelector";
import { VisualSafetyChecklist } from "../../components/visual/VisualSafetyChecklist";
import { VisualCameraScanModal } from "../../components/visual/VisualCameraScanModal";
import { StickyBottomBar } from "../../components/StickyBottomBar";

export default function StartingHairPage() {
  const router = useRouter();
  const {
    lightingMode,
    setLightingMode,
  } = useApp();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [activeZone, setActiveZone] = useState<"ROOTS" | "MID_LENGTHS" | "ENDS">("ROOTS");
  const [safetyExpanded, setSafetyExpanded] = useState(false);

  const [roots, setRoots] = useState<HairRegionInput>({
    region: "ROOTS",
    observed_level: 1,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    is_bleached: false,
    grey_percentage: 0,
    porosity: "NORMAL",
    condition: "HEALTHY",
    is_on_scalp: true,
    colourist_confirmed: true,
  });

  const [midLengths, setMidLengths] = useState<HairRegionInput>({
    region: "MID_LENGTHS",
    observed_level: 1,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    is_bleached: false,
    grey_percentage: 0,
    porosity: "NORMAL",
    condition: "HEALTHY",
    is_on_scalp: false,
    colourist_confirmed: true,
  });

  const [ends, setEnds] = useState<HairRegionInput>({
    region: "ENDS",
    observed_level: 1,
    observed_undertone: "NATURAL",
    existing_artificial_colour: false,
    is_bleached: false,
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

  const [contraindicationWarningOpen, setContraindicationWarningOpen] = useState(false);

  const hasHardContraindication =
    history.has_allergy_history ||
    history.has_sodium_hydroxide_relaxer ||
    history.scalp_condition === "abraded" ||
    history.scalp_condition === "inflamed";

  const executeProceed = () => {
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

  const handleSaveAndProceed = () => {
    if (hasHardContraindication) {
      setContraindicationWarningOpen(true);
      return;
    }
    executeProceed();
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

  const [syncAllZones, setSyncAllZones] = useState(true);

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
      is_bleached: currentRegion.is_bleached,
    }));
    setMidLengths((prev) => ({
      ...prev,
      observed_level: currentRegion.observed_level,
      observed_undertone: currentRegion.observed_undertone,
      grey_percentage: currentRegion.grey_percentage,
      existing_artificial_colour: currentRegion.existing_artificial_colour,
      is_bleached: currentRegion.is_bleached,
    }));
    setEnds((prev) => ({
      ...prev,
      observed_level: currentRegion.observed_level,
      observed_undertone: currentRegion.observed_undertone,
      grey_percentage: currentRegion.grey_percentage,
      existing_artificial_colour: currentRegion.existing_artificial_colour,
      is_bleached: currentRegion.is_bleached,
    }));
  };



  const levels: UniversalLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

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
            Select hair zone to adjust level & undertone • Use camera auto-scan if desired
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



        {/* Dual-Column Interactive Strand Studio + Zone Swatch Picker */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Column 1: Hair Strand Macro Studio (5 cols) */}
          <div className="lg:col-span-5 space-y-3 lg:sticky lg:top-20">
            <HairStrandMacroStudio
              level={currentRegion.observed_level || 5}
              primaryTone={(currentRegion.observed_undertone as ToneFamily) || "NATURAL"}
              greyPercentage={currentRegion.grey_percentage || 0}
              isBleached={currentRegion.is_bleached}
              lightingMode={lightingMode}
              onLightingModeChange={setLightingMode}
              zoneLabel={activeZone === "ROOTS" ? "Zone 1: Roots" : activeZone === "MID_LENGTHS" ? "Zone 2: Mid-Lengths" : "Zone 3: Ends"}
              showLightingComparison={false}
              className="w-full"
            />
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

            {/* Zone Selector Tabs (Roots / Mid-Lengths / Ends) */}
            <div className="flex items-center gap-2 p-1.5 bg-neutral-950/80 rounded-2xl border border-neutral-800/80">
              <button
                type="button"
                onClick={() => setActiveZone("ROOTS")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeZone === "ROOTS"
                    ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <span>🌱</span>
                <span>Zone 1: Roots</span>
                <span className="text-[10px] opacity-80 font-mono">L{roots.observed_level}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveZone("MID_LENGTHS")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeZone === "MID_LENGTHS"
                    ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <span>〰️</span>
                <span>Zone 2: Mid-Lengths</span>
                <span className="text-[10px] opacity-80 font-mono">L{midLengths.observed_level}</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveZone("ENDS")}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  activeZone === "ENDS"
                    ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-900"
                }`}
              >
                <span>✨</span>
                <span>Zone 3: Ends</span>
                <span className="text-[10px] opacity-80 font-mono">L{ends.observed_level}</span>
              </button>
            </div>

            {/* Realistic Hair Swatches (Levels 1 to 10) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-300 block">
                  Hair Depth Level (Select Depth Level 1–10):
                </label>
                {currentRegion.is_bleached && (
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    ⚡ Showing Raw Exposed Undertones
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {levels.map((lvl) => (
                  <RealisticHairSwatch
                    key={lvl}
                    level={lvl}
                    isBleached={currentRegion.is_bleached}
                    selected={currentRegion.observed_level === lvl}
                    onClick={(l) => {
                      const undertonesByLevel: Record<number, ToneFamily> = {
                        1: "NATURAL",
                        2: "RED",
                        3: "RED",
                        4: "RED",
                        5: "COPPER",
                        6: "COPPER",
                        7: "GOLD",
                        8: "GOLD",
                        9: "GOLD",
                        10: "NATURAL",
                      };
                      setCurrentRegion({
                        ...currentRegion,
                        observed_level: l,
                        observed_undertone: currentRegion.is_bleached
                          ? undertonesByLevel[l] || "GOLD"
                          : currentRegion.observed_undertone,
                      });
                    }}
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

            {/* Bleached / Pre-lightened Check */}
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white block">
                    Is this hair bleached or pre-lightened?
                  </span>
                  {currentRegion.is_bleached && (
                    <span className="text-[10px] font-black bg-amber-500 text-neutral-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      ⚡ Undertone Active
                    </span>
                  )}
                </div>
                <span className="text-xs text-neutral-400 block mt-0.5">
                  If bleached, raw underlying warm undertone pigments are exposed and used in formulation.
                </span>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const undertonesByLevel: Record<number, ToneFamily> = {
                      1: "NATURAL",
                      2: "RED",
                      3: "RED",
                      4: "RED",
                      5: "COPPER",
                      6: "COPPER",
                      7: "GOLD",
                      8: "GOLD",
                      9: "GOLD",
                      10: "NATURAL",
                    };
                    const lvl = currentRegion.observed_level || 5;
                    setCurrentRegion({
                      ...currentRegion,
                      is_bleached: true,
                      existing_artificial_colour: true,
                      observed_undertone: undertonesByLevel[lvl] || "GOLD",
                      porosity: "HIGH",
                      condition: currentRegion.condition === "HEALTHY" ? "MODERATELY_DAMAGED" : currentRegion.condition,
                    });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    currentRegion.is_bleached
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  ⚡ YES (Bleached)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentRegion({
                      ...currentRegion,
                      is_bleached: false,
                    });
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                    !currentRegion.is_bleached
                      ? "bg-neutral-700 text-white shadow-md ring-1 ring-neutral-400"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  🌿 NO (Natural / Unbleached)
                </button>
              </div>
            </div>

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
              <span className="text-[10px] font-mono text-neutral-400 uppercase font-bold mr-1 shrink-0">
                Hair State:
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-amber-300 whitespace-nowrap">
                Roots: L{roots.observed_level} ({roots.grey_percentage}% grey)
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-neutral-900 border border-neutral-800 text-xs font-black text-neutral-200 whitespace-nowrap">
                Lengths: L{midLengths.observed_level}
              </span>
              {history.has_allergy_history ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-xs font-black text-rose-300 whitespace-nowrap">
                  🛑 Allergy Active
                </span>
              ) : history.has_sodium_hydroxide_relaxer ? (
                <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 border border-rose-500/50 text-xs font-black text-rose-300 whitespace-nowrap">
                  🛑 Relaxer Flagged
                </span>
              ) : history.has_metallic_salts_or_henna ? (
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

        {/* Hard Contraindication Pre-Flight Warning Modal */}
        {contraindicationWarningOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="max-w-lg w-full rounded-3xl border border-rose-500/50 bg-neutral-950 p-6 sm:p-8 shadow-2xl space-y-5 text-left">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 text-2xl border border-rose-500/40">
                  🛑
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    Safety Warning: Hard Contraindication
                  </h3>
                  <p className="text-xs text-rose-300 font-medium">
                    Critical chemical contraindication detected in client history
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs text-rose-200 space-y-2">
                {history.has_allergy_history && (
                  <p>• <strong>Documented Allergy History:</strong> Oxidative hair dyes (PPD/PTD) carry severe risk of contact dermatitis or anaphylaxis without verified 48h patch testing.</p>
                )}
                {history.has_sodium_hydroxide_relaxer && (
                  <p>• <strong>Sodium Hydroxide / Lye Relaxer:</strong> Bleaching or oxidative high-lift over lye relaxers can cause severe structural dissolution and chemical breakage.</p>
                )}
                {(history.scalp_condition === "abraded" || history.scalp_condition === "inflamed") && (
                  <p>• <strong>Compromised Scalp Barrier:</strong> Chemical application directly onto abraded or inflamed scalp is strictly prohibited.</p>
                )}
                <p className="text-neutral-400 text-[11px] pt-1">
                  You may proceed to preview colors and non-oxidative alternatives, but chemical mixing will remain strictly blocked.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setContraindicationWarningOpen(false)}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-neutral-700 bg-neutral-900 text-xs font-bold text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Return to Assessment
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setContraindicationWarningOpen(false);
                    executeProceed();
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black text-white shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
                >
                  Proceed with Safety Notice ➔
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
}
