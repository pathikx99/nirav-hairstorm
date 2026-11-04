"use client";

import { ProcessMode } from "../../types/formulation";
import { Manufacturer } from "../../types/manufacturer";

interface ModeSelectorProps {
  mode: ProcessMode;
  selectedManufacturerId: string;
  manufacturers: Manufacturer[];
  onModeChange: (mode: ProcessMode) => void;
  onManufacturerChange: (id: string) => void;
}

export function ModeSelector({
  mode,
  selectedManufacturerId,
  manufacturers,
  onModeChange,
  onManufacturerChange,
}: ModeSelectorProps) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
      <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
        <span>⚙️</span> Colourist Workflow Operating Mode
      </h3>
      <p className="text-xs text-neutral-400 mb-4">
        Choose single preferred manufacturer formulation or cross-brand visual & chemical comparison.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Preferred Manufacturer Mode */}
        <button
          type="button"
          onClick={() => onModeChange("PREFERRED_MANUFACTURER")}
          className={`rounded-xl border p-4 text-left transition-all ${
            mode === "PREFERRED_MANUFACTURER"
              ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
              : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Preferred Manufacturer Mode</span>
            {mode === "PREFERRED_MANUFACTURER" && (
              <span className="text-amber-400 text-xs font-bold">Active</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 leading-normal">
            Generate concrete, single-brand salon mixing instructions, developer ratios, and processing times for your salon&apos;s primary inventory.
          </p>
        </button>

        {/* Cross-Brand Comparison Mode */}
        <button
          type="button"
          onClick={() => onModeChange("CROSS_BRAND_COMPARISON")}
          className={`rounded-xl border p-4 text-left transition-all ${
            mode === "CROSS_BRAND_COMPARISON"
              ? "border-indigo-500 bg-indigo-500/10 text-white ring-1 ring-indigo-500"
              : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold">Cross-Brand Comparison Mode</span>
            {mode === "CROSS_BRAND_COMPARISON" && (
              <span className="text-indigo-400 text-xs font-bold">Active</span>
            )}
          </div>
          <p className="text-xs text-neutral-400 leading-normal">
            Compare candidate matches across Wella Professionals and L&apos;Oréal Professionnel, exposing differences in mixing ratios, developer bases, and tonal nomenclature.
          </p>
        </button>
      </div>

      {/* Manufacturer Dropdown for Preferred Mode */}
      {mode === "PREFERRED_MANUFACTURER" && (
        <div className="rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5">
          <label htmlFor="select-mfg" className="block text-xs font-semibold text-neutral-300 mb-1">
            Select Primary Salon Brand
          </label>
          <select
            id="select-mfg"
            value={selectedManufacturerId}
            onChange={(e) => onManufacturerChange(e.target.value)}
            className="w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            {manufacturers.length > 0 ? (
              manufacturers.map((m) => {
                const marketsLabel = Array.isArray(m.supported_markets)
                  ? m.supported_markets.join(", ")
                  : m.supported_markets && typeof m.supported_markets === "object"
                  ? Object.keys(m.supported_markets).join(", ")
                  : "";
                return (
                  <option key={m.id} value={m.id}>
                    {m.name}{marketsLabel ? ` (${marketsLabel})` : ""}
                  </option>
                );
              })
            ) : (
              <>
                <option value="wella-india-id">Wella Professionals India</option>
                <option value="loreal-india-id">L&apos;Oréal Professionnel India</option>
              </>
            )}
          </select>
        </div>
      )}
    </div>
  );
}
