"use client";

import React, { useState } from "react";
import { FormulationResultResponse, TargetColourInput } from "../../types/formulation";
import { CandidateShadeMatch } from "../../types/manufacturer";
import { VisualKitchenTimer } from "../../components/visual/VisualKitchenTimer";

interface EasyStylistRecipeViewProps {
  result: FormulationResultResponse;
  targetData: TargetColourInput;
  crossBrandCandidates: CandidateShadeMatch[];
  onSelectCandidate: (candidate: CandidateShadeMatch) => void;
  onSwitchToChemistView: () => void;
}

export function EasyStylistRecipeView({
  result,
  targetData,
  crossBrandCandidates,
  onSelectCandidate,
  onSwitchToChemistView,
}: EasyStylistRecipeViewProps) {
  // Batch size: 30g (Roots/Touch-up), 60g (Standard), 120g (Long/Thick hair)
  const [batchSize, setBatchSize] = useState<30 | 60 | 120>(60);
  const [tared, setTared] = useState(false);
  const [copied, setCopied] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const scaleMultiplier = batchSize / 60;
  const stages = result.stages || [];
  const primaryStage = stages[0];

  // Developer color identification
  const getDeveloperCap = (vol: number) => {
    switch (vol) {
      case 10:
        return {
          capColor: "#64748b",
          label: "⚪ GREY CAP • 10 VOL (3%)",
          sublabel: "Grey Cap (10 Vol - Deposit Only)",
          bgClass: "border-slate-500/40 bg-slate-500/10 text-slate-300",
        };
      case 20:
        return {
          capColor: "#2563eb",
          label: "🔵 BLUE CAP • 20 VOL (6%)",
          sublabel: "Blue Cap (20 Vol - Standard 1-2 Level Lift)",
          bgClass: "border-blue-500/40 bg-blue-500/10 text-blue-300",
        };
      case 30:
        return {
          capColor: "#f59e0b",
          label: "🟡 GOLD CAP • 30 VOL (9%)",
          sublabel: "Gold Cap (30 Vol - 2-3 Level Lift)",
          bgClass: "border-amber-500/40 bg-amber-500/10 text-amber-300",
        };
      case 40:
        return {
          capColor: "#dc2626",
          label: "🔴 RED CAP • 40 VOL (12%)",
          sublabel: "Red Cap (40 Vol - Highlift / Blonde)",
          bgClass: "border-rose-500/40 bg-rose-500/10 text-rose-300",
        };
      default:
        return {
          capColor: "#2563eb",
          label: "🔵 BLUE CAP • 20 VOL (6%)",
          sublabel: "Blue Cap (20 Vol - Standard)",
          bgClass: "border-blue-500/40 bg-blue-500/10 text-blue-300",
        };
    }
  };

  const devVol = primaryStage?.developer?.volume_in_vol || 20;
  const devCap = getDeveloperCap(devVol);

  // Scaled product weights
  const scaledProducts = (primaryStage?.products || []).map((p) => {
    const baseG = Number(p.weight_grams) || 30;
    const scaledG = Math.round(baseG * scaleMultiplier * 10) / 10;
    return { ...p, scaledWeight: scaledG };
  });

  const totalColourGrams = scaledProducts.reduce((sum, p) => sum + p.scaledWeight, 0);
  const baseDevGrams = Number(primaryStage?.developer?.weight_grams) || 60;
  const scaledDevGrams = Math.round(baseDevGrams * scaleMultiplier * 10) / 10;
  const totalBowlWeight = Math.round((totalColourGrams + scaledDevGrams) * 10) / 10;

  // Text-to-Speech audio guide for low-literacy users
  const handleSpeakRecipe = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    const brandName = result.manufacturer_name || "Salon Brand";
    const prodList = scaledProducts.map((p) => `${p.scaledWeight} grams of shade ${p.shade_code}`).join(" and ");
    const textToSpeak = `Here is your salon mixing recipe for ${brandName}. Squeeze ${prodList} into your bowl. Then pour ${scaledDevGrams} grams of ${devVol} volume developer with the ${devCap.label.split("•")[0]}. Mix well with brush, apply to hair, and set timer for ${primaryStage?.development_time_minutes || 35} minutes.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleCopyRecipe = async () => {
    const lines = [
      `🥣 SALON MIXING RECIPE (${result.manufacturer_name})`,
      `🎯 Target Look: Level ${targetData.universal_level} ${targetData.primary_tone}`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
      ...scaledProducts.map((p) => `• Colour Tube: ${p.shade_code} ➔ ${p.scaledWeight}g (${p.shade_name || "Fashion Shade"})`),
      `• Developer: ${devCap.label} ➔ ${scaledDevGrams}g (${primaryStage?.mixing_ratio_text || "1:1"} ratio)`,
      `• Total Bowl Weight: ${totalBowlWeight}g`,
      `• Dwell Timer: ${primaryStage?.development_time_minutes || 35} minutes`,
      `━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Quick Header: Batch Size & Voice Assistant */}
      <div className="rounded-3xl border-2 border-amber-500/40 bg-linear-to-b from-neutral-900 to-neutral-950 p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-3xl text-neutral-950 font-black shadow-lg shadow-amber-500/30">
              🥣
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-amber-500/20 px-2 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/40 uppercase">
                  Easy Salon Mode
                </span>
                <span className="text-xs text-neutral-400">•</span>
                <span className="text-xs font-bold text-neutral-300">
                  {result.manufacturer_name || "Salon Brand"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-0.5">
                Target: Level {targetData.universal_level} {targetData.primary_tone}
                {targetData.secondary_tone ? ` / ${targetData.secondary_tone}` : ""}
              </h2>
            </div>
          </div>

          {/* Audio & Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <button
              type="button"
              onClick={handleSpeakRecipe}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black transition-all shadow-md cursor-pointer ${
                speaking
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-emerald-500 hover:bg-emerald-400 text-neutral-950 hover:scale-105"
              }`}
            >
              <span>{speaking ? "⏹️" : "🔊"}</span>
              <span>{speaking ? "Stop Audio" : "Listen Recipe"}</span>
            </button>

            <button
              type="button"
              onClick={handleCopyRecipe}
              className="flex items-center gap-1.5 rounded-2xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 px-3.5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer"
            >
              <span>{copied ? "✓" : "📋"}</span>
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>

            <button
              type="button"
              onClick={onSwitchToChemistView}
              className="flex items-center gap-1.5 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 hover:bg-indigo-500/20 px-3.5 py-2.5 text-xs font-bold text-indigo-300 transition-all cursor-pointer"
              title="Open full chemical calculations, formulas, and safety audits"
            >
              <span>🔬</span>
              <span className="hidden sm:inline">Advanced Chemist View</span>
            </button>
          </div>
        </div>

        {/* Hair Length & Density Selector (Big Tap Buttons) */}
        <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="text-lg">📏</span>
            <div>
              <span className="text-xs font-bold text-white block">
                How much hair does the client have?
              </span>
              <span className="text-[11px] text-neutral-400">
                Tap button below to scale tube and developer automatically:
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setBatchSize(30)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                batchSize === 30
                  ? "bg-amber-500 text-neutral-950 shadow-md scale-105"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              🌱 Roots Only (30g)
            </button>
            <button
              type="button"
              onClick={() => setBatchSize(60)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                batchSize === 60
                  ? "bg-amber-500 text-neutral-950 shadow-md scale-105"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              ✂️ Standard (60g)
            </button>
            <button
              type="button"
              onClick={() => setBatchSize(120)}
              className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                batchSize === 120
                  ? "bg-amber-500 text-neutral-950 shadow-md scale-105"
                  : "bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white"
              }`}
            >
              🦁 Long / Thick (120g)
            </button>
          </div>
        </div>
      </div>

      {/* 2. Visual Sequence: Step 1 -> Step 2 -> Step 3 -> Step 4 -> Step 5 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STEP 1: SCALE TARE & BOWL */}
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xs font-black">
                1
              </span>
              <span>TARE SCALE</span>
            </span>
            <span className="text-xs font-mono font-bold text-neutral-400">Step 1</span>
          </div>

          <div className="my-6 flex flex-col items-center text-center">
            {/* Big Bowl Graphic */}
            <div className="w-28 h-16 rounded-b-full bg-linear-to-b from-neutral-700 via-neutral-800 to-neutral-900 border-4 border-amber-500/80 shadow-2xl flex items-center justify-center relative mb-3">
              <span className="text-3xl">🥣</span>
            </div>

            {/* Digital Tare Display */}
            <div className="w-full max-w-[200px] rounded-2xl bg-black border-2 border-emerald-500/60 p-3 shadow-inner">
              <span className="text-[10px] uppercase font-bold text-neutral-400 block tracking-widest">
                SCALE DISPLAY
              </span>
              <span className="text-3xl font-mono font-black text-emerald-400 block my-1">
                {tared ? "0.0 g" : `${totalBowlWeight} g`}
              </span>
              <span className="text-[10px] text-emerald-300 font-medium">
                {tared ? "✓ TARED READY" : "TOTAL BOWL WEIGHT"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setTared(!tared)}
              className="mt-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 px-4 py-2 text-xs font-bold text-white transition-all cursor-pointer"
            >
              {tared ? "↺ Reset Display" : "👉 Tap to Tare Scale (0.0g)"}
            </button>
          </div>

          <div className="bg-neutral-950/80 p-3 rounded-2xl border border-neutral-800 text-center">
            <p className="text-xs font-bold text-neutral-200">
              Put empty plastic bowl on scale and press TARE to 0.0g.
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Ensure scale displays 0.0g before adding product.
            </p>
          </div>
        </div>

        {/* STEP 2: SQUEEZE TUBE(S) */}
        <div className="rounded-3xl border-2 border-amber-500/50 bg-neutral-900/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xs font-black">
                2
              </span>
              <span>SQUEEZE TUBE</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {totalColourGrams}g Total
            </span>
          </div>

          <div className="my-5 flex flex-wrap items-center justify-center gap-3">
            {scaledProducts.map((p, idx) => (
              <div
                key={idx}
                className="w-32 rounded-2xl bg-linear-to-b from-neutral-800 via-neutral-900 to-amber-950/80 border-2 border-amber-400 p-3 shadow-2xl flex flex-col items-center justify-between text-center relative"
              >
                {/* Tube Cap */}
                <div className="w-10 h-3.5 -mt-5 rounded-t-md bg-neutral-950 border border-neutral-700 shadow" />

                <span className="text-[9px] uppercase font-black text-amber-300 tracking-wider block mt-1">
                  {p.is_pure_natural ? "Grey Coverage Base" : "Fashion Reflect"}
                </span>

                {/* Big Tube Number */}
                <span className="text-2xl font-mono font-black text-white tracking-wider block my-2">
                  {p.shade_code}
                </span>

                {/* Big Weight Badge */}
                <div className="rounded-xl bg-amber-500 text-neutral-950 px-3 py-1 font-mono font-black text-base shadow-md w-full">
                  {p.scaledWeight}g
                </div>

                <span className="text-[10px] text-neutral-300 font-medium mt-2 truncate w-full block">
                  {p.shade_name || "Color Tube"}
                </span>
              </div>
            ))}
          </div>

          <div className="bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30 text-center">
            <span className="text-xs font-black text-amber-300 block">
              Squeeze exactly {totalColourGrams}g of tube into bowl
            </span>
            <span className="text-[11px] text-neutral-300 mt-0.5 block">
              Squeeze precisely according to the target formula.
            </span>
          </div>
        </div>

        {/* STEP 3: POUR DEVELOPER */}
        <div className="rounded-3xl border-2 border-blue-500/50 bg-neutral-900/90 p-6 flex flex-col justify-between shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="flex items-center gap-2 text-xs font-black text-blue-400 uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white text-xs font-black">
                3
              </span>
              <span>POUR DEVELOPER</span>
            </span>
            <span className="text-xs font-mono font-bold text-blue-400">
              {scaledDevGrams}g Total
            </span>
          </div>

          <div className="my-5 flex flex-col items-center text-center">
            {/* Illustrated Developer Bottle */}
            <div className="w-28 rounded-2xl bg-linear-to-b from-neutral-800 via-neutral-900 to-blue-950/80 border-2 border-blue-400 p-3 shadow-2xl flex flex-col items-center text-center relative">
              {/* Bottle Cap with Cap Color */}
              <div
                className="w-12 h-6 -mt-6 rounded-t-lg shadow-lg border border-white/30"
                style={{ backgroundColor: devCap.capColor }}
              />

              <span className="text-[10px] font-black text-blue-300 uppercase tracking-wider block mt-1">
                Developer
              </span>

              <span className="text-3xl font-mono font-black text-white block my-1">
                {devVol}
              </span>
              <span className="text-[10px] font-bold text-blue-200 uppercase block">
                VOLUME
              </span>

              {/* Developer Weight */}
              <div className="rounded-xl bg-blue-500 text-white px-3 py-1 font-mono font-black text-base shadow-md w-full mt-2">
                {scaledDevGrams}g
              </div>
            </div>

            <div className="mt-3">
              <span className={`inline-block rounded-lg px-2.5 py-1 text-xs font-black border ${devCap.bgClass}`}>
                {devCap.label}
              </span>
              <span className="block text-[11px] text-blue-200 mt-1 font-medium">
                {devCap.sublabel}
              </span>
            </div>
          </div>

          <div className="bg-blue-500/10 p-3.5 rounded-2xl border border-blue-500/30 text-center">
            <span className="text-xs font-black text-blue-300 block">
              Pour {scaledDevGrams}g of {devVol} Vol developer into the same bowl
            </span>
            <span className="text-[11px] text-neutral-300 mt-0.5 block">
              Pour directly into bowl onto the color tint.
            </span>
          </div>
        </div>
      </div>

      {/* 3. Application & Giant Countdown Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 4: Mix & Brush Application */}
        <div className="lg:col-span-7 rounded-3xl border border-neutral-800 bg-neutral-900/90 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-neutral-950 text-xs font-black">
              4
            </span>
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              MIX & BRUSH ON HAIR
            </h3>
          </div>

          <div className="my-4 space-y-4">
            {/* Whisk Instruction */}
            <div className="flex items-center gap-3.5 bg-neutral-950/80 p-3.5 rounded-2xl border border-neutral-800">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-neutral-800 text-2xl">
                🥄
              </span>
              <div>
                <h4 className="text-sm font-bold text-white">Whisk Well for 1 Minute</h4>
                <p className="text-xs text-neutral-400 mt-0.5">
                  Mix with hair tint whisk until you get a smooth, creamy butter texture without lumps.
                </p>
              </div>
            </div>

            {/* Brush Zones */}
            <div className="flex items-center gap-3.5 bg-amber-500/10 p-3.5 rounded-2xl border border-amber-500/30">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-2xl border border-amber-500/40">
                🖌️
              </span>
              <div>
                <h4 className="text-sm font-black text-amber-300">
                  Where to Apply:
                </h4>
                <p className="text-xs text-neutral-200 font-semibold mt-0.5">
                  Target: {primaryStage?.target_regions?.join(" + ") || "ROOTS + MID_LENGTHS + ENDS"}
                </p>
                <p className="text-[11px] text-neutral-300 mt-1 leading-relaxed">
                  {primaryStage?.application_instructions || "Apply to roots first in fine sections. Pull through lengths during final 10–15 minutes."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl bg-neutral-950 p-3 text-center border border-neutral-800">
            <span className="text-[11px] text-neutral-400">
              Ratio: <strong>{primaryStage?.mixing_ratio_text || "1:1"}</strong> • Bowl Total: <strong>{totalBowlWeight}g</strong> • No heat required
            </span>
          </div>
        </div>

        {/* Step 5: Giant Salon Countdown Timer */}
        <div className="lg:col-span-5 rounded-3xl border-2 border-emerald-500/40 bg-neutral-900/90 p-6 flex flex-col justify-between shadow-xl">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <span className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-neutral-950 text-xs font-black">
                5
              </span>
              <span>SALON TIMER</span>
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {primaryStage?.development_time_minutes || 35} Min Dwell
            </span>
          </div>

          <div className="my-3">
            <VisualKitchenTimer
              initialMinutes={primaryStage?.development_time_minutes || 35}
            />
          </div>

          <p className="text-[11px] text-center text-neutral-400 mt-2">
            Leave on hair for {primaryStage?.development_time_minutes || 35} min. When timer beeps, rinse with warm water.
          </p>
        </div>
      </div>

      {/* 4. Don't Have This Tube? 1-Tap Cross-Brand Alternatives */}
      <div className="rounded-3xl border-2 border-neutral-800 bg-neutral-900/90 p-6 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">📦</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">
                Don&apos;t have this tube in your salon?
              </h3>
              <p className="text-xs text-neutral-400">
                You can use any of these top alternatives. Tap &quot;Use This Formula&quot; to switch the recipe instantly:
              </p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-3 py-1 rounded-xl border border-amber-500/30 shrink-0">
            {crossBrandCandidates.length} Substitutes Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {crossBrandCandidates.slice(0, 6).map((c, idx) => {
            const isMatch100 = (c.accuracy_percentage ?? 90) >= 95;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 flex flex-col justify-between hover:border-amber-500/50 transition-all shadow-md group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-neutral-800 px-2 py-0.5 text-[10px] font-black text-white">
                      #{idx + 1} {c.manufacturer}
                    </span>
                    <span
                      className={`rounded-lg px-2 py-0.5 text-[10px] font-black border ${
                        isMatch100
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-500/40"
                      }`}
                    >
                      🎯 {c.accuracy_percentage ?? 90}% Match
                    </span>
                  </div>

                  <div className="my-2.5">
                    <span className="text-xl font-mono font-black text-white group-hover:text-amber-400 transition-colors block">
                      {c.shade_code}
                    </span>
                    <span className="text-xs text-neutral-300 font-medium line-clamp-1">
                      {c.shade_name}
                    </span>
                  </div>

                  <p className="text-[11px] text-neutral-400 bg-neutral-900 rounded-xl p-2 border border-neutral-800 leading-snug">
                    {c.substitution_recipe || `Mix 60g ${c.shade_code} + 60g 20 Vol`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectCandidate(c)}
                  className="mt-3.5 w-full rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-black text-xs py-2 transition-all cursor-pointer shadow hover:scale-[1.02] active:scale-95"
                >
                  🥣 Use This Alternative
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
