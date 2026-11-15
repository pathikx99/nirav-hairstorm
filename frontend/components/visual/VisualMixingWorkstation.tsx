"use client";

import React, { useState } from "react";
import { FormulationStage } from "../../types/formulation";
import { VisualKitchenTimer } from "./VisualKitchenTimer";

interface VisualMixingWorkstationProps {
  stages: FormulationStage[];
  exposedPigment?: string | null;
  counterToner?: string | null;
  technique?: string | null;
}

export function VisualMixingWorkstation({
  stages,
  exposedPigment,
  counterToner,
  technique,
}: VisualMixingWorkstationProps) {
  // Batch size scaling: 30g, 60g, 120g (default 60g base)
  const [batchSize, setBatchSize] = useState<30 | 60 | 120>(60);
  const [tared, setTared] = useState(false);

  if (!stages || stages.length === 0) {
    return (
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400">
        No executable stages found.
      </div>
    );
  }

  // Developer bottle cap colors by volume
  const getDeveloperColor = (vol: number) => {
    switch (vol) {
      case 10:
        return { cap: "#64748b", bg: "#334155", label: "GREY CAP (10 Vol / 3%)" };
      case 20:
        return { cap: "#2563eb", bg: "#1e3a8a", label: "BLUE CAP (20 Vol / 6%)" };
      case 30:
        return { cap: "#f59e0b", bg: "#78350f", label: "GOLD CAP (30 Vol / 9%)" };
      case 40:
        return { cap: "#dc2626", bg: "#7f1d1d", label: "RED CAP (40 Vol / 12%)" };
      default:
        return { cap: "#2563eb", bg: "#1e3a8a", label: "DEVELOPER" };
    }
  };

  // Scaling factor based on standard 60g batch
  const scaleMultiplier = batchSize / 60;

  return (
    <div className="space-y-8">
      {/* 1. Global Workstation Controls Bar: Batch Size + Tare Status */}
      <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl border border-amber-500/40">
            ⚖️
          </span>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              Digital Scale Workstation
            </h3>
            <p className="text-xs text-neutral-400">
              Proportionally scale batch for hair density • Step-by-step tare guide
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Batch Size Selector */}
          <div className="flex items-center rounded-2xl bg-neutral-950 p-1 border border-neutral-800">
            <span className="text-[11px] font-bold text-neutral-400 px-2.5">
              Batch:
            </span>
            <button
              type="button"
              onClick={() => setBatchSize(30)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                batchSize === 30
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              30g (Touch-up)
            </button>
            <button
              type="button"
              onClick={() => setBatchSize(60)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                batchSize === 60
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              60g (Standard)
            </button>
            <button
              type="button"
              onClick={() => setBatchSize(120)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                batchSize === 120
                  ? "bg-amber-500 text-neutral-950 shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              120g (Thick/Long)
            </button>
          </div>

          {/* Tare Scale Simulator Button */}
          <button
            type="button"
            onClick={() => setTared((prev) => !prev)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-mono font-bold transition-all border ${
              tared
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
            }`}
          >
            {tared ? "✓ SCALE TARED (0.0g)" : "PRESS TO TARE SCALE"}
          </button>
        </div>
      </div>

      {/* 2. Exposed Pigment (NRP) & Counter-Toner Alert Banner */}
      {(exposedPigment || counterToner) && (
        <div className="rounded-3xl border border-sky-500/40 bg-sky-950/30 p-5 shadow-xl">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-2xl border border-sky-500/40">
              🎨
            </span>
            <div className="space-y-1.5 w-full">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white uppercase tracking-wider">
                  Colorimetry & NRP Neutralization Analysis
                </h4>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  AUTOMATED SCIENCE
                </span>
              </div>
              <p className="text-xs text-sky-200">
                {exposedPigment && (
                  <span className="block font-medium">
                    • <strong>Exposed Underlying Pigment (NRP):</strong> {exposedPigment}
                  </span>
                )}
                {counterToner && (
                  <span className="block font-medium mt-0.5">
                    • <strong>Counter-Neutralization Strategy:</strong> {counterToner}
                  </span>
                )}
              </p>
              <p className="text-[11px] text-neutral-400 italic pt-1">
                When lifting, underlying pheomelanin and eumelanin warm pigments are exposed. The formula balances these reflections using complementary opposing tones on the color wheel.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3. Render Each Mixing Stage / Bowl */}
      {stages.map((stage, idx) => {
        const products = stage.products && stage.products.length > 0 ? stage.products : [];
        const developer = stage.developer;
        const devVol = Number(developer?.volume_in_vol) || 20;
        const devPercent = Number(developer?.concentration_percent) || 6.0;
        const devName = developer?.developer_name || "Developer";
        const devColors = getDeveloperColor(devVol);

        const baseTotalTubeGrams = products.reduce(
          (acc, p) => acc + (Number(p?.weight_grams) || 0),
          0
        ) || 30;
        const baseDevGrams = Number(developer?.weight_grams) || baseTotalTubeGrams;

        // Apply dynamic batch scaling
        const scaledTotalTubeGrams = Math.round(baseTotalTubeGrams * scaleMultiplier * 10) / 10;
        const scaledDevGrams = Math.round(baseDevGrams * scaleMultiplier * 10) / 10;
        const totalGrams = Math.round((scaledTotalTubeGrams + scaledDevGrams) * 10) / 10;

        const isDualBowl = stages.length > 1;
        const isBowl1 = idx === 0 && isDualBowl;
        const isBowl2 = idx === 1 && isDualBowl;

        return (
          <section
            key={stage.stage_number || idx}
            className={`rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-6 transition-all ${
              isBowl1
                ? "border-amber-500/40 bg-neutral-900/90 shadow-amber-500/5"
                : isBowl2
                ? "border-purple-500/40 bg-neutral-900/90 shadow-purple-500/5"
                : "border-neutral-800 bg-neutral-900/80"
            }`}
          >
            {/* Stage / Bowl Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl font-black text-xl shadow-lg ${
                    isBowl1
                      ? "bg-amber-500 text-neutral-950 shadow-amber-500/20"
                      : isBowl2
                      ? "bg-purple-500 text-white shadow-purple-500/20"
                      : "bg-amber-500 text-neutral-950 shadow-amber-500/20"
                  }`}
                >
                  {stage.stage_number}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">
                      {isDualBowl
                        ? isBowl1
                          ? "🥣 Bowl 1: Root Shadow / Base Anchor"
                          : isBowl2
                          ? "🥣 Bowl 2: Color Melt / Vibrant Glaze"
                          : `Step ${stage.stage_number}: Mix & Apply Formula`
                        : `Step ${stage.stage_number}: Mix & Apply Formula`}
                    </h3>
                    {technique && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-amber-300 border border-neutral-700">
                        {technique}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-amber-300 font-semibold mt-0.5">
                    {stage.stage_description}
                  </p>
                </div>
              </div>

              {/* Mixing Ratio Badge */}
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 rounded-xl bg-neutral-950 border border-neutral-800 text-xs font-mono font-bold text-neutral-300">
                  Ratio: {stage.mixing_ratio_text || "1:1"}
                </span>
              </div>
            </div>

            {/* Visual Mixing Station Cards: Tube + Developer + Scale */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* 1. Squeezable Tube(s) */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    1. Colour Tube{products.length > 1 ? "s" : ""}
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {scaledTotalTubeGrams}g Total
                  </span>
                </div>

                {/* Illustrated Tube Graphic(s) */}
                <div className="my-3 flex flex-wrap items-center justify-center gap-2">
                  {products.map((p, pIdx) => {
                    const basePGrams = Number(p.weight_grams) || 30;
                    const scaledPGrams = Math.round(basePGrams * scaleMultiplier * 10) / 10;
                    const pCode = p.shade_code || "7/xx";
                    const isBase = pCode.endsWith("/0") || pCode.endsWith(".0");
                    return (
                      <div
                        key={pIdx}
                        className="relative w-24 h-36 rounded-t-xl rounded-b-2xl bg-linear-to-b from-neutral-700 via-neutral-800 to-amber-900/80 border-2 border-amber-500/60 p-1.5 shadow-xl flex flex-col items-center justify-between"
                      >
                        {/* Cap */}
                        <div className="w-8 h-3 -mt-3 rounded-t-md bg-neutral-900 border border-neutral-700" />

                        {/* Tube Label */}
                        <div className="text-center w-full my-auto">
                          <span className="text-[9px] text-amber-300 font-bold block uppercase tracking-wide truncate">
                            {isBase ? "Base Tone" : "Fashion"}
                          </span>
                          <span className="text-xl font-black text-white font-mono tracking-wider block my-0.5">
                            {pCode}
                          </span>
                          <span className="text-[10px] text-amber-400 font-mono font-bold block">
                            {scaledPGrams}g
                          </span>
                        </div>

                        {/* Fill Line Gauge */}
                        <div className="w-full bg-black/60 rounded-full h-2 p-0.5 border border-amber-500/40">
                          <div
                            className="bg-amber-400 h-full rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (scaledPGrams / (60 * scaleMultiplier)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-xs text-neutral-400 mt-2 font-mono">
                  {products
                    .map((p) => {
                      const baseG = Number(p.weight_grams) || 30;
                      return `${p.shade_code} (${Math.round(baseG * scaleMultiplier * 10) / 10}g)`;
                    })
                    .join(" + ")}
                </div>
              </div>

              {/* 2. Developer Bottle */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    2. Developer Bottle
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {scaledDevGrams} Grams
                  </span>
                </div>

                {/* Illustrated Developer Bottle */}
                <div className="my-3 flex flex-col items-center">
                  <div className="relative w-24 h-40 rounded-t-2xl rounded-b-xl bg-linear-to-b from-neutral-800 to-neutral-900 border-2 border-blue-500/60 p-2 shadow-xl flex flex-col items-center justify-between">
                    {/* Colored Bottle Cap */}
                    <div
                      className="w-10 h-6 -mt-6 rounded-t-lg shadow-md border border-white/20"
                      style={{ backgroundColor: devColors.cap }}
                    />

                    {/* Bottle Label */}
                    <div className="text-center w-full my-auto">
                      <span className="text-[10px] text-blue-300 font-bold block uppercase tracking-wide">
                        {devName}
                      </span>
                      <span className="text-3xl font-black text-white font-mono tracking-wider block my-1">
                        {devVol}
                      </span>
                      <span className="text-[11px] text-neutral-300 font-bold block">
                        VOLUME ({devPercent}%)
                      </span>
                    </div>

                    {/* Fill Level */}
                    <div className="w-full bg-blue-950/60 rounded-full h-3 p-0.5 border border-blue-500/40">
                      <div
                        className="bg-blue-400 h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (scaledDevGrams / (60 * scaleMultiplier)) * 100)}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-xs font-bold text-blue-300 mt-2">
                    {devColors.label}
                  </span>
                </div>
              </div>

              {/* 3. Illustrated Weighing Scale & Bowl */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    3. Digital Scale & Bowl
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total: {totalGrams}g
                  </span>
                </div>

                {/* Digital Scale Graphic */}
                <div className="my-3 flex flex-col items-center">
                  {/* Bowl */}
                  <div
                    className={`w-24 h-12 rounded-b-full bg-linear-to-b from-neutral-700 to-neutral-900 border-2 shadow-lg flex items-center justify-center relative ${
                      isBowl1
                        ? "border-amber-500/80"
                        : isBowl2
                        ? "border-purple-500/80"
                        : "border-neutral-600"
                    }`}
                  >
                    <span className="text-lg">🥣</span>
                  </div>

                  {/* Scale Platform */}
                  <div className="w-32 h-14 rounded-xl bg-neutral-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-2 mt-1">
                    <div className="w-full bg-black/90 rounded px-2 py-1 text-center font-mono font-black text-emerald-400 text-lg border border-emerald-500/30">
                      {tared ? "0.0 g" : `${totalGrams} g`}
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-400 mt-2 font-medium">
                    {tared ? "Tared (Ready for pour)" : "Weigh on Scale"}
                  </span>
                </div>
              </div>
            </div>

            {/* Application Zone Instruction */}
            <div
              className={`rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isBowl1
                  ? "border-amber-500/30 bg-amber-500/10"
                  : isBowl2
                  ? "border-purple-500/30 bg-purple-500/10"
                  : "border-neutral-800 bg-neutral-950/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/40 text-2xl border border-white/10">
                  🖌️
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Where to apply with tint brush:
                  </h4>
                  <p className="text-xs text-amber-200 mt-0.5">
                    {stage.target_regions.join(" + ")}
                  </p>
                  <p className="text-[11px] text-neutral-300 mt-1">
                    {stage.application_instructions}
                  </p>
                </div>
              </div>
            </div>

            {/* Visual Kitchen Timer */}
            <VisualKitchenTimer
              initialMinutes={stage.development_time_minutes || 35}
            />
          </section>
        );
      })}
    </div>
  );
}
