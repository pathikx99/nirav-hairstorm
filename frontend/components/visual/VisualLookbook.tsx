"use client";

import React, { useState } from "react";
import { ToneFamily, UniversalLevel } from "../../types/uhcr";
import {
  CATEGORY_FILTERS,
  EXPANDED_LOOKBOOK_ITEMS,
  HairLookItem,
  LookCategory,
} from "../../features/colour-selection/HairColourCatalog";

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
    const [activeCategory, setActiveCategory] = useState<LookCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = EXPANDED_LOOKBOOK_ITEMS.filter((item) => {
    const matchesCategory =
      activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch =
      searchQuery.trim() === "" ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.shadeCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleChoose = (item: HairLookItem) => {
            onSelectLook(item.level, item.primaryTone, item.secondaryTone);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>🎨</span> Salon Shade Catalog
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Tap any hair look to choose • Filter by tone family • Touch 🔊 to hear name
          </p>
        </div>
        
      </div>

      {/* Filter Category Pills & Search */}
      <div className="space-y-3">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORY_FILTERS.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                                    setActiveCategory(cat.id);
                }}
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

        {/* Quick Search */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shades by name or code (e.g. 7/43, Chocolate, Honey, Ash)..."
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map((item) => {
          const isSelected =
            selectedLevel === item.level && selectedPrimaryTone === item.primaryTone;
          const levelDelta = item.level - startingLevel;

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
                className="relative h-36 w-full rounded-2xl overflow-hidden shadow-inner border border-neutral-700/60 mb-3"
                style={{ background: item.gradient }}
              >
                {/* Silky Sheen overlay */}
                <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-white/40 via-transparent to-black/50" />

                {/* Hair Strand Flow */}
                <div className="absolute inset-0 opacity-25 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.2)_3px,transparent_5px)]" />

                {/* Level / Shade Badge */}
                <div className="absolute top-3 left-3 rounded-full bg-black/80 px-3 py-1 text-xs font-black text-white border border-white/20">
                  Level {item.level} • {item.shadeCode}
                </div>

                {/* Lift / Darken Delta Pill */}
                <div className="absolute top-3 right-3 rounded-full bg-neutral-900/90 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-neutral-700">
                  {levelDelta > 0
                    ? `+${levelDelta} Lift`
                    : levelDelta < 0
                    ? `${levelDelta} Darken`
                    : "Same Level"}
                </div>

                {/* Selected Checkmark Badge */}
                {isSelected && (
                  <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-amber-400 text-neutral-950 font-black text-sm shadow-xl animate-pulse">
                    ✓
                  </div>
                )}
              </div>

              {/* Look Info */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base font-black text-white group-hover:text-amber-400 transition-colors">
                    {item.nameEn}
                  </h3>
                  
                </div>

                <p className="text-xs font-bold text-amber-400/90">
                  {item.nameEn}
                </p>

                <p className="text-[11px] text-neutral-400 line-clamp-1">
                  {item.undertoneEn}
                </p>

                {/* Best for & Selection CTA */}
                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-neutral-800 mt-2">
                  <span className="text-neutral-400 truncate max-w-[170px]">
                    {item.bestForEn}
                  </span>
                  <span
                    className={`font-black uppercase tracking-wider text-[10px] ${
                      isSelected ? "text-amber-400" : "text-neutral-400 group-hover:text-white"
                    }`}
                  >
                    {isSelected ? "Selected ✓" : "Tap to Pick ➔"}
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
