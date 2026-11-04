import { SafetyStatus } from "../types/formulation";

interface SafetyBadgeProps {
  status: SafetyStatus;
  size?: "sm" | "md";
}

export function SafetyBadge({ status, size = "md" }: SafetyBadgeProps) {
  const configs = {
    PASS: {
      label: "PASS",
      classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
      icon: "✓",
    },
    WARNING: {
      label: "WARNING",
      classes: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      icon: "⚠",
    },
    BLOCKED: {
      label: "BLOCKED",
      classes: "bg-rose-500/10 text-rose-400 border-rose-500/30",
      icon: "⛔",
    },
    NEEDS_ASSESSMENT: {
      label: "NEEDS ASSESSMENT",
      classes: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      icon: "🔍",
    },
  }[status];

  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold tracking-wide ${sizeClasses} ${configs.classes}`}
    >
      <span aria-hidden="true">{configs.icon}</span>
      <span>{configs.label}</span>
    </span>
  );
}
