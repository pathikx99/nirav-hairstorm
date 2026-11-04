import { FormulationStage } from "../types/formulation";

interface StageTimelineProps {
  stages: FormulationStage[];
}

export function StageTimeline({ stages }: StageTimelineProps) {
  if (!stages || stages.length === 0) {
    return (
      <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 text-center text-neutral-400">
        No executable stages generated.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stages.map((stage) => (
        <article
          key={stage.stage_number}
          className="relative rounded-xl border border-neutral-800 bg-neutral-900/80 p-5 shadow-sm transition-all hover:border-neutral-700"
        >
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-800/80 pb-3">
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500/20 text-xs font-bold text-amber-400 border border-amber-500/30">
                {stage.stage_number}
              </span>
              <div>
                <h3 className="font-semibold text-white text-base">
                  {stage.stage_description}
                </h3>
                <span className="text-xs text-neutral-400">
                  Service Type: <strong className="text-neutral-200">{stage.service_type}</strong>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 font-mono">
                Ratio {stage.mixing_ratio_text}
              </span>
              <span className="rounded bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300 font-mono">
                ⏱ {stage.development_time_minutes} min ({stage.development_time_range})
              </span>
            </div>
          </div>

          {/* Target Regions */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xs text-neutral-400">Target Zones:</span>
            <div className="flex gap-1.5">
              {stage.target_regions.map((region) => (
                <span
                  key={region}
                  className="rounded bg-neutral-800/70 border border-neutral-700/50 px-2 py-0.5 text-[10px] font-medium tracking-wide text-neutral-300"
                >
                  {region}
                </span>
              ))}
            </div>
          </div>

          {/* Mixture Composition */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Products Table */}
            <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-3.5">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Colour / Lightening Base
              </h4>
              <ul className="space-y-2">
                {stage.products.map((p, idx) => (
                  <li
                    key={idx}
                    className="flex items-center justify-between text-xs border-b border-neutral-900 pb-1.5 last:border-none"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-amber-400 font-mono">
                          {p.shade_code || p.product_name}
                        </span>
                        {p.is_pure_natural && (
                          <span className="rounded bg-emerald-500/20 text-emerald-300 text-[10px] px-1 font-medium">
                            Pure Naturals
                          </span>
                        )}
                        {p.product_type === "SPECIAL_MIX" && (
                          <span className="rounded bg-purple-500/20 text-purple-300 text-[10px] px-1 font-medium">
                            Special Mix
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {p.shade_name || p.product_name}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-neutral-200 font-medium">
                        {p.weight_grams ? `${p.weight_grams}g` : `${p.parts} parts`}
                      </span>
                      {p.length_cm && (
                        <span className="block text-[10px] text-neutral-400">
                          ({p.length_cm} cm ribbon)
                        </span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Developer Details */}
            <div className="rounded-lg border border-neutral-800/60 bg-neutral-950/40 p-3.5">
              <h4 className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                Oxidative Developer
              </h4>
              {stage.developer ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Product:</span>
                    <span className="font-semibold text-neutral-200">
                      {stage.developer.developer_name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Peroxide Strength:</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {stage.developer.concentration_percent}% ({stage.developer.volume_in_vol} Vol)
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-neutral-400">Amount:</span>
                    <span className="font-mono text-neutral-200">
                      {stage.developer.weight_grams
                        ? `${stage.developer.weight_grams}g`
                        : `${stage.developer.parts} parts`}
                    </span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-neutral-500 italic">No developer required</span>
              )}
            </div>
          </div>

          {/* Application Instructions */}
          <div className="mt-4 rounded-lg bg-neutral-950/60 border border-neutral-800/80 p-3 text-xs">
            <span className="font-semibold text-neutral-300">Application Technique:</span>
            <p className="mt-1 text-neutral-300 leading-relaxed">
              {stage.application_instructions}
            </p>
          </div>

          {/* Verified Rules & Sources */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-neutral-500">
            <span>Verified Rules:</span>
            {stage.rules_applied.map((r) => (
              <span key={r} className="rounded bg-neutral-800/80 px-1.5 py-0.5 font-mono text-neutral-400">
                {r}
              </span>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
