"use client";

import React, { useState } from "react";
import { ToneFamily, UniversalLevel } from "../../types/uhcr";
import {
  CATEGORY_FILTERS,
  EXPANDED_LOOKBOOK_ITEMS,
  HairLookItem,
  LookCategory,
  TRENDING_12_LOOKS,
} from "../../features/colour-selection/HairColourCatalog";
import { useApp } from "../../context/AppContext";

interface VisualLookbookProps {
  selectedLevel: UniversalLevel;
  selectedPrimaryTone: ToneFamily;
  onSelectLook: (level: UniversalLevel, primary: ToneFamily, secondary: ToneFamily | null) => void;
  startingLevel: number;
}

export function VisualLookbook({
  selectedLevel,
  selectedPrimaryTone,
  onSelectLook,
  startingLevel,
}: VisualLookbookProps) {
  const { setActiveTechnique } = useApp();
  const [viewTab, setViewTab] = useState<"TRENDING" | "CATALOG">("TRENDING");
  const [activeCategory, setActiveCategory] = useState<LookCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const currentList = viewTab === "TRENDING" ? TRENDING_12_LOOKS : EXPANDED_LOOKBOOK_ITEMS;

  const filteredItems = currentList.filter((item) => {
    const matchesCategory =
      viewTab === "TRENDING" || activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shadeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tag && item.tag.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleChoose = (item: HairLookItem) => {
    onSelectLook(item.level, item.primaryTone, item.secondaryTone);
    if (item.technique) {
      setActiveTechnique(item.technique);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🎨</span> Salon Shade Lookbook & Presets
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tap any salon creation to auto-configure formulas, techniques, and undertone neutralization
          </p>
        </div>

        {/* Tab Switcher: Trending (12) vs Catalog (36+) */}
        <div className="flex items-center gap-1.5 rounded-2xl border border-neutral-800 bg-neutral-900/90 p-1">
          <button
            type="button"
            onClick={() => setViewTab("TRENDING")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewTab === "TRENDING"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>🔥</span>
            <span>12 Trending Presets</span>
          </button>
          <button
            type="button"
            onClick={() => setViewTab("CATALOG")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewTab === "CATALOG"
                ? "bg-amber-500 text-neutral-950 shadow-md shadow-amber-500/20"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>📚</span>
            <span>Full Catalog (36+)</span>
          </button>
        </div>
      </div>

      {/* Filter Category Pills (When in Catalog View) & Search */}
      <div className="space-y-3">
        {viewTab === "CATALOG" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORY_FILTERS.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black shrink-0 transition-all ${
                    isActive
                      ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-[1.02]"
                      : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700"
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.labelEn}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search looks by name, code (e.g. 7/43, Caramel, Espresso), or tag..."
            className="w-full rounded-2xl border border-neutral-800 bg-neutral-900/60 px-4 py-2.5 text-xs text-white placeholder-neutral-500 focus:border-amber-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-xs text-neutral-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Grid of Lookbook Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredItems.map((item) => {
          const isSelected =
            selectedLevel === item.level && selectedPrimaryTone === item.primaryTone;
          const levelDelta = item.level - startingLevel;

          const getTechniqueBadge = (tech?: string) => {
            switch (tech) {
              case "COLOR_MELT":
                return { label: "Color Melt", color: "bg-indigo-500/20 text-indigo-300 border-indigo-500/40" };
              case "SHADOW_ROOT":
                return { label: "Shadow Root", color: "bg-purple-500/20 text-purple-300 border-purple-500/40" };
              case "GLOSS_TONING":
                return { label: "Toning Gloss", color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" };
              default:
                return { label: "All-Over", color: "bg-amber-500/20 text-amber-300 border-amber-500/40" };
            }
          };

          const techBadge = getTechniqueBadge(item.technique);

          return (
            <div
              key={item.id}
              onClick={() => handleChoose(item)}
              className={`group cursor-pointer rounded-3xl border p-4.5 transition-all flex flex-col justify-between ${
                isSelected
                  ? "border-amber-400 bg-amber-500/15 ring-2 ring-amber-400 scale-[1.02] shadow-xl shadow-amber-500/20"
                  : "border-neutral-800 bg-neutral-900/70 hover:border-neutral-600 hover:bg-neutral-800"
              }`}
            >
              {/* Hair Swatch Visual */}
              <div
                className="relative h-40 w-full rounded-2xl overflow-hidden shadow-inner border border-neutral-700/60 mb-3"
                style={{ background: item.gradient }}
              >
                {/* Silky Sheen overlay */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white/40 via-transparent to-black/50" />

                {/* Hair Strand Flow */}
                <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.2)_3px,transparent_5px)]" />

                {/* Level / Shade Badge */}
                <div className="absolute top-2.5 left-2.5 rounded-full bg-black/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-black text-white border border-white/20 shadow-md">
                  Level {item.level} • {item.shadeCode}
                </div>

                {/* Look Tag Badge (e.g. Trending #1, Viral) */}
                {item.tag && (
                  <div className="absolute bottom-2.5 left-2.5 rounded-full bg-amber-500 text-neutral-950 px-2.5 py-0.5 text-[9px] font-black shadow-md">
                    {item.tag}
                  </div>
                )}

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute bottom-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-xs shadow-xl animate-pulse">
                    ✓
                  </div>
                )}
              </div>

              {/* Look Info & Technique Badges */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${techBadge.color}`}>
                    {techBadge.label}
                  </span>
                  <span className="rounded-full bg-neutral-800/90 px-2 py-0.5 text-[9px] font-bold text-amber-300 border border-neutral-700" suppressHydrationWarning>
                    {levelDelta > 0
                      ? `+${levelDelta} Lift`
                      : levelDelta < 0
                      ? `${levelDelta} Darken`
                      : "Base Level"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {item.nameEn}
                  </h3>
                </div>

                <p className="text-[11px] text-neutral-300 line-clamp-1">
                  {item.undertoneEn}
                </p>

                {/* Best for & Selection CTA */}
                <div className="pt-2.5 flex items-center justify-between text-[11px] border-t border-neutral-800 mt-2">
                  <span className="text-neutral-400 truncate max-w-[160px]">
                    {item.bestForEn}
                  </span>
                  <span
                    className={`font-black uppercase tracking-wider text-[10px] px-2.5 py-1 rounded-xl transition-all ${
                      isSelected
                        ? "bg-amber-500 text-neutral-950 font-black"
                        : "bg-neutral-800 text-neutral-300 group-hover:bg-amber-500 group-hover:text-neutral-950"
                    }`}
                  >
                    {isSelected ? "Selected ✓" : "Apply Look ➔"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredItems.length === 0 && (
        <div className="rounded-3xl border border-neutral-800 bg-neutral-900/50 p-8 text-center text-neutral-400">
          No shades match &quot;{searchQuery}&quot;. Try another search term.
        </div>
      )}
    </div>
  );
}
