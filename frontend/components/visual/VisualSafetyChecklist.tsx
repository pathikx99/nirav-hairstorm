"use client";

import React from "react";
import { ClientHistoryInput } from "../../types/assessment";

interface VisualSafetyChecklistProps {
  history: ClientHistoryInput;
  onChange: (updated: ClientHistoryInput) => void;
}

export function VisualSafetyChecklist({
  history,
  onChange,
}: VisualSafetyChecklistProps) {
  const handleToggleHenna = (val: boolean) => {
    onChange({ ...history, has_metallic_salts_or_henna: val });
  };

  const handleToggleAllergy = (val: boolean) => {
    onChange({ ...history, has_allergy_history: val });
  };

  const handleTogglePatchTest = (val: boolean) => {
    onChange({ ...history, patch_test_completed_48h: val });
  };

  const handleToggleBleach = (val: boolean) => {
    const current = history.previous_chemical_services;
    const exists = current.includes("bleach");
    const updated = val
      ? exists
        ? current
        : [...current, "bleach"]
      : current.filter((s) => s !== "bleach");
    onChange({ ...history, previous_chemical_services: updated });
  };

  const handleToggleRelaxer = (val: boolean) => {
    onChange({ ...history, has_sodium_hydroxide_relaxer: val });
  };

  const isBleached = history.previous_chemical_services.includes("bleach");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div>
          <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
            <span className="text-rose-500">🛡️</span> Customer Safety & Chemical History
          </h3>
          <p className="text-xs text-neutral-400 mt-0.5">
            Select YES or NO for each client safety checkpoint
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. MEHENDI / HENNA CHECK */}
        <div
          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
            history.has_metallic_salts_or_henna
              ? "border-rose-500 bg-rose-500/15 ring-2 ring-rose-500"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-900/40 border border-amber-600/40 text-2xl shadow-inner">
                🌿
              </span>
              <div>
                <span className="text-sm font-bold text-white block">
                  Henna / Herbal Colour?
                </span>
                <span className="text-xs text-amber-300 font-medium block">
                  Has the client used Henna, Mehendi, or metallic salt dyes?
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleToggleHenna(true)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                history.has_metallic_salts_or_henna
                  ? "bg-rose-600 text-white shadow-lg ring-2 ring-rose-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>⚠️</span> YES (Henna Used)
            </button>
            <button
              type="button"
              onClick={() => handleToggleHenna(false)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !history.has_metallic_salts_or_henna
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✓</span> NO (Clean Hair)
            </button>
          </div>
        </div>

        {/* 2. DYE ALLERGY / ITCHING */}
        <div
          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
            history.has_allergy_history
              ? "border-rose-600 bg-rose-600/20 ring-2 ring-rose-600"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-900/40 border border-rose-600/40 text-2xl shadow-inner">
                🛑
              </span>
              <div>
                <span className="text-sm font-bold text-white block">
                  Dye Reaction / Allergy?
                </span>
                <span className="text-xs text-rose-300 font-medium block">
                  Has the client ever experienced itching, swelling, or dye allergy?
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleToggleAllergy(true)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                history.has_allergy_history
                  ? "bg-rose-600 text-white shadow-lg ring-2 ring-rose-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>🛑</span> YES (Allergy History)
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllergy(false)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !history.has_allergy_history
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✓</span> NO (No Allergy)
            </button>
          </div>
        </div>

        {/* 3. PREVIOUS BLEACH / BLONDE */}
        <div
          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
            isBleached
              ? "border-amber-500 bg-amber-500/15 ring-2 ring-amber-500"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-900/40 border border-amber-600/40 text-2xl shadow-inner">
                ✂️
              </span>
              <div>
                <span className="text-sm font-bold text-white block">
                  Previous Bleach / Lightener?
                </span>
                <span className="text-xs text-amber-300 font-medium block">
                  Has the hair been previously bleached, pre-lightened, or highlighted?
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleToggleBleach(true)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                isBleached
                  ? "bg-amber-500 text-neutral-950 shadow-lg ring-2 ring-amber-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✂️</span> YES (Bleached)
            </button>
            <button
              type="button"
              onClick={() => handleToggleBleach(false)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !isBleached
                  ? "bg-neutral-700 text-white shadow-lg scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✓</span> NO (Unbleached)
            </button>
          </div>
        </div>

        {/* 4. CHEMICAL RELAXER / REBONDING */}
        <div
          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
            history.has_sodium_hydroxide_relaxer
              ? "border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-900/40 border border-indigo-600/40 text-2xl shadow-inner">
                🧴
              </span>
              <div>
                <span className="text-sm font-bold text-white block">
                  Rebonding / Chemical Relaxer?
                </span>
                <span className="text-xs text-indigo-300 font-medium block">
                  Has the client had chemical straightening, relaxing, or rebonding?
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleToggleRelaxer(true)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                history.has_sodium_hydroxide_relaxer
                  ? "bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>🧴</span> YES (Relaxed / Rebonded)
            </button>
            <button
              type="button"
              onClick={() => handleToggleRelaxer(false)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !history.has_sodium_hydroxide_relaxer
                  ? "bg-neutral-700 text-white shadow-lg scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✓</span> NO (Natural Texture)
            </button>
          </div>
        </div>

        {/* 5. 48-HOUR PATCH TEST (ALLERGY ALERT TEST) */}
        <div
          className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
            history.patch_test_completed_48h
              ? "border-emerald-500 bg-emerald-500/10"
              : "border-neutral-800 bg-neutral-900/60"
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-900/40 border border-emerald-600/40 text-2xl shadow-inner">
                👂
              </span>
              <div>
                <span className="text-sm font-bold text-white block">
                  48-Hour Patch Test Done?
                </span>
                <span className="text-xs text-emerald-300 font-medium block">
                  Has a 48-hour patch / skin allergy test been completed?
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            <button
              type="button"
              onClick={() => handleTogglePatchTest(true)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                history.patch_test_completed_48h
                  ? "bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>✓</span> YES (Test Passed)
            </button>
            <button
              type="button"
              onClick={() => handleTogglePatchTest(false)}
              className={`py-3 px-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                !history.patch_test_completed_48h
                  ? "bg-amber-600 text-white shadow-lg ring-2 ring-amber-300 scale-[1.02]"
                  : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
              }`}
            >
              <span>⏳</span> NO (Pending Test)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
