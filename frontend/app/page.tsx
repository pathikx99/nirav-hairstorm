"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "../context/AppContext";
import { HairAssessmentInput } from "../types/assessment";
import { TargetColourInput } from "../types/formulation";

export default function HomePage() {
  const router = useRouter();
  const { mode } = useApp();

  const handleStartNewHairCheck = () => {
    try {
      const initialAssessment: HairAssessmentInput = {
        market: "IN",
        roots: { region: "ROOTS", observed_level: 1, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true },
        mid_lengths: { region: "MID_LENGTHS", observed_level: 1, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        ends: { region: "ENDS", observed_level: 1, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        history: { has_allergy_history: false, patch_test_completed_48h: true, scalp_condition: "normal", previous_chemical_services: [], has_metallic_salts_or_henna: false, has_sodium_hydroxide_relaxer: false },
      };
      localStorage.setItem("nh_hair_assessment", JSON.stringify(initialAssessment));
    } catch {
      // ignore
    }
  };

  const handleLaunchPreset = (type: "CARAMEL" | "GREY" | "COPPER" | "BURGUNDY") => {
        let startingAssessment: HairAssessmentInput;
    let targetColour: TargetColourInput;

    if (type === "CARAMEL") {
            startingAssessment = {
        market: "IN",
        roots: { region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true },
        mid_lengths: { region: "MID_LENGTHS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        ends: { region: "ENDS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        history: { has_allergy_history: false, patch_test_completed_48h: true, scalp_condition: "normal", previous_chemical_services: [], has_metallic_salts_or_henna: false, has_sodium_hydroxide_relaxer: false },
      };
      targetColour = { universal_level: 7, primary_tone: "GOLD", secondary_tone: "COPPER", tone_intensity: "STANDARD" };
    } else if (type === "GREY") {
            startingAssessment = {
        market: "IN",
        roots: { region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 50, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true },
        mid_lengths: { region: "MID_LENGTHS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 15, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        ends: { region: "ENDS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        history: { has_allergy_history: false, patch_test_completed_48h: true, scalp_condition: "normal", previous_chemical_services: [], has_metallic_salts_or_henna: false, has_sodium_hydroxide_relaxer: false },
      };
      targetColour = { universal_level: 5, primary_tone: "NATURAL", secondary_tone: "GOLD", tone_intensity: "STANDARD" };
    } else if (type === "COPPER") {
            startingAssessment = {
        market: "IN",
        roots: { region: "ROOTS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true },
        mid_lengths: { region: "MID_LENGTHS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        ends: { region: "ENDS", observed_level: 4, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        history: { has_allergy_history: false, patch_test_completed_48h: true, scalp_condition: "normal", previous_chemical_services: [], has_metallic_salts_or_henna: false, has_sodium_hydroxide_relaxer: false },
      };
      targetColour = { universal_level: 7, primary_tone: "COPPER", secondary_tone: "GOLD", tone_intensity: "STANDARD" };
    } else {
            startingAssessment = {
        market: "IN",
        roots: { region: "ROOTS", observed_level: 3, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: true, colourist_confirmed: true },
        mid_lengths: { region: "MID_LENGTHS", observed_level: 3, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        ends: { region: "ENDS", observed_level: 3, observed_undertone: "NATURAL", existing_artificial_colour: false, grey_percentage: 0, porosity: "NORMAL", condition: "HEALTHY", is_on_scalp: false, colourist_confirmed: true },
        history: { has_allergy_history: false, patch_test_completed_48h: true, scalp_condition: "normal", previous_chemical_services: [], has_metallic_salts_or_henna: false, has_sodium_hydroxide_relaxer: false },
      };
      targetColour = { universal_level: 5, primary_tone: "RED", secondary_tone: "VIOLET", tone_intensity: "STANDARD" };
    }

    try {
      localStorage.setItem("nh_hair_assessment", JSON.stringify(startingAssessment));
      localStorage.setItem("nh_target_colour", JSON.stringify(targetColour));
      localStorage.setItem("nh_process_mode", "PREFERRED_MANUFACTURER");
      localStorage.setItem("nh_manufacturer_id", "531e1113-7fe3-4c6e-a106-96d13f3b3e1d");
    } catch {
      // ignore
    }

    router.push("/formulation");
  };

  const principles = [
    {
      num: "01",
      title: "No Universal Shade Numbers",
      desc: "Manufacturer shade numbers are never treated as universal identifiers; original codes are preserved verbatim (e.g. 7/1 vs 7.1).",
    },
    {
      num: "04",
      title: "No Chemical Equivalence Assumption",
      desc: "Similar visual colour does not establish chemical or formulation equivalence across different manufacturers.",
    },
    {
      num: "06",
      title: "Unverified Data Invariant",
      desc: "Unverified data must never generate executable formulations. Missing information remains explicitly unknown.",
    },
    {
      num: "08",
      title: "Independent Region Assessment",
      desc: "Roots, mid-lengths, and ends are independently assessable and formulate distinct regional chemical requirements.",
    },
  ];

  if (mode === "STYLIST") {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {/* Salon Stylist Hero */}
        <section className="relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-neutral-900 via-neutral-900 to-neutral-950 p-5 sm:p-8 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
                <span>✨</span> Salon Edition • Professional Hair Color Made Simple
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white leading-tight">
                Welcome! Start a New Hair Color Formulation
              </h1>
              <p className="text-xs sm:text-sm text-neutral-300">
                Assess client hair, select their target look, and get the exact scale formula and step-by-step instructions.
              </p>
            </div>
          </div>

          {/* Giant Primary Action Cards */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href="/starting-hair"
              onClick={handleStartNewHairCheck}
              className="group flex flex-col justify-between rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/20 to-neutral-900/80 p-6 shadow-xl hover:border-amber-400 hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500 text-neutral-950 text-3xl shadow-lg shadow-amber-500/30 group-hover:rotate-6 transition-transform">
                  📸
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                    Step 1 • Hair Assessment
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    New Customer Hair Check
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Check client hair level, grey %, and history
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-amber-500/20">
                <span className="text-xs font-bold text-amber-300">
                  Touch to start hair check
                </span>
                <span className="rounded-xl bg-amber-500 px-4 py-2 font-black text-xs text-neutral-950 group-hover:bg-amber-400 transition-colors">
                  START ➔
                </span>
              </div>
            </Link>

            <Link
              href="/target-colour"
              className="group flex flex-col justify-between rounded-3xl border-2 border-rose-500/50 bg-gradient-to-br from-rose-500/20 to-neutral-900/80 p-6 shadow-xl hover:border-rose-400 hover:scale-[1.02] transition-all"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500 text-white text-3xl shadow-lg shadow-rose-500/30 group-hover:rotate-6 transition-transform">
                  🎨
                </span>
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400">
                    Step 2 • Choose Target Look
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    Pick Hair Look / Shade
                  </h2>
                  <p className="text-xs text-neutral-300 mt-0.5">
                    Select desired shade from the color wheel or lookbook
                  </p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between pt-4 border-t border-rose-500/20">
                <span className="text-xs font-bold text-rose-300">
                  Touch to view lookbook
                </span>
                <span className="rounded-xl bg-rose-500 px-4 py-2 font-black text-xs text-white group-hover:bg-rose-400 transition-colors">
                  CHOOSE ➔
                </span>
              </div>
            </Link>
          </div>
        </section>

        {/* 1-Click Popular Salon Transformations */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <span>🚀</span> 1-Click Salon Quick Recipes
            </h2>
            <span className="text-xs text-neutral-400">
              Tap any popular look to load assessment + recipe in 1 click
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Caramel Balayage */}
            <button
              type="button"
              onClick={() => handleLaunchPreset("CARAMEL")}
              className="group text-left p-4.5 rounded-3xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-400 hover:bg-neutral-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-black">
                    🌟
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    7/34 Caramel
                  </span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  Warm Caramel Glow
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Natural Level 4 ➔ Sunlit Level 7 Caramel
                </p>
              </div>
              <span className="mt-3 text-[10px] font-black uppercase text-amber-400 group-hover:underline">
                Get 1-Click Recipe ➔
              </span>
            </button>

            {/* 2. 100% Grey Coverage */}
            <button
              type="button"
              onClick={() => handleLaunchPreset("GREY")}
              className="group text-left p-4.5 rounded-3xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-400 hover:bg-neutral-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-black">
                    👵
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    5/7 + 5/0
                  </span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  100% Grey Touch-Up
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  50% Grey Roots ➔ Rich Chocolate Mocha
                </p>
              </div>
              <span className="mt-3 text-[10px] font-black uppercase text-amber-400 group-hover:underline">
                Get 1-Click Recipe ➔
              </span>
            </button>

            {/* 3. Fiery Copper */}
            <button
              type="button"
              onClick={() => handleLaunchPreset("COPPER")}
              className="group text-left p-4.5 rounded-3xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-400 hover:bg-neutral-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-black">
                    🍂
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    7/43 Copper
                  </span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  Fiery Cinnamon Copper
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Level 4 ➔ Bright Auburn Copper
                </p>
              </div>
              <span className="mt-3 text-[10px] font-black uppercase text-amber-400 group-hover:underline">
                Get 1-Click Recipe ➔
              </span>
            </button>

            {/* 4. Deep Burgundy Wine */}
            <button
              type="button"
              onClick={() => handleLaunchPreset("BURGUNDY")}
              className="group text-left p-4.5 rounded-3xl border border-neutral-800 bg-neutral-900/70 hover:border-amber-400 hover:bg-neutral-800 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="h-8 w-8 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm font-black">
                    🍷
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
                    5/46 Burgundy
                  </span>
                </div>
                <h4 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  Deep Wine Burgundy
                </h4>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  Level 3 Natural Black ➔ Festive Wine Red
                </p>
              </div>
              <span className="mt-3 text-[10px] font-black uppercase text-amber-400 group-hover:underline">
                Get 1-Click Recipe ➔
              </span>
            </button>
          </div>
        </section>

        {/* 3 Simple Visual Steps */}
        <section className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <span>⚡</span> Three Easy Steps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/20 text-2xl text-amber-400 border border-amber-500/30">
                1️⃣
              </span>
              <h3 className="text-base font-black text-white">
                1. Select Hair Zones
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Choose the hair zones: roots, mid-lengths, and ends. Flag any henna or previous color.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/20 text-2xl text-rose-400 border border-rose-500/30">
                2️⃣
              </span>
              <h3 className="text-base font-black text-white">
                2. Tap Your Favorite Look
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Select the client target look from 40+ salon catalog shades or the color wheel.
              </p>
            </div>

            <div className="rounded-3xl border border-neutral-800 bg-neutral-900/60 p-6 space-y-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-2xl text-indigo-400 border border-indigo-500/30">
                3️⃣
              </span>
              <h3 className="text-base font-black text-white">
                3. Follow Visual Recipe
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Weigh tube and developer grams on your digital scale, apply with brush, and start the timer.
              </p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Chemist / Technical Mode (Preserves 100% of the scientific specification)
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-12">
      {/* Hero Header */}
      <section className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-400">
            <span>✨</span> Technical Chemist View — Market: India
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Universal Hair Colour Intelligence Platform
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 leading-relaxed">
            Nirav Hairstorm bridges manufacturer-independent colour science (UHCR v1) with manufacturer-specific technical systems. Evaluate starting hair conditions, predict chemical feasibility, and generate deterministic, constraint-based formulations.
          </p>

          <div className="pt-4 flex flex-wrap gap-4">
            <Link
              href="/starting-hair"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
            >
              Start Hair Assessment <span>→</span>
            </Link>
            <Link
              href="/target-colour"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 px-5 py-3 text-sm font-bold text-white transition-all"
            >
              Select Target Look
            </Link>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <span>📜</span> Foundational Chemical Invariants
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {principles.map((p) => (
            <div
              key={p.num}
              className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5 space-y-2"
            >
              <span className="font-mono text-xs text-amber-400 font-bold">
                Principle {p.num}
              </span>
              <h3 className="font-bold text-white text-sm">{p.title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
