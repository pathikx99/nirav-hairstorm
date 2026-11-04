"use client";

import { ToneChip } from "../../components/ToneChip";
import { ToneFamily, ToneIntensity } from "../../types/uhcr";

interface ToneSelectorProps {
  primaryTone: ToneFamily;
  secondaryTone?: ToneFamily | null;
  toneIntensity: ToneIntensity;
  onPrimaryToneChange: (tone: ToneFamily) => void;
  onSecondaryToneChange: (tone: ToneFamily | null) => void;
  onToneIntensityChange: (intensity: ToneIntensity) => void;
}

export function ToneSelector({
  primaryTone,
  secondaryTone,
  toneIntensity,
  onPrimaryToneChange,
  onSecondaryToneChange,
  onToneIntensityChange,
}: ToneSelectorProps) {
  const tones: ToneFamily[] = [
    "NATURAL",
    "ASH",
    "BLUE",
    "GREEN",
    "VIOLET",
    "PEARL",
    "BEIGE",
    "GOLD",
    "YELLOW",
    "COPPER",
    "ORANGE",
    "RED",
    "MAHOGANY",
    "PINK",
  ];

  const intensities: { id: ToneIntensity; label: string; desc: string }[] = [
    { id: "SOFT", label: "Soft", desc: "Subtle hint of reflect" },
    { id: "STANDARD", label: "Standard", desc: "Balanced salon reflect" },
    { id: "INTENSE", label: "Intense", desc: "Saturated / Vibrant (xx/xx)" },
    { id: "EXTRA_INTENSE", label: "Extra Intense", desc: "Concentrated reflect" },
  ];

  return (
    <div className="space-y-6">
      {/* Primary Tone */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Primary Tone Direction (Main Reflect)
          </h3>
          <span className="text-xs font-mono font-bold text-rose-400">
            Selected: {primaryTone}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Dominant reflect family governing colour wheel counteracting or enhancement.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          {tones.map((t) => (
            <ToneChip
              key={t}
              tone={t}
              selected={primaryTone === t}
              onClick={onPrimaryToneChange}
              showReflect={true}
            />
          ))}
        </div>
      </div>

      {/* Secondary Tone */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Secondary Tone Direction (Subtle Reflect, Optional)
          </h3>
          <span className="text-xs font-mono font-bold text-neutral-300">
            {secondaryTone ? `Selected: ${secondaryTone}` : "None"}
          </span>
        </div>
        <p className="text-xs text-neutral-400 mb-4">
          Secondary tonal nuance (e.g. Copper Gold, Ash Pearl, Red Violet).
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
          <button
            type="button"
            onClick={() => onSecondaryToneChange(null)}
            className={`rounded-lg border px-3 py-2 text-xs font-medium transition-all ${
              secondaryTone === null
                ? "border-amber-500 bg-amber-500/10 text-white"
                : "border-neutral-800 bg-neutral-950 text-neutral-400 hover:border-neutral-700"
            }`}
          >
            None (Pure)
          </button>
          {tones.map((t) => (
            <ToneChip
              key={t}
              tone={t}
              selected={secondaryTone === t}
              onClick={(tn) => onSecondaryToneChange(tn)}
              showReflect={false}
            />
          ))}
        </div>
      </div>

      {/* Tone Intensity */}
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">
          Tone Intensity / Reflect Saturation
        </h3>
        <p className="text-xs text-neutral-400 mb-4">
          Determines depth of reflect saturation and whether double-digit shade codes apply.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {intensities.map((item) => {
            const active = toneIntensity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onToneIntensityChange(item.id)}
                className={`rounded-lg border p-3 text-left transition-all ${
                  active
                    ? "border-amber-500 bg-amber-500/10 text-white ring-1 ring-amber-500"
                    : "border-neutral-800 bg-neutral-950 text-neutral-300 hover:border-neutral-700"
                }`}
              >
                <span className="block text-xs font-bold">{item.label}</span>
                <span className="block text-[11px] text-neutral-400 mt-0.5">
                  {item.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
