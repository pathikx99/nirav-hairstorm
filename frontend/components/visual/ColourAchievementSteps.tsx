"use client";

import React, { useMemo } from "react";
import { HairAssessmentInput } from "../../types/assessment";
import { TargetColourInput } from "../../types/formulation";
import { calculateHairAchievementPlan } from "../../services/hairStepsService";

interface ColourAchievementStepsProps {
  assessment: HairAssessmentInput | null;
  targetColour: TargetColourInput;
  onProceedToFormulation?: () => void;
  className?: string;
}

export function ColourAchievementSteps({
  assessment,
  targetColour,
  onProceedToFormulation,
  className = "",
}: ColourAchievementStepsProps) {
  // Compute the deterministic salon achievement roadmap
  const plan = useMemo(() => {
    return calculateHairAchievementPlan(assessment, targetColour);
  }, [assessment, targetColour]);

  const startingLevel = plan.startingLevel;
  const targetLevel = plan.targetLevel;
  const delta = plan.levelDelta;

  return (
    <div
      className={`rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 sm:p-8 shadow-2xl space-y-6 ${className}`}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
            <span>📋</span> Technical Service Roadmap • Step-by-Step Guide
          </span>
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2 mt-1">
            Steps to Achieve This Colour
          </h3>
          <p className="text-xs text-neutral-400 mt-1">
            Scientific chemical pathway from client starting hair to target shade • Tap 🔊 for audio
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          
        </div>
      </div>

      {/* Starting Hair vs Target Colour Transformation Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-2xl border border-neutral-800 bg-neutral-950/80 items-center" suppressHydrationWarning>
        {/* Starting Hair Box */}
        <div className="flex items-center gap-3" suppressHydrationWarning>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-neutral-800 border border-neutral-700 text-white font-black text-lg" suppressHydrationWarning>
            <span suppressHydrationWarning>{startingLevel}</span>
          </div>
          <div suppressHydrationWarning>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Starting Base
            </span>
            <span className="text-sm font-black text-white block" suppressHydrationWarning>
              Level {startingLevel} {plan.hasArtificialColor ? "(Coloured)" : "(Virgin)"}
            </span>
            <span className="text-[11px] text-neutral-400" suppressHydrationWarning>
              Grey: {plan.greyPercentage}%
            </span>
          </div>
        </div>

        {/* Center Shift Badge */}
        <div className="flex flex-col items-center justify-center text-center py-2 px-3 rounded-xl bg-neutral-900 border border-neutral-800" suppressHydrationWarning>
          <span className="text-xs font-black text-amber-400 flex items-center gap-1" suppressHydrationWarning>
            {delta > 0 ? (
              <span>⚡ +{delta} Levels Lift</span>
            ) : delta < 0 ? (
              <span>⬇️ {delta} Levels Darken</span>
            ) : (
              <span>🔄 Same Level (Tone Deposit)</span>
            )}
          </span>
          <span className="text-[10px] text-neutral-300 font-medium mt-0.5" suppressHydrationWarning>
            {plan.actionSummaryEn}
          </span>
        </div>

        {/* Target Colour Box */}
        <div className="flex items-center justify-end gap-3 text-right">
          <div>
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
              Target Look
            </span>
            <span className="text-sm font-black text-amber-400 block font-mono">
              Level {targetLevel} {targetColour.primary_tone}
              {targetColour.secondary_tone ? ` / ${targetColour.secondary_tone}` : ""}
            </span>
            <span className="text-[11px] text-neutral-400">
              Intensity: {targetColour.tone_intensity || "STANDARD"}
            </span>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 font-black text-lg shadow-lg shadow-amber-500/20">
            {targetLevel}
          </div>
        </div>
      </div>

      {/* Exposed Melanin Undertone Banner (Colour Wheel Science) */}
      <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div
            className="h-10 w-10 rounded-full border-2 border-white/60 shadow-md shrink-0"
            style={{ backgroundColor: plan.exposedPigment.colorHex }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Exposed Undertone at Level {targetLevel}:
              </span>
              <span className="text-xs font-black text-white font-mono">
                {plan.exposedPigment.pigmentNameEn}
              </span>
            </div>
            <p className="text-xs text-neutral-300 mt-0.5 leading-relaxed">
              {plan.exposedPigment.reasonEn}
            </p>
          </div>
        </div>

        <div className="sm:text-right shrink-0">
          <span className="text-[10px] text-neutral-400 uppercase font-bold block">
            Colour Wheel Counteractant:
          </span>
          <span className="text-xs font-black text-amber-300 font-mono">
            {plan.exposedPigment.neutralizingNameEn} ({plan.exposedPigment.neutralizingShadeCode})
          </span>
        </div>
      </div>

      {/* Safety Alerts if any */}
      {plan.safetyAlerts.length > 0 && (
        <div className="space-y-2">
          {plan.safetyAlerts.map((alert, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border p-4 flex items-start gap-3 ${
                alert.severity === "BLOCKED"
                  ? "border-rose-500/60 bg-rose-950/40 text-rose-200"
                  : "border-amber-500/60 bg-amber-950/40 text-amber-200"
              }`}
            >
              <span className="text-xl">⚠️</span>
              <div className="text-xs">
                <strong className="block font-bold leading-relaxed">{alert.en}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Step by Step Action Cards */}
      <div className="space-y-4">
        <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
          <span>🪜</span> Step-by-Step Chemical Procedure:
        </h4>

        {plan.steps.map((step) => (
          <div
            key={step.stepNumber}
            className={`rounded-2xl border p-5 transition-all space-y-3 ${
              step.isCrucial
                ? "border-amber-500/70 bg-neutral-950/90 ring-1 ring-amber-500/30"
                : "border-neutral-800 bg-neutral-950/60 hover:border-neutral-700"
            }`}
          >
            {/* Step Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/80 pb-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500 text-neutral-950 font-black text-sm shadow-md">
                  {step.stepNumber}
                </span>
                <div>
                  <h5 className="text-base font-black text-white flex items-center gap-2">
                    <span>{step.icon}</span>
                    <span>{step.titleEn}</span>
                  </h5>
                </div>
              </div>

              {step.isCrucial && (
                <span className="self-start sm:self-auto px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                  Crucial Technique
                </span>
              )}
            </div>

            {/* Instruction Body */}
            <div className="space-y-2.5 text-xs">
              <p className="text-neutral-200 font-medium text-sm leading-relaxed">
                {step.instructionEn}
              </p>

              {/* Technical / Chemical Note */}
              {step.chemicalActionEn && (
                <div className="rounded-xl bg-neutral-900 border border-neutral-800/80 p-2.5 flex items-start gap-2 text-[11px]">
                  <span className="text-amber-400 font-bold shrink-0">🔬 Chemical Action:</span>
                  <span className="text-neutral-300 leading-relaxed">{step.chemicalActionEn}</span>
                </div>
              )}
            </div>

            {/* Step Metrics Footer: Developer, Mixing Ratio, Timing */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-900 text-[11px]">
              {step.developerRequired && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-blue-300 font-bold font-mono">
                  <span>🧴</span> Developer: {step.developerRequired}
                </span>
              )}
              {step.mixingRatio && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 text-amber-300 font-bold font-mono">
                  <span>⚖️</span> Ratio: {step.mixingRatio}
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-1 text-neutral-300 font-bold font-mono ml-auto">
                <span>⏱️</span> Time: {step.timing}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button: Proceed to Mixing Station */}
      {onProceedToFormulation && (
        <div className="pt-3 border-t border-neutral-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-neutral-400">
            <span>⚖️ Exact Grams & Squeezable Tubes ready on Digital Workstation</span>
          </div>

          <button
            type="button"
            onClick={onProceedToFormulation}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 px-7 py-3.5 text-sm font-black text-neutral-950 shadow-xl shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>SEE EXACT GRAMS ON DIGITAL SCALE</span>
            <span className="text-lg">➔</span>
          </button>
        </div>
      )}
    </div>
  );
}
