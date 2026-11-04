import { SafetyCheckResult } from "../../types/formulation";
import { SafetyBadge } from "../../components/SafetyBadge";

interface SafetyAuditListProps {
  safetyChecks: SafetyCheckResult[];
}

export function SafetyAuditList({ safetyChecks }: SafetyAuditListProps) {
  if (!safetyChecks || safetyChecks.length === 0) {
    return null;
  }

  const hasBlocked = safetyChecks.some((c) => c.status === "BLOCKED");

  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        hasBlocked
          ? "border-rose-500/40 bg-rose-950/20"
          : "border-neutral-800 bg-neutral-900/60"
      }`}
    >
      <div className="flex items-center justify-between border-b border-neutral-800/80 pb-3 mb-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <span>🛡</span> Safety & Contraindication Audit Log
          </h3>
          <p className="text-xs text-neutral-400">
            Automated checks based on manufacturer technical documentation and clinical guidelines.
          </p>
        </div>

        {hasBlocked && (
          <span className="rounded bg-rose-500/20 border border-rose-500/30 px-2.5 py-1 text-xs font-bold text-rose-300">
            Formulation Blocked by Safety Invariant
          </span>
        )}
      </div>

      <div className="space-y-3">
        {safetyChecks.map((check) => (
          <div
            key={check.check_code}
            className={`rounded-lg border p-3 text-xs transition-colors ${
              check.status === "BLOCKED"
                ? "border-rose-500/50 bg-rose-500/10 text-rose-200"
                : check.status === "WARNING"
                ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
                : "border-neutral-800 bg-neutral-950/60 text-neutral-300"
            }`}
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="font-bold text-white text-xs">{check.title}</span>
              <SafetyBadge status={check.status} size="sm" />
            </div>

            <p className="text-[11px] leading-relaxed text-neutral-300 mt-1">
              {check.detail}
            </p>

            {check.blocked_reason && (
              <div className="mt-2 rounded bg-rose-950/60 border border-rose-800/60 p-2 text-[11px] text-rose-300">
                <strong>Blocking Reason:</strong> {check.blocked_reason}
              </div>
            )}

            {check.recommendation && (
              <p className="mt-1.5 text-[10px] text-neutral-400">
                <strong>Professional Guidance:</strong> {check.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
