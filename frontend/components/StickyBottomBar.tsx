"use client";

import React, { ReactNode } from "react";
import Link from "next/link";

interface ActionConfig {
  label: string;
  onClick?: () => void;
  href?: string;
  icon?: string;
  disabled?: boolean;
}

interface StickyBottomBarProps {
  summary: ReactNode;
  backAction?: ActionConfig;
  nextAction: ActionConfig;
  secondaryActions?: ReactNode;
  className?: string;
}

export function StickyBottomBar({
  summary,
  backAction,
  nextAction,
  secondaryActions,
  className = "",
}: StickyBottomBarProps) {
  return (
    <aside
      aria-label="Action Dock"
      className={`fixed bottom-0 inset-x-0 z-40 border-t border-neutral-800 bg-neutral-950/95 backdrop-blur-md px-4 py-3 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Live Summary Chips */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto scrollbar-none py-0.5">
          {summary}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto shrink-0">
          {secondaryActions}

          {backAction && (
            backAction.href ? (
              <Link
                href={backAction.href}
                className="rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-300 transition-all hover:text-white"
              >
                {backAction.icon && <span className="mr-1">{backAction.icon}</span>}
                {backAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={backAction.onClick}
                className="rounded-xl border border-neutral-800 bg-neutral-900/90 hover:bg-neutral-800 px-3.5 py-2.5 text-xs font-bold text-neutral-300 transition-all hover:text-white"
              >
                {backAction.icon && <span className="mr-1">{backAction.icon}</span>}
                {backAction.label}
              </button>
            )
          )}

          {nextAction.href ? (
            <Link
              href={nextAction.href}
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 ${
                nextAction.disabled ? "pointer-events-none opacity-50" : ""
              }`}
            >
              <span>{nextAction.label}</span>
              {nextAction.icon ? <span>{nextAction.icon}</span> : <span>➔</span>}
            </Link>
          ) : (
            <button
              type="button"
              onClick={nextAction.onClick}
              disabled={nextAction.disabled}
              className={`inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-black text-neutral-950 shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none`}
            >
              <span>{nextAction.label}</span>
              {nextAction.icon ? <span>{nextAction.icon}</span> : <span>➔</span>}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
