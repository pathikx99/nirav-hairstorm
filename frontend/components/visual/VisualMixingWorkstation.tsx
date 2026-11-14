"use client";

import React from "react";
import { FormulationStage } from "../../types/formulation";
import { VisualKitchenTimer } from "./VisualKitchenTimer";

interface VisualMixingWorkstationProps {
  stages: FormulationStage[];
}

export function VisualMixingWorkstation({ stages }: VisualMixingWorkstationProps) {
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
        return { cap: "#64748b", bg: "#334155", label: "GREY CAP" };
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

  return (
    <div className="space-y-8">
      {stages.map((stage, idx) => {
        const products = stage.products && stage.products.length > 0 ? stage.products : [];
        const developer = stage.developer;
        const devVol = Number(developer?.volume_in_vol) || 20;
        const devPercent = Number(developer?.concentration_percent) || 6.0;
        const devName = developer?.developer_name || "Developer";
        const devColors = getDeveloperColor(devVol);

        const totalTubeGrams = products.reduce(
          (acc, p) => acc + (Number(p?.weight_grams) || 0),
          0
        ) || 30;
        const devGrams = Number(developer?.weight_grams) || totalTubeGrams;
        const totalGrams = Math.round((totalTubeGrams + devGrams) * 10) / 10;

        return (
          <section
            key={stage.stage_number || idx}
            className="rounded-3xl border border-neutral-800 bg-neutral-900/80 p-6 sm:p-8 shadow-2xl space-y-6"
          >
            {/* Stage Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-5">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 font-black text-xl shadow-lg shadow-amber-500/20">
                  {stage.stage_number}
                </span>
                <div>
                  <h3 className="text-xl font-black text-white">
                    Step {stage.stage_number}: Mix & Apply Formula
                  </h3>
                  <p className="text-xs text-amber-300 font-semibold">
                    {stage.stage_description}
                  </p>
                </div>
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
                    {totalTubeGrams}g Total
                  </span>
                </div>

                {/* Illustrated Tube Graphic(s) */}
                <div className="my-3 flex flex-wrap items-center justify-center gap-2">
                  {products.map((p, pIdx) => {
                    const pGrams = Number(p.weight_grams) || 30;
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
                            {pGrams}g
                          </span>
                        </div>

                        {/* Fill Line Gauge */}
                        <div className="w-full bg-black/60 rounded-full h-2 p-0.5 border border-amber-500/40">
                          <div
                            className="bg-amber-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, (pGrams / 60) * 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-xs text-neutral-400 mt-2">
                  {products.map((p) => `${p.shade_code} (${p.weight_grams}g)`).join(" + ")}
                </div>
              </div>

              {/* 2. Developer Bottle */}
              <div className="rounded-2xl border border-neutral-800 bg-neutral-950/70 p-5 flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    2. Developer Bottle
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-400">
                    {devGrams} Grams
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
                        className="bg-blue-400 h-full rounded-full"
                        style={{ width: `${Math.min(100, (devGrams / 60) * 100)}%` }}
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
                    3. Scale & Mixing Bowl
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    Total: {totalGrams}g
                  </span>
                </div>

                {/* Digital Scale Graphic */}
                <div className="my-3 flex flex-col items-center">
                  {/* Bowl */}
                  <div className="w-24 h-12 rounded-b-full bg-linear-to-b from-neutral-700 to-neutral-900 border-2 border-neutral-600 shadow-lg flex items-center justify-center relative">
                    <span className="text-lg">🥣</span>
                  </div>

                  {/* Scale Platform */}
                  <div className="w-32 h-14 rounded-xl bg-neutral-900 border-2 border-emerald-500/50 shadow-2xl flex flex-col items-center justify-center p-2 mt-1">
                    <div className="w-full bg-black/90 rounded px-2 py-1 text-center font-mono font-black text-emerald-400 text-lg border border-emerald-500/30">
                      {totalGrams}.0 g
                    </div>
                  </div>

                  <span className="text-[11px] text-neutral-400 mt-2 font-medium">
                    1:1 Equal Ratio
                  </span>
                </div>

                              </div>
            </div>

            {/* Application Zone Instruction */}
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl border border-amber-500/30">
                  🖌️
                </span>
                <div>
                  <h4 className="text-sm font-black text-white">
                    Where to apply with brush:
                  </h4>
                  <p className="text-xs text-amber-200 mt-0.5">
                    {stage.target_regions.join(" + ")}
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
