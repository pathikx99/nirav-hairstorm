"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ProcessMode, TargetColourInput } from "../../types/formulation";
import { Manufacturer } from "../../types/manufacturer";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { LevelSelector } from "../../features/colour-selection/LevelSelector";
import { ToneSelector } from "../../features/colour-selection/ToneSelector";
import { ModeSelector } from "../../features/colour-selection/ModeSelector";
import { getManufacturers } from "../../services/formulationService";

export default function TargetColourPage() {
  const router = useRouter();

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

  const [mode, setMode] = useState<ProcessMode>(() => {
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
  const [selectedManufacturerId, setSelectedManufacturerId] = useState<string>("");

  useEffect(() => {
    // Load manufacturers
    async function loadMfgs() {
      try {
        const list = await getManufacturers();
        setManufacturers(list);
        if (list.length > 0) {
          setSelectedManufacturerId(list[0].id);
        }
      } catch {
        // Fallback demo mock if backend isn't reachable during offline mode
        const mock: Manufacturer[] = [
          {
            id: "wella-india-id",
            name: "Wella Professionals India",
            slug: "wella-india",
            supported_markets: ["IN"],
            status: "ACTIVE",
          },
          {
            id: "loreal-india-id",
            name: "L'Oréal Professionnel India",
            slug: "loreal-india",
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
      localStorage.setItem("nh_process_mode", mode);
      localStorage.setItem("nh_manufacturer_id", selectedManufacturerId);
    } catch {
      // ignore
    }

    router.push("/formulation");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-bold text-rose-500 uppercase tracking-widest">
            Step 2 of 3
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Target Colour Definition
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Universal target specification (UHCR v1 §2.2) independent of brand shade codes.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-800 bg-neutral-900/80 px-4 py-2 text-right">
          <span className="text-[10px] text-neutral-500 uppercase font-bold block">
            Target Summary
          </span>
          <span className="text-sm font-bold text-amber-400 font-mono">
            Level {level} {primaryTone}
            {secondaryTone ? ` / ${secondaryTone}` : ""}
          </span>
        </div>
      </div>

      {/* Depth Level Selector */}
      <LevelSelector selectedLevel={level} onChange={setLevel} />

      {/* Tone & Reflect Selectors */}
      <ToneSelector
        primaryTone={primaryTone}
        secondaryTone={secondaryTone}
        toneIntensity={toneIntensity}
        onPrimaryToneChange={setPrimaryTone}
        onSecondaryToneChange={setSecondaryTone}
        onToneIntensityChange={setToneIntensity}
      />

      {/* Operating Mode Selector */}
      <ModeSelector
        mode={mode}
        selectedManufacturerId={selectedManufacturerId}
        manufacturers={manufacturers}
        onModeChange={setMode}
        onManufacturerChange={setSelectedManufacturerId}
      />

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-neutral-800">
        <button
          type="button"
          onClick={() => router.push("/starting-hair")}
          className="rounded-xl border border-neutral-800 px-5 py-2.5 text-xs font-semibold text-neutral-300 hover:bg-neutral-900 transition-colors"
        >
          ← Back to Starting Hair
        </button>

        <button
          type="button"
          onClick={handleProceedToFormulation}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-6 py-3 text-sm font-bold text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02]"
        >
          Evaluate Formulation Intelligence <span>→</span>
        </button>
      </div>
    </div>
  );
}
