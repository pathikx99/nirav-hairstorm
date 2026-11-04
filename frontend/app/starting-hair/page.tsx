"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ClientHistoryInput,
  HairAssessmentInput,
  HairRegionInput,
} from "../../types/assessment";
import { RegionAssessmentCard } from "../../features/assessment/RegionAssessmentCard";
import { HistoryChecklist } from "../../features/assessment/HistoryChecklist";
import { PhotoAnalysisModal } from "../../features/assessment/PhotoAnalysisModal";

export default function StartingHairPage() {
  const router = useRouter();
  const [photoModalOpen, setPhotoModalOpen] = useState(false);

  const [roots, setRoots] = useState<HairRegionInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_hair_assessment");
        if (saved) {
          const parsed: HairAssessmentInput = JSON.parse(saved);
          if (parsed.roots) return parsed.roots;
        }
      } catch {
        // ignore
      }
    }
    return {
      region: "ROOTS",
      observed_level: 5,
      observed_undertone: "NATURAL",
      existing_artificial_colour: false,
      grey_percentage: 0,
      porosity: "NORMAL",
      condition: "HEALTHY",
      is_on_scalp: true,
      colourist_confirmed: true,
    };
  });

  const [midLengths, setMidLengths] = useState<HairRegionInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_hair_assessment");
        if (saved) {
          const parsed: HairAssessmentInput = JSON.parse(saved);
          if (parsed.mid_lengths) return parsed.mid_lengths;
        }
      } catch {
        // ignore
      }
    }
    return {
      region: "MID_LENGTHS",
      observed_level: 5,
      observed_undertone: "NATURAL",
      existing_artificial_colour: false,
      grey_percentage: 0,
      porosity: "NORMAL",
      condition: "HEALTHY",
      is_on_scalp: false,
      colourist_confirmed: true,
    };
  });

  const [ends, setEnds] = useState<HairRegionInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_hair_assessment");
        if (saved) {
          const parsed: HairAssessmentInput = JSON.parse(saved);
          if (parsed.ends) return parsed.ends;
        }
      } catch {
        // ignore
      }
    }
    return {
      region: "ENDS",
      observed_level: 5,
      observed_undertone: "NATURAL",
      existing_artificial_colour: false,
      grey_percentage: 0,
      porosity: "NORMAL",
      condition: "HEALTHY",
      is_on_scalp: false,
      colourist_confirmed: true,
    };
  });

  const [history, setHistory] = useState<ClientHistoryInput>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("nh_hair_assessment");
        if (saved) {
          const parsed: HairAssessmentInput = JSON.parse(saved);
          if (parsed.history) return parsed.history;
        }
      } catch {
        // ignore
      }
    }
    return {
      has_allergy_history: false,
      allergy_details: null,
      patch_test_completed_48h: true,
      scalp_condition: "normal",
      previous_chemical_services: [],
      has_metallic_salts_or_henna: false,
      has_sodium_hydroxide_relaxer: false,
    };
  });

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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">
            Step 1 of 3
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

      {/* Photo Assessment Modal */}
      <PhotoAnalysisModal
        isOpen={photoModalOpen}
        onClose={() => setPhotoModalOpen(false)}
        onApplyPredictions={handleApplyPhotoPredictions}
      />
    </div>
  );
}
