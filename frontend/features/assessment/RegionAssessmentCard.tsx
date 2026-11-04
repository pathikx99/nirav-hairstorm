"use client";

import { HairRegionInput, HairCondition, Porosity } from "../../types/assessment";
import { ToneFamily, UniversalLevel } from "../../types/uhcr";
import { LevelSwatch } from "../../components/LevelSwatch";
import { ToneChip } from "../../components/ToneChip";

interface RegionAssessmentCardProps {
  title: string;
  subtitle: string;
  region: HairRegionInput;
  onChange: (updated: HairRegionInput) => void;
}

export function RegionAssessmentCard({
  title,
  subtitle,
  region,
  onChange,
}: RegionAssessmentCardProps) {
  const levels: UniversalLevel[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const tones: ToneFamily[] = [
    "NATURAL",
    "ASH",
    "GOLD",
    "COPPER",
    "RED",
    "VIOLET",
    "PEARL",
    "BEIGE",
  ];

  return (
    <fieldset className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5 shadow-sm transition-all hover:border-neutral-700">
      <legend className="px-2 text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        {title}
      </legend>
      <p className="text-xs text-neutral-400 mb-4">{subtitle}</p>

      {/* Observed Depth Level */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-semibold text-neutral-300">
            Observed Depth (Level 1–10)
          </label>
          <span className="text-xs text-amber-400 font-mono font-bold">
            Selected: Level {region.observed_level}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {levels.map((lvl) => (
            <LevelSwatch
              key={lvl}
              level={lvl}
              selected={region.observed_level === lvl}
              onClick={(l) => onChange({ ...region, observed_level: l })}
              size="sm"
            />
          ))}
        </div>
      </div>

      {/* Observed Undertone */}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-neutral-300 mb-2">
          Observed Underlying Tone / Reflect
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tones.map((t) => (
            <ToneChip
              key={t}
              tone={t}
              selected={region.observed_undertone === t}
              onClick={(tn) => onChange({ ...region, observed_undertone: tn })}
              showReflect={false}
            />
          ))}
        </div>
      </div>

      {/* Chemical State: Existing Artificial Colour */}
      <div className="mb-5 rounded-lg border border-neutral-800 bg-neutral-950/60 p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <label
              htmlFor={`artificial-colour-${region.region}`}
              className="text-xs font-bold text-white cursor-pointer"
            >
              Existing Artificial Colour Present?
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Critical chemical rule: <em>Color does not lift color</em>. Lighter targets over artificial dye require cleansing or bleaching.
            </p>
          </div>
          <input
            id={`artificial-colour-${region.region}`}
            type="checkbox"
            checked={region.existing_artificial_colour}
            onChange={(e) =>
              onChange({ ...region, existing_artificial_colour: e.target.checked })
            }
            className="h-5 w-5 rounded border-neutral-700 bg-neutral-800 text-amber-600 focus:ring-amber-500 cursor-pointer"
          />
        </div>
      </div>

      {/* Grey Hair Percentage Slider */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1">
          <label
            htmlFor={`grey-slider-${region.region}`}
            className="text-xs font-semibold text-neutral-300"
          >
            Unpigmented / White Hair Percentage
          </label>
          <span className="text-xs font-mono font-bold text-neutral-200">
            {region.grey_percentage}%
          </span>
        </div>
        <span id={`grey-hint-${region.region}`} className="block text-[11px] text-neutral-500 mb-2">
          $\ge 30\%$ triggers 1/3 Pure Naturals; $\ge 50\%$ triggers 1/2 Pure Naturals in the formula.
        </span>
        <input
          id={`grey-slider-${region.region}`}
          type="range"
          min="0"
          max="100"
          step="5"
          value={region.grey_percentage}
          onChange={(e) =>
            onChange({ ...region, grey_percentage: Number(e.target.value) })
          }
          aria-describedby={`grey-hint-${region.region}`}
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
        <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
          <span>0% (Virgin tone)</span>
          <span>30% (Coverage mix)</span>
          <span>50%+ (Opaque base)</span>
          <span>100%</span>
        </div>
      </div>

      {/* Fiber Condition and Cuticle Porosity */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor={`condition-${region.region}`}
            className="block text-xs font-semibold text-neutral-300 mb-1"
          >
            Fiber Condition
          </label>
          <select
            id={`condition-${region.region}`}
            value={region.condition}
            onChange={(e) =>
              onChange({ ...region, condition: e.target.value as HairCondition })
            }
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="VIRGIN">VIRGIN (Never chemically altered)</option>
            <option value="HEALTHY">HEALTHY (Normal resilience)</option>
            <option value="MODERATELY_DAMAGED">MODERATELY DAMAGED (Porosity visible)</option>
            <option value="SEVERELY_DAMAGED">SEVERELY DAMAGED (Contraindicated for bleach)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor={`porosity-${region.region}`}
            className="block text-xs font-semibold text-neutral-300 mb-1"
          >
            Cuticle Porosity
          </label>
          <select
            id={`porosity-${region.region}`}
            value={region.porosity}
            onChange={(e) =>
              onChange({ ...region, porosity: e.target.value as Porosity })
            }
            className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="LOW">LOW (Compact cuticle, resistant)</option>
            <option value="NORMAL">NORMAL (Even absorption)</option>
            <option value="HIGH">HIGH (Open cuticle, fast grab)</option>
            <option value="EXTREME">EXTREME (Fragile, requires filler/gloss)</option>
          </select>
        </div>
      </div>
    </fieldset>
  );
}
