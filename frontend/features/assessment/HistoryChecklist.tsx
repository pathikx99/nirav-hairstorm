"use client";

import { ClientHistoryInput } from "../../types/assessment";

interface HistoryChecklistProps {
  history: ClientHistoryInput;
  onChange: (updated: ClientHistoryInput) => void;
}

export function HistoryChecklist({ history, onChange }: HistoryChecklistProps) {
  const chemicalServiceOptions = [
    { id: "bleach", label: "Bleach / Highlighting" },
    { id: "permanent_colour", label: "Permanent Oxidative Tint" },
    { id: "relaxer", label: "Chemical Straightener / Relaxer" },
    { id: "perm", label: "Perm / Texturizer" },
    { id: "keratin", label: "Keratin Smoothing" },
  ];

  const handleToggleChemicalService = (serviceId: string) => {
    const current = history.previous_chemical_services;
    const exists = current.includes(serviceId);
    const updated = exists
      ? current.filter((s) => s !== serviceId)
      : [...current, serviceId];
    onChange({ ...history, previous_chemical_services: updated });
  };

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
        <span className="text-rose-500">🛡</span> Client Safety & Chemical History
      </h3>
      <p className="text-xs text-neutral-400 mb-4">
        Mandatory safety screening. Hard contraindications block automated formulation generation.
      </p>

      <div className="space-y-4">
        {/* 1. Allergy History (Hard Contraindication) */}
        <div
          className={`rounded-lg border p-3.5 transition-all ${
            history.has_allergy_history
              ? "border-rose-500/50 bg-rose-500/10 ring-1 ring-rose-500"
              : "border-neutral-800 bg-neutral-950/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <label htmlFor="allergy-history-check" className="text-xs font-bold text-white cursor-pointer">
                History of Allergic Reactions to Hair Dye?
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Critical contraindication: Any prior allergic reaction (swelling, dermatitis, difficulty breathing) strictly prohibits oxidative colour application.
              </p>
            </div>
            <input
              id="allergy-history-check"
              type="checkbox"
              checked={history.has_allergy_history}
              onChange={(e) =>
                onChange({ ...history, has_allergy_history: e.target.checked })
              }
              className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-rose-600 focus:ring-rose-500 cursor-pointer"
            />
          </div>

          {history.has_allergy_history && (
            <div className="mt-3">
              <label htmlFor="allergy-details" className="block text-xs font-semibold text-rose-300 mb-1">
                Allergy Details & Symptoms
              </label>
              <input
                id="allergy-details"
                type="text"
                value={history.allergy_details || ""}
                onChange={(e) =>
                  onChange({ ...history, allergy_details: e.target.value })
                }
                placeholder="e.g. Severe itching and eyelid edema after PPD dye application in 2024"
                className="w-full rounded-md border border-rose-500/40 bg-neutral-900 px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:border-rose-400 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* 2. 48-Hour Allergy Alert Test (AAT) */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <label htmlFor="patch-test-check" className="text-xs font-bold text-white cursor-pointer">
                48-Hour Allergy Alert Test (AAT) Completed with Negative Result?
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Manufacturer safety protocols require skin patch testing 48 hours prior to every oxidative service.
              </p>
            </div>
            <input
              id="patch-test-check"
              type="checkbox"
              checked={history.patch_test_completed_48h}
              onChange={(e) =>
                onChange({ ...history, patch_test_completed_48h: e.target.checked })
              }
              className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* 3. Scalp Condition */}
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5">
          <label htmlFor="scalp-condition-select" className="block text-xs font-bold text-white mb-1">
            Scalp Condition Assessment
          </label>
          <span id="scalp-hint" className="block text-[11px] text-neutral-400 mb-2">
            Active abrasions or lesions prohibit chemical application.
          </span>
          <select
            id="scalp-condition-select"
            value={history.scalp_condition}
            onChange={(e) =>
              onChange({ ...history, scalp_condition: e.target.value })
            }
            aria-describedby="scalp-hint"
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="normal">Normal (Intact, non-reactive)</option>
            <option value="sensitive">Sensitive (Prone to mild tingling)</option>
            <option value="irritated">Irritated (Redness / itchiness present)</option>
            <option value="broken_skin">Broken Skin / Abrasions (CONTRAINDICATED)</option>
          </select>
        </div>

        {/* 4. Chemical Incompatibilities */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label htmlFor="henna-check" className="text-xs font-semibold text-white cursor-pointer">
                  Henna / Metallic Salts?
                </label>
                <p className="text-[10px] text-neutral-400">
                  Risk of exothermic heat reaction with lighteners.
                </p>
              </div>
              <input
                id="henna-check"
                type="checkbox"
                checked={history.has_metallic_salts_or_henna}
                onChange={(e) =>
                  onChange({ ...history, has_metallic_salts_or_henna: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-amber-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <label htmlFor="lye-relaxer-check" className="text-xs font-semibold text-white cursor-pointer">
                  Sodium Hydroxide (Lye) Relaxer?
                </label>
                <p className="text-[10px] text-neutral-400">
                  Strictly contraindicated with bleach.
                </p>
              </div>
              <input
                id="lye-relaxer-check"
                type="checkbox"
                checked={history.has_sodium_hydroxide_relaxer}
                onChange={(e) =>
                  onChange({ ...history, has_sodium_hydroxide_relaxer: e.target.checked })
                }
                className="h-4 w-4 rounded border-neutral-700 bg-neutral-800 text-rose-600 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* 5. Previous Chemical Services */}
        <div>
          <label className="block text-xs font-semibold text-neutral-300 mb-2">
            Prior Chemical Services History
          </label>
          <div className="flex flex-wrap gap-2">
            {chemicalServiceOptions.map((opt) => {
              const active = history.previous_chemical_services.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleToggleChemicalService(opt.id)}
                  className={`rounded-md border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? "border-amber-500 bg-amber-500/10 text-amber-300"
                      : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
                  }`}
                >
                  {opt.label} {active && "✓"}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
