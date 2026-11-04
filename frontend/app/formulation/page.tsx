"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { HairAssessmentInput } from "../../types/assessment";
import {
  FormulationEvaluateRequest,
  FormulationResultResponse,
  ProcessMode,
  TargetColourInput,
} from "../../types/formulation";
import { CandidateShadeMatch } from "../../types/manufacturer";
import { StageTimeline } from "../../components/StageTimeline";
import { SafetyBadge } from "../../components/SafetyBadge";
import { SafetyAuditList } from "../../features/formulation-results/SafetyAuditList";
import { CrossBrandCompareTable } from "../../features/shade-comparison/CrossBrandCompareTable";
import { evaluateFormulation, getManufacturers } from "../../services/formulationService";
import { compareShades } from "../../services/shadeMappingService";

export default function FormulationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<FormulationResultResponse | null>(null);
  const [crossBrandCandidates, setCrossBrandCandidates] = useState<CandidateShadeMatch[]>([]);
  const [activeRegionTab, setActiveRegionTab] = useState<"ROOTS" | "MID_LENGTHS" | "ENDS">("ROOTS");

  useEffect(() => {
    async function runFormulation() {
      setLoading(true);
      setError(null);

      try {
        // 1. Retrieve assessment and target from localStorage
        const savedAssessment = localStorage.getItem("nh_hair_assessment");
        const savedTarget = localStorage.getItem("nh_target_colour");
        const savedMode = (localStorage.getItem("nh_process_mode") as ProcessMode) || "PREFERRED_MANUFACTURER";
        const savedMfgId = localStorage.getItem("nh_manufacturer_id") || undefined;

        // Default fallback assessment if user arrived directly
        const assessment: HairAssessmentInput = savedAssessment
          ? JSON.parse(savedAssessment)
          : {
              market: "IN",
              roots: {
                region: "ROOTS",
                observed_level: 5,
                existing_artificial_colour: false,
                grey_percentage: 0,
                porosity: "NORMAL",
                condition: "HEALTHY",
                is_on_scalp: true,
              },
              mid_lengths: {
                region: "MID_LENGTHS",
                observed_level: 5,
                existing_artificial_colour: false,
                grey_percentage: 0,
                porosity: "NORMAL",
                condition: "HEALTHY",
                is_on_scalp: false,
              },
              ends: {
                region: "ENDS",
                observed_level: 5,
                existing_artificial_colour: false,
                grey_percentage: 0,
                porosity: "NORMAL",
                condition: "HEALTHY",
                is_on_scalp: false,
              },
              history: {
                has_allergy_history: false,
                patch_test_completed_48h: true,
                scalp_condition: "normal",
                previous_chemical_services: [],
                has_metallic_salts_or_henna: false,
                has_sodium_hydroxide_relaxer: false,
              },
            };

        // Default fallback target if user arrived directly
        const target: TargetColourInput = savedTarget
          ? JSON.parse(savedTarget)
          : {
              universal_level: 7,
              primary_tone: "COPPER",
              secondary_tone: "GOLD",
              tone_intensity: "STANDARD",
            };

        let mfgId = savedMfgId;
        if (!mfgId && savedMode === "PREFERRED_MANUFACTURER") {
          try {
            const mfgs = await getManufacturers();
            if (mfgs.length > 0) {
              mfgId = mfgs[0].id;
            }
          } catch {
            // ignore
          }
        }

        const evaluatePayload: FormulationEvaluateRequest = {
          assessment,
          target_colour: target,
          mode: savedMode,
          manufacturer_id: mfgId,
          market: "IN",
        };

        // Call formulation evaluation API
        const formResult = await evaluateFormulation(evaluatePayload);
        setResult(formResult);

        // Fetch cross-brand candidates for comparison view
        try {
          const compResult = await compareShades({
            market: "IN",
            target: {
              level: target.universal_level,
              primary_tone: target.primary_tone,
              secondary_tone: target.secondary_tone,
              tone_intensity: target.tone_intensity,
            },
            max_level_difference: 1,
            limit: 8,
          });
          setCrossBrandCandidates(compResult.results || []);
        } catch {
          // ignore compare failure
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to generate formulation.");
      } finally {
        setLoading(false);
      }
    }

    runFormulation();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center space-y-4">
        <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-amber-500 border-t-transparent" />
        <h2 className="text-xl font-bold text-white">
          Executing Deterministic Formulation Engine v1.0...
        </h2>
        <p className="text-xs text-neutral-400">
          Running feasibility classification, developer matching, safety audits, and regional differential analysis.
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 space-y-6">
        <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-8 text-center space-y-4">
          <span className="text-4xl">⚠️</span>
          <h2 className="text-xl font-bold text-white">Formulation Evaluation Failed</h2>
          <p className="text-sm text-rose-300 max-w-xl mx-auto">{error}</p>
          <div className="pt-2 flex justify-center gap-3">
            <Link
              href="/starting-hair"
              className="rounded-xl border border-neutral-700 bg-neutral-900 px-4 py-2 text-xs font-semibold text-white"
            >
              Review Starting Hair
            </Link>
            <Link
              href="/target-colour"
              className="rounded-xl bg-amber-500 px-4 py-2 text-xs font-bold text-neutral-950"
            >
              Review Target Look
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isBlocked = result.status === "BLOCKED";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Audit Summary */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
              Formulation Result
            </span>
            <span className="text-neutral-600">•</span>
            <span className="font-mono text-xs text-neutral-400">
              Engine v{result.engine_version}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Technical Formulation Intelligence
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-0.5">
            Manufacturer: <strong>{result.manufacturer_name || "Cross-Brand"}</strong> ({result.market})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <SafetyBadge status={isBlocked ? "BLOCKED" : result.status === "ELIGIBLE_FOR_REVIEW" ? "PASS" : "WARNING"} />
          <span className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 font-mono text-xs text-neutral-300">
            Status: <strong>{result.status}</strong>
          </span>
        </div>
      </div>

      {/* Service Classification Banner */}
      <div
        className={`rounded-2xl border p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isBlocked
            ? "border-rose-500/50 bg-rose-950/20 text-rose-200"
            : result.service_classification === "MULTI_STAGE_PROCESS"
            ? "border-indigo-500/40 bg-indigo-950/20 text-indigo-200"
            : "border-amber-500/40 bg-amber-950/20 text-amber-200"
        }`}
      >
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider block opacity-75">
            Service Classification
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white mt-0.5">
            {result.service_classification.replace(/_/g, " ")}
          </h2>
          <p className="text-xs text-neutral-300 mt-1 max-w-2xl leading-relaxed">
            {result.service_classification === "LIFTING" &&
              "Single-stage oxidative depth lift on virgin hair using permanent colour and developer."}
            {result.service_classification === "MULTI_STAGE_PROCESS" &&
              "Multi-stage sequencing required: pre-lightening stage followed by tonal glazing, or divergent regional formulas."}
            {result.service_classification === "COLOUR_REMOVAL" &&
              "Chemical colour cleansing required: existing artificial pigment cannot be lifted with permanent colour tint alone."}
            {result.service_classification === "DARKENING" &&
              "Depth reduction service: depositing tone deeper than starting level with low developer."}
            {result.service_classification === "SAME_LEVEL_COLOURING" &&
              "Tone enhancement or grey coverage at existing natural depth level."}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="block text-[10px] text-neutral-400 uppercase font-bold">
            Regional Plan
          </span>
          <span className="text-xs font-mono font-semibold text-white">
            {result.shared_regional_formulation
              ? "Shared Uniform Formula"
              : "Separate Regional Formulas"}
          </span>
        </div>
      </div>

      {/* Hard Block Warning (Principle 6) */}
      {isBlocked && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-950/40 p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⛔</span>
            <h3 className="text-base font-bold text-white">
              Executable Formulation Prohibited by Safety Invariant
            </h3>
          </div>
          <p className="text-xs text-rose-200 leading-relaxed">
            In strict compliance with <strong>Architectural Principle 6</strong> (*&quot;Unverified data and safety contraindications must never generate executable formulations&quot;*), no mixing ratios, developer formulas, or application instructions can be generated for this consultation.
          </p>
          <ul className="list-disc list-inside text-xs text-rose-300 space-y-1">
            {result.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Safety Audit List */}
      <SafetyAuditList safetyChecks={result.safety_checks} />

      {/* Executable Stages (if not blocked) */}
      {!isBlocked && (
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>📋</span> Sequenced Technical Stages
            </h2>
            <span className="text-xs font-mono text-neutral-400">
              {result.stages.length} {result.stages.length === 1 ? "Stage" : "Stages"}
            </span>
          </div>

          <StageTimeline stages={result.stages} />
        </section>
      )}

      {/* Regional Plans Tab View */}
      {result.regions && result.regions.length > 0 && !isBlocked && (
        <section className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <span>📍</span> Regional Differential Analysis
              </h3>
              <p className="text-xs text-neutral-400">
                Independent evaluation of Roots, Mid-lengths, and Ends per UHCR v1 §2.9.
              </p>
            </div>

            <div className="flex gap-1.5" role="tablist" aria-label="Hair Region Tabs">
              {(["ROOTS", "MID_LENGTHS", "ENDS"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  role="tab"
                  aria-selected={activeRegionTab === r}
                  onClick={() => setActiveRegionTab(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                    activeRegionTab === r
                      ? "bg-amber-500 text-neutral-950 font-bold"
                      : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Active Region Content */}
          {(() => {
            const plan = result.regions.find((r) => r.region === activeRegionTab);
            if (!plan) return null;
            return (
              <div className="space-y-3 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-neutral-950/60 p-3.5 rounded-lg border border-neutral-800">
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Initial Level</span>
                    <span className="font-mono font-bold text-white text-sm">Level {plan.initial_level}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Target Level</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">Level {plan.target_level}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Depth Delta</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {plan.level_delta > 0 ? `+${plan.level_delta} Lift` : `${plan.level_delta} Darken`}
                    </span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block text-[10px] uppercase font-bold">Regional Service</span>
                    <span className="font-bold text-neutral-200">{plan.service_classification}</span>
                  </div>
                </div>

                {plan.grey_coverage_notes && (
                  <div className="rounded-lg bg-emerald-950/20 border border-emerald-800/40 p-3 text-emerald-200">
                    <strong>Grey Hair Formulation Note:</strong> {plan.grey_coverage_notes}
                  </div>
                )}

                {plan.special_mix_notes && (
                  <div className="rounded-lg bg-purple-950/20 border border-purple-800/40 p-3 text-purple-200">
                    <strong>Special Mix Note:</strong> {plan.special_mix_notes}
                  </div>
                )}
              </div>
            );
          })()}
        </section>
      )}

      {/* Cross-Brand Candidate Comparison */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>🔄</span> Cross-Brand Shade Mapping & Visual Comparison
            </h2>
            <p className="text-xs text-neutral-400">
              Matches across Wella Professionals and L&apos;Oréal Professionnel catalogues using UHCR distance metric.
            </p>
          </div>
        </div>

        <CrossBrandCompareTable candidates={crossBrandCandidates} />
      </section>

      {/* Principle 4 Chemical Equivalence Boundary Warning */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/40 p-4 text-xs text-neutral-400 space-y-1">
        <div className="flex items-center gap-2 text-neutral-200 font-semibold">
          <span>⚠️</span> Non-Negotiable Chemical Equivalence Boundary (Principle 4)
        </div>
        <p className="text-[11px] leading-relaxed">
          Similar visual colour does not establish chemical or formulation equivalence. Wella Koleston Perfect ME+ and L&apos;Oréal Majirel utilize distinct alkaline bases, developer ratios, and pigment precursors. Never combine or cross-substitute technical rules between manufacturers.
        </p>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
        <Link
          href="/target-colour"
          className="rounded-xl border border-neutral-800 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          ← Adjust Target Look
        </Link>
        <Link
          href="/starting-hair"
          className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-neutral-950 transition-colors"
        >
          New Client Assessment
        </Link>
      </div>
    </div>
  );
}
