"use client";

import React from "react";
import Link from "next/link";

interface VisualHazardModalProps {
  reasonText?: string;
  isAllergy?: boolean;
  isHenna?: boolean;
}

export function VisualHazardModal({
  reasonText,
  isAllergy = false,
  isHenna = false,
}: VisualHazardModalProps) {
  return (
    <div className="rounded-3xl border-2 border-rose-500 bg-rose-950/30 p-6 sm:p-10 text-center space-y-6 shadow-2xl backdrop-blur-md">
      {/* Flashing Stop Sign */}
      <div className="flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-rose-600 text-white text-5xl shadow-[0_0_50px_rgba(225,29,72,0.6)] animate-pulse">
          🛑
        </div>
      </div>

      <div className="space-y-2">
        <span className="inline-block rounded-full bg-rose-500/20 border border-rose-500/40 px-4 py-1 text-xs font-black uppercase tracking-widest text-rose-300">
          HARD SAFETY STOP • SERVICE CONTRAINDICATED
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-white">
          DO NOT APPLY CHEMICAL COLOUR
        </h2>
        <p className="text-sm sm:text-base text-rose-200 max-w-xl mx-auto font-medium">
          {reasonText ||
            (isHenna
              ? "Henna or metallic salts detected. Applying chemical bleach or oxidative lightener will cause severe chemical burns and melting."
              : isAllergy
              ? "Active allergy history reported. Chemical hair colour is strictly prohibited."
              : "This chemical procedure is contraindicated and dangerous for this client's hair.")}
        </p>
      </div>

      {/* Visual Explanation of the Danger */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-left">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-900/20 p-4">
          <span className="text-2xl mb-1 block">🔥</span>
          <span className="text-xs font-bold text-white block">
            Chemical Reaction Risk
          </span>
          <span className="text-[11px] text-rose-300 block mt-1">
            {isHenna
              ? "Metallic salts react exothermically with hydrogen peroxide, melting hair fibers."
              : "Oxidative chemicals trigger severe contact dermatitis or systemic allergic reaction."}
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-900/20 p-4">
          <span className="text-2xl mb-1 block">✂️</span>
          <span className="text-xs font-bold text-white block">
            Severe Breakage
          </span>
          <span className="text-[11px] text-rose-300 block mt-1">
            Hair cortex integrity is compromised. Chemical lifting will cause instantaneous breakage.
          </span>
        </div>

        <div className="rounded-2xl border border-rose-500/30 bg-rose-900/20 p-4">
          <span className="text-2xl mb-1 block">📋</span>
          <span className="text-xs font-bold text-white block">
            Safe Alternative
          </span>
          <span className="text-[11px] text-rose-300 block mt-1">
            Recommend a deep clarifying treatment or non-oxidative direct gloss tint instead.
          </span>
        </div>
      </div>

      {/* Safe Actions */}
      <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
        <Link
          href="/starting-hair"
          className="py-3.5 px-6 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-black text-sm transition-all"
        >
          ← Review Hair Assessment
        </Link>
        <Link
          href="/"
          className="py-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-sm shadow-xl transition-all"
        >
          Cancel & Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
