"use client";

import React from "react";
import { ToneFamily, ToneIntensity, UniversalLevel } from "../../types/uhcr";
import { computeHairColorimetry } from "../../services/hairColorimetryService";

export interface ColourWheelSector {
  id: string;
  tone: ToneFamily;
  secondaryTone: ToneFamily | null;
  angleDeg: number; // Exact center angle in degrees (0 = 12 o'clock, 30° increments)
  nameEn: string;
  nameHi: string;
  reflectCode: string; // Formatted reflect display (e.g. ".4 (/4)")
  iccCode: string; // Universal ICC digit (e.g. "4", "43")
  wellaCode: string; // Wella notation (e.g. "4", "43")
  lorealCode: string; // L'Oréal notation (e.g. "4", "43")
  schwarzkopfCode: string; // Schwarzkopf notation (e.g. "7", "78")
  matrixCode: string; // Matrix notation (e.g. "C", "CR")
  colorHex: string;
  oppositeTone: ToneFamily;
  oppositeSecondaryTone: ToneFamily | null;
  oppositeAngleDeg: number; // angleDeg + 180°
  oppositeNameEn: string;
  oppositeReflectCode: string;
  oppositeIccCode: string;
  oppositeWellaCode: string;
  oppositeLorealCode: string;
  oppositeSchwarzkopfCode: string;
  neutralizesWhatEn: string;
  cielabHueDeg: number;
}

// 12 mathematically calibrated 30° sectors with exact 180° diametric opposition pairs
export const WHEEL_SECTORS: ColourWheelSector[] = [
  {
    id: "sector-gold",
    tone: "GOLD",
    secondaryTone: null,
    angleDeg: 0, // 12 o'clock
    nameEn: "Warm Gold / Yellow",
    nameHi: "सुनहरा पीला (गोल्ड)",
    reflectCode: ".3 (/3)",
    iccCode: "3",
    wellaCode: "3",
    lorealCode: "3",
    schwarzkopfCode: "5",
    matrixCode: "G",
    colorHex: "#eab308",
    oppositeTone: "VIOLET",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 180,
    oppositeNameEn: "Plum Violet / Iridescent",
    oppositeReflectCode: ".2 (/6)",
    oppositeIccCode: "2",
    oppositeWellaCode: "6",
    oppositeLorealCode: "2",
    oppositeSchwarzkopfCode: "9",
    neutralizesWhatEn: "Violet (.2 / /6) neutralizes brassy yellow reflect",
    cielabHueDeg: 90,
  },
  {
    id: "sector-amber",
    tone: "GOLD",
    secondaryTone: "COPPER",
    angleDeg: 30, // 1 o'clock
    nameEn: "Amber / Gold-Copper",
    nameHi: "अंबर / सुनहरा तांबा",
    reflectCode: ".34 (/34)",
    iccCode: "34",
    wellaCode: "34",
    lorealCode: "34",
    schwarzkopfCode: "57",
    matrixCode: "GC",
    colorHex: "#f59e0b",
    oppositeTone: "PEARL",
    oppositeSecondaryTone: "ASH",
    oppositeAngleDeg: 210,
    oppositeNameEn: "Pearl Cendré / Blue-Violet",
    oppositeReflectCode: ".21 (/86)",
    oppositeIccCode: "21",
    oppositeWellaCode: "86",
    oppositeLorealCode: "21",
    oppositeSchwarzkopfCode: "1",
    neutralizesWhatEn: "Blue-violet (.21 / /86) neutralizes golden amber warmth",
    cielabHueDeg: 60,
  },
  {
    id: "sector-copper",
    tone: "COPPER",
    secondaryTone: null,
    angleDeg: 60, // 2 o'clock
    nameEn: "Vibrant Copper / Orange",
    nameHi: "चमकदार तांबा (कॉपर)",
    reflectCode: ".4 (/4)",
    iccCode: "4",
    wellaCode: "4",
    lorealCode: "4",
    schwarzkopfCode: "7",
    matrixCode: "C",
    colorHex: "#ea580c",
    oppositeTone: "ASH",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 240,
    oppositeNameEn: "Cool Blue / Ash",
    oppositeReflectCode: ".1 (/1)",
    oppositeIccCode: "1",
    oppositeWellaCode: "1",
    oppositeLorealCode: "1",
    oppositeSchwarzkopfCode: "2",
    neutralizesWhatEn: "Blue / Ash (.1 / /1) neutralizes orange brassiness",
    cielabHueDeg: 45,
  },
  {
    id: "sector-auburn",
    tone: "COPPER",
    secondaryTone: "RED",
    angleDeg: 90, // 3 o'clock
    nameEn: "Red-Copper / Auburn",
    nameHi: "लाल-तांबा (ऑबर्न)",
    reflectCode: ".46 (/43)",
    iccCode: "46",
    wellaCode: "43",
    lorealCode: "46",
    schwarzkopfCode: "78",
    matrixCode: "CR",
    colorHex: "#dc2626",
    oppositeTone: "ASH",
    oppositeSecondaryTone: "GREEN",
    oppositeAngleDeg: 270,
    oppositeNameEn: "Matte Ash / Blue-Green",
    oppositeReflectCode: ".17 (/19)",
    oppositeIccCode: "17",
    oppositeWellaCode: "19",
    oppositeLorealCode: "17",
    oppositeSchwarzkopfCode: "23",
    neutralizesWhatEn: "Blue-green (.17 / /19) neutralizes fiery red-orange warmth",
    cielabHueDeg: 30,
  },
  {
    id: "sector-red",
    tone: "RED",
    secondaryTone: null,
    angleDeg: 120, // 4 o'clock
    nameEn: "Ruby Red / Crimson",
    nameHi: "माणिक लाल (रेड)",
    reflectCode: ".6 (/4)",
    iccCode: "6",
    wellaCode: "4",
    lorealCode: "6",
    schwarzkopfCode: "8",
    matrixCode: "R",
    colorHex: "#b91c1c",
    oppositeTone: "GREEN",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 300,
    oppositeNameEn: "Matte Green / Olive",
    oppositeReflectCode: ".7 (/2)",
    oppositeIccCode: "7",
    oppositeWellaCode: "2",
    oppositeLorealCode: "7",
    oppositeSchwarzkopfCode: "3",
    neutralizesWhatEn: "Matte Green (.7 / /2) neutralizes deep red warmth",
    cielabHueDeg: 15,
  },
  {
    id: "sector-mahogany",
    tone: "MAHOGANY",
    secondaryTone: "VIOLET",
    angleDeg: 150, // 5 o'clock
    nameEn: "Mahogany / Red-Violet",
    nameHi: "महोगनी / लाल-बैंगनी",
    reflectCode: ".5 (/65)",
    iccCode: "5",
    wellaCode: "65",
    lorealCode: "5",
    schwarzkopfCode: "89",
    matrixCode: "M",
    colorHex: "#831843",
    oppositeTone: "BEIGE",
    oppositeSecondaryTone: "GOLD",
    oppositeAngleDeg: 330,
    oppositeNameEn: "Natural Sand / Beige",
    oppositeReflectCode: ".13 (/38)",
    oppositeIccCode: "13",
    oppositeWellaCode: "38",
    oppositeLorealCode: "13",
    oppositeSchwarzkopfCode: "4",
    neutralizesWhatEn: "Sand-olive (.13 / /38) neutralizes red-violet mahogany reflect",
    cielabHueDeg: 345,
  },
  {
    id: "sector-violet",
    tone: "VIOLET",
    secondaryTone: null,
    angleDeg: 180, // 6 o'clock
    nameEn: "Plum Violet / Purple",
    nameHi: "बैंगनी (वायलेट)",
    reflectCode: ".2 (/6)",
    iccCode: "2",
    wellaCode: "6",
    lorealCode: "2",
    schwarzkopfCode: "9",
    matrixCode: "V",
    colorHex: "#7e22ce",
    oppositeTone: "GOLD",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 0,
    oppositeNameEn: "Warm Gold / Yellow",
    oppositeReflectCode: ".3 (/3)",
    oppositeIccCode: "3",
    oppositeWellaCode: "3",
    oppositeLorealCode: "3",
    oppositeSchwarzkopfCode: "5",
    neutralizesWhatEn: "Gold / Yellow (.3 / /3) neutralizes unwanted violet dullness",
    cielabHueDeg: 300,
  },
  {
    id: "sector-pearl",
    tone: "PEARL",
    secondaryTone: "ASH",
    angleDeg: 210, // 7 o'clock
    nameEn: "Pearl Cendré / Blue-Violet",
    nameHi: "मोती (पर्ल सेंद्रे)",
    reflectCode: ".21 (/86)",
    iccCode: "21",
    wellaCode: "8",
    lorealCode: "21",
    schwarzkopfCode: "1",
    matrixCode: "P",
    colorHex: "#6366f1",
    oppositeTone: "GOLD",
    oppositeSecondaryTone: "COPPER",
    oppositeAngleDeg: 30,
    oppositeNameEn: "Amber / Gold-Copper",
    oppositeReflectCode: ".34 (/34)",
    oppositeIccCode: "34",
    oppositeWellaCode: "34",
    oppositeLorealCode: "34",
    oppositeSchwarzkopfCode: "57",
    neutralizesWhatEn: "Amber (.34 / /34) neutralizes overly icy blue-violet cast",
    cielabHueDeg: 270,
  },
  {
    id: "sector-ash",
    tone: "ASH",
    secondaryTone: null,
    angleDeg: 240, // 8 o'clock
    nameEn: "Cool Blue / Ash",
    nameHi: "ठंडा नीला / राख (ऐश)",
    reflectCode: ".1 (/1)",
    iccCode: "1",
    wellaCode: "1",
    lorealCode: "1",
    schwarzkopfCode: "2",
    matrixCode: "A",
    colorHex: "#2563eb",
    oppositeTone: "COPPER",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 60,
    oppositeNameEn: "Vibrant Copper / Orange",
    oppositeReflectCode: ".4 (/4)",
    oppositeIccCode: "4",
    oppositeWellaCode: "4",
    oppositeLorealCode: "4",
    oppositeSchwarzkopfCode: "7",
    neutralizesWhatEn: "Copper (.4 / /4) neutralizes overly flat blue-ash reflect",
    cielabHueDeg: 240,
  },
  {
    id: "sector-matte-ash",
    tone: "ASH",
    secondaryTone: "GREEN",
    angleDeg: 270, // 9 o'clock
    nameEn: "Matte Ash / Blue-Green",
    nameHi: "मैट ऐश / नीला-हरा",
    reflectCode: ".17 (/19)",
    iccCode: "17",
    wellaCode: "19",
    lorealCode: "17",
    schwarzkopfCode: "23",
    matrixCode: "AG",
    colorHex: "#0d9488",
    oppositeTone: "COPPER",
    oppositeSecondaryTone: "RED",
    oppositeAngleDeg: 90,
    oppositeNameEn: "Red-Copper / Auburn",
    oppositeReflectCode: ".46 (/43)",
    oppositeIccCode: "46",
    oppositeWellaCode: "43",
    oppositeLorealCode: "46",
    oppositeSchwarzkopfCode: "78",
    neutralizesWhatEn: "Red-copper (.46 / /43) neutralizes muddy teal-green tone",
    cielabHueDeg: 195,
  },
  {
    id: "sector-matte",
    tone: "GREEN",
    secondaryTone: null,
    angleDeg: 300, // 10 o'clock
    nameEn: "Matte Green / Olive",
    nameHi: "मैट हरा / जैतून (ऑलिव)",
    reflectCode: ".7 (/2)",
    iccCode: "7",
    wellaCode: "2",
    lorealCode: "7",
    schwarzkopfCode: "3",
    matrixCode: "G",
    colorHex: "#16a34a",
    oppositeTone: "RED",
    oppositeSecondaryTone: null,
    oppositeAngleDeg: 120,
    oppositeNameEn: "Ruby Red / Crimson",
    oppositeReflectCode: ".6 (/4)",
    oppositeIccCode: "6",
    oppositeWellaCode: "4",
    oppositeLorealCode: "6",
    oppositeSchwarzkopfCode: "8",
    neutralizesWhatEn: "Ruby red (.6 / /4) neutralizes unwanted khaki-green cast",
    cielabHueDeg: 150,
  },
  {
    id: "sector-beige",
    tone: "BEIGE",
    secondaryTone: "GOLD",
    angleDeg: 330, // 11 o'clock
    nameEn: "Natural Sand / Beige",
    nameHi: "रेतीला बेज (सैंड)",
    reflectCode: ".13 (/38)",
    iccCode: "13",
    wellaCode: "38",
    lorealCode: "13",
    schwarzkopfCode: "4",
    matrixCode: "B",
    colorHex: "#ca8a04",
    oppositeTone: "MAHOGANY",
    oppositeSecondaryTone: "VIOLET",
    oppositeAngleDeg: 150,
    oppositeNameEn: "Mahogany / Red-Violet",
    oppositeReflectCode: ".5 (/65)",
    oppositeIccCode: "5",
    oppositeWellaCode: "65",
    oppositeLorealCode: "5",
    oppositeSchwarzkopfCode: "89",
    neutralizesWhatEn: "Mahogany (.5 / /65) neutralizes overly drab beige cast",
    cielabHueDeg: 110,
  },
];

// Universal Underlying Exposed Pigments (EUP) by Depth Level (1 to 10)
export const LEVEL_METRICS: Record<
  UniversalLevel,
  {
    name: string;
    lStar: number;
    eupName: string;
    eupMelaninDistribution: string;
    eupCancelReflect: string;
    eupCancelToneName: string;
  }
> = {
  1: {
    name: "Black",
    lStar: 16.0,
    eupName: "Dense Black Eumelanin",
    eupMelaninDistribution: "100% Eumelanin (No Exposed Warmth)",
    eupCancelReflect: ".0 (/0)",
    eupCancelToneName: "Natural Base",
  },
  2: {
    name: "Darkest Brown",
    lStar: 20.0,
    eupName: "Dark Brown Eumelanin",
    eupMelaninDistribution: "95% Eumelanin / 5% Dark Red",
    eupCancelReflect: ".0 (/0)",
    eupCancelToneName: "Natural Base",
  },
  3: {
    name: "Dark Brown",
    lStar: 25.0,
    eupName: "Deep Red-Brown",
    eupMelaninDistribution: "90% Eumelanin / 10% Deep Red",
    eupCancelReflect: ".7 (/2)",
    eupCancelToneName: "Matte Green Anti-Red",
  },
  4: {
    name: "Medium Brown",
    lStar: 30.5,
    eupName: "Red Eumelanin",
    eupMelaninDistribution: "80% Eumelanin / 20% Red",
    eupCancelReflect: ".7 (/2)",
    eupCancelToneName: "Matte Green Anti-Red",
  },
  5: {
    name: "Light Brown",
    lStar: 37.0,
    eupName: "Red-Orange (Auburn)",
    eupMelaninDistribution: "65% Eumelanin / 35% Red-Orange",
    eupCancelReflect: ".17 (/19)",
    eupCancelToneName: "Matte Blue-Green",
  },
  6: {
    name: "Dark Blonde",
    lStar: 45.0,
    eupName: "Orange (Copper)",
    eupMelaninDistribution: "45% Eumelanin / 55% Orange",
    eupCancelReflect: ".1 (/1)",
    eupCancelToneName: "Blue-Ash Anti-Orange",
  },
  7: {
    name: "Medium Blonde",
    lStar: 54.0,
    eupName: "Yellow-Orange (Gold-Copper)",
    eupMelaninDistribution: "25% Eumelanin / 75% Yellow-Orange",
    eupCancelReflect: ".21 (/86)",
    eupCancelToneName: "Pearl Cendré (Blue-Violet)",
  },
  8: {
    name: "Light Blonde",
    lStar: 64.0,
    eupName: "Yellow (Gold)",
    eupMelaninDistribution: "10% Eumelanin / 90% Yellow",
    eupCancelReflect: ".2 (/6)",
    eupCancelToneName: "Violet Anti-Yellow",
  },
  9: {
    name: "Very Light Blonde",
    lStar: 74.0,
    eupName: "Pale Yellow",
    eupMelaninDistribution: "2% Eumelanin / 98% Pale Yellow",
    eupCancelReflect: ".2 (/96)",
    eupCancelToneName: "Pale Violet-Pearl",
  },
  10: {
    name: "Platinum Blonde",
    lStar: 84.0,
    eupName: "Extra Pale Platinum Yellow",
    eupMelaninDistribution: "0% Eumelanin / 100% Platinum",
    eupCancelReflect: ".22 (/81)",
    eupCancelToneName: "Ultra-Violet / Silver",
  },
};

interface HairColourWheelProps {
  selectedLevel: UniversalLevel;
  selectedPrimaryTone: ToneFamily;
  selectedSecondaryTone?: ToneFamily | null;
  onSelect: (
    level: UniversalLevel,
    primaryTone: ToneFamily,
    secondaryTone: ToneFamily | null,
    intensity: ToneIntensity
  ) => void;
  className?: string;
}

export function HairColourWheel({
  selectedLevel,
  selectedPrimaryTone,
  selectedSecondaryTone,
  onSelect,
  className = "",
}: HairColourWheelProps) {
  const level = selectedLevel;

  // Active sector match based on primary and secondary tone
  const activeSector =
    WHEEL_SECTORS.find(
      (s) =>
        s.tone === selectedPrimaryTone &&
        (selectedSecondaryTone ? s.secondaryTone === selectedSecondaryTone : true)
    ) ||
    WHEEL_SECTORS.find((s) => s.tone === selectedPrimaryTone) ||
    WHEEL_SECTORS[0];

  const isNaturalBase = selectedPrimaryTone === "NATURAL" && !selectedSecondaryTone;

  // Calibrated colorimetry for the currently selected shade & depth
  const currentColorimetry = computeHairColorimetry(
    level,
    isNaturalBase ? "NATURAL" : activeSector.tone,
    isNaturalBase ? null : activeSector.secondaryTone
  );

  const naturalCenterColorimetry = computeHairColorimetry(level, "NATURAL");

  // Wheel geometry dimensions
  const center = 160;
  const radius = 135;
  const innerRadius = 52;
  const labelRadius = 96;
  const numSectors = WHEEL_SECTORS.length;
  const sectorAngle = 360 / numSectors; // 30°

  const handleSelectSector = (sector: ColourWheelSector) => {
    onSelect(level, sector.tone, sector.secondaryTone, "STANDARD");
  };

  const handleSelectNatural = () => {
    onSelect(level, "NATURAL", null, "STANDARD");
  };

  const handleLevelChange = (newLvl: UniversalLevel) => {
    onSelect(
      newLvl,
      isNaturalBase ? "NATURAL" : activeSector.tone,
      isNaturalBase ? null : activeSector.secondaryTone,
      "STANDARD"
    );
  };

  const round2 = (n: number) => Math.round(n * 100) / 100;

  // Helper to generate SVG pie slice path
  const describeArc = (
    cx: number,
    cy: number,
    rIn: number,
    rOut: number,
    startAngle: number,
    endAngle: number
  ) => {
    // 0° is 12 o'clock (deg - 90 converts math standard to clock face)
    const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
    const x1 = round2(cx + rOut * Math.cos(toRad(startAngle)));
    const y1 = round2(cy + rOut * Math.sin(toRad(startAngle)));
    const x2 = round2(cx + rOut * Math.cos(toRad(endAngle)));
    const y2 = round2(cy + rOut * Math.sin(toRad(endAngle)));
    const x3 = round2(cx + rIn * Math.cos(toRad(endAngle)));
    const y3 = round2(cy + rIn * Math.sin(toRad(endAngle)));
    const x4 = round2(cx + rIn * Math.cos(toRad(startAngle)));
    const y4 = round2(cy + rIn * Math.sin(toRad(startAngle)));

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    return `M ${x1} ${y1} A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };

  // Compute exact collinear opposite angle for the neutralization ray
  const toRad = (deg: number) => ((deg - 90) * Math.PI) / 180;
  const activeAngle = isNaturalBase ? 0 : activeSector.angleDeg;
  const oppositeAngle = (activeAngle + 180) % 360;

  // Active and opposite positions sit exactly at radial center of their respective slices
  const actX = round2(center + (radius - 12) * Math.cos(toRad(activeAngle)));
  const actY = round2(center + (radius - 12) * Math.sin(toRad(activeAngle)));
  const oppX = round2(center + (radius - 12) * Math.cos(toRad(oppositeAngle)));
  const oppY = round2(center + (radius - 12) * Math.sin(toRad(oppositeAngle)));

  // Current level details
  const levelMetric = LEVEL_METRICS[level] || LEVEL_METRICS[7];

  // Cross-brand numbers calculation
  const iccNumber = isNaturalBase ? `${level}.0` : `${level}.${activeSector.iccCode}`;
  const wellaNumber = isNaturalBase ? `${level}/0` : `${level}/${activeSector.wellaCode}`;
  const lorealNumber = isNaturalBase ? `${level}.0` : `${level}.${activeSector.lorealCode}`;
  const schwarzkopfNumber = isNaturalBase ? `${level}-0` : `${level}-${activeSector.schwarzkopfCode}`;
  const matrixNumber = isNaturalBase ? `${level}N` : `${level}${activeSector.matrixCode}`;

  const oppIccNumber = `${level}.${activeSector.oppositeIccCode}`;
  const oppWellaNumber = `${level}/${activeSector.oppositeWellaCode}`;

  return (
    <div
      className={`rounded-3xl border border-neutral-800 bg-neutral-900/90 p-5 sm:p-7 shadow-2xl space-y-5 ${className}`}
      suppressHydrationWarning
    >
      {/* 1. Header with Scientific Law Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">🎡</span>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Universal Hairdresser Colour Wheel
            </h2>
            <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
              12 Slices • 30° Spacing • 180° Neutralization
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Exact mathematical colorimetry & universal manufacturer numbers. Tap any segment to view undertones, counteraction vectors, and cross-brand formulas.
          </p>
        </div>

        {/* Global Active Indicator */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-1.5 flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full ring-1 ring-white/30"
              style={{ backgroundColor: isNaturalBase ? naturalCenterColorimetry.baseHex : activeSector.colorHex }}
            />
            <span className="text-xs font-mono font-black text-white">
              {iccNumber}
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              ({isNaturalBase ? "Natural Base" : activeSector.nameEn.split(" / ")[0]})
            </span>
          </div>
        </div>
      </div>

      {/* 2. Depth Level (1 to 10) Master Control Bar */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3.5 sm:p-4 space-y-2.5 shadow-inner">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
            <span>🎚️</span> Depth Level (1 to 10):
          </label>
          <span className="text-xs font-mono font-black text-amber-400">
            Level {level} ({levelMetric.name}) • Lightness L* {levelMetric.lStar}
          </span>
        </div>

        {/* Continuous Range Slider */}
        <input
          type="range"
          min="1"
          max="10"
          step="1"
          value={level}
          onChange={(e) => handleLevelChange(Number(e.target.value) as UniversalLevel)}
          className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />

        {/* 10 Discrete Level Pills with L* lightness */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
          {([1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as UniversalLevel[]).map((lvl) => {
            const metric = LEVEL_METRICS[lvl];
            const isLvlSelected = level === lvl;
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleLevelChange(lvl)}
                className={`py-1 px-1 text-center rounded-xl transition-all flex flex-col items-center justify-center cursor-pointer ${
                  isLvlSelected
                    ? "bg-amber-500 text-neutral-950 shadow-md ring-2 ring-amber-400 scale-[1.03]"
                    : "bg-neutral-800/80 text-neutral-300 hover:bg-neutral-700 hover:text-white"
                }`}
                title={`Level ${lvl} ${metric.name} (L* ${metric.lStar})`}
              >
                <span className="text-xs font-black leading-tight">{lvl}</span>
                <span className={`text-[8px] font-mono leading-none mt-0.5 ${isLvlSelected ? "text-neutral-900 font-bold" : "text-neutral-400"}`}>
                  L*{metric.lStar}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Main Wheel & Salon Formulation Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        {/* Left Column: Interactive Wheel + Legend + Chips */}
        <div className="flex flex-col items-center space-y-3">
          <div className="relative w-[300px] h-[300px] sm:w-[320px] sm:h-[320px] select-none">
            <svg
              viewBox="0 0 320 320"
              className="w-full h-full drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)]"
            >
              <defs>
                {/* Glow Filter */}
                <filter id="wheel-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Outer boundary ring with angle tick marks */}
              <circle
                cx={center}
                cy={center}
                r={radius + 4}
                fill="none"
                stroke="#333333"
                strokeWidth="2"
              />

              {/* 12 Chromatic Sectors with exact 30° spacing */}
              {WHEEL_SECTORS.map((sector) => {
                const startAngle = sector.angleDeg - sectorAngle / 2;
                const endAngle = sector.angleDeg + sectorAngle / 2;
                const isSelected = !isNaturalBase && activeSector.id === sector.id;

                const pathData = describeArc(
                  center,
                  center,
                  innerRadius,
                  isSelected ? radius + 7 : radius,
                  startAngle,
                  endAngle
                );

                // Calibrate sector fill based on current depth level (melanin density)
                const sectorColor = computeHairColorimetry(
                  level,
                  sector.tone,
                  sector.secondaryTone
                ).baseHex;

                // Sector label coordinates
                const rad = toRad(sector.angleDeg);
                const lx = round2(center + labelRadius * Math.cos(rad));
                const ly = round2(center + labelRadius * Math.sin(rad));

                // Outer degree label coordinates
                const degRadius = radius - 8;
                const dx = round2(center + degRadius * Math.cos(rad));
                const dy = round2(center + degRadius * Math.sin(rad));

                return (
                  <g
                    key={sector.id}
                    onClick={() => handleSelectSector(sector)}
                    className="cursor-pointer transition-transform duration-200"
                  >
                    {/* Pie Slice */}
                    <path
                      d={pathData}
                      fill={sectorColor}
                      stroke={isSelected ? "#ffffff" : "#171717"}
                      strokeWidth={isSelected ? "3" : "1.5"}
                      opacity={isSelected ? 1 : 0.9}
                      className="hover:opacity-100 hover:brightness-125 transition-all duration-300 ease-out"
                    />

                    {/* Numeric Reflect Badge on Slice (.3, .4, .6, etc.) */}
                    <circle
                      cx={lx}
                      cy={ly}
                      r="10.5"
                      fill="#000000"
                      fillOpacity={isSelected ? "0.85" : "0.55"}
                      stroke={isSelected ? "#ffffff" : "#404040"}
                      strokeWidth="1"
                    />
                    <text
                      x={lx}
                      y={ly + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      className="pointer-events-none select-none"
                    >
                      .{sector.iccCode}
                    </text>

                    {/* Degree indicator near rim */}
                    <text
                      x={dx}
                      y={dy + 2.5}
                      textAnchor="middle"
                      fill={isSelected ? "#ffffff" : "#a3a3a3"}
                      fontSize="7"
                      fontWeight="bold"
                      fontFamily="monospace"
                      className="pointer-events-none select-none opacity-80"
                    >
                      {sector.angleDeg}°
                    </text>
                  </g>
                );
              })}

              {/* Exact Collinear 180° Neutralization Ray */}
              {!isNaturalBase && (
                <g className="pointer-events-none">
                  {/* Dashed line to exact opposite neutralizing tone passing straight through center */}
                  <line
                    x1={actX}
                    y1={actY}
                    x2={oppX}
                    y2={oppY}
                    stroke="#ffffff"
                    strokeWidth="2.5"
                    strokeDasharray="4,4"
                    opacity="0.9"
                  />
                  {/* Center Pivot Marker */}
                  <circle
                    cx={center}
                    cy={center}
                    r="4"
                    fill="#ffffff"
                    stroke="#f59e0b"
                    strokeWidth="2"
                  />
                  {/* Selector Ring on Active Sector */}
                  <circle
                    cx={actX}
                    cy={actY}
                    r="9"
                    fill="#ffffff"
                    stroke="#000000"
                    strokeWidth="2.5"
                    filter="url(#wheel-glow)"
                  />
                  {/* Opposite Target Marker with 180° Indicator */}
                  <circle
                    cx={oppX}
                    cy={oppY}
                    r="8"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeDasharray="3,3"
                    className="animate-pulse"
                  />
                </g>
              )}

              {/* Center Circle: Natural Base (.0 / /0) Equilibrium Point (a*=0, b*=0) */}
              <g
                onClick={handleSelectNatural}
                className="cursor-pointer transition-transform duration-200"
              >
                <circle
                  cx={center}
                  cy={center}
                  r={innerRadius - 2}
                  fill={naturalCenterColorimetry.baseHex}
                  stroke={isNaturalBase ? "#f59e0b" : "#525252"}
                  strokeWidth={isNaturalBase ? "3.5" : "2"}
                  className="hover:brightness-110 transition-all duration-300 ease-out"
                />
                <text
                  x={center}
                  y={center - 10}
                  textAnchor="middle"
                  fill={level >= 8 ? "#171717" : "#ffffff"}
                  fontSize="10"
                  fontWeight="900"
                  fontFamily="sans-serif"
                >
                  NATURAL
                </text>
                <text
                  x={center}
                  y={center + 4}
                  textAnchor="middle"
                  fill={level >= 8 ? "#78350f" : "#fbbf24"}
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  .{level}.0 / {level}/0
                </text>
                <text
                  x={center}
                  y={center + 17}
                  textAnchor="middle"
                  fill={level >= 8 ? "#404040" : "#d4d4d4"}
                  fontSize="8"
                  fontWeight="bold"
                >
                  100% Grey Base
                </text>
              </g>
            </svg>
          </div>

          {/* Wheel Quick Legend */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-neutral-400 font-medium">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-white inline-block shadow-xs" /> Selected ({activeAngle}°)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full border-2 border-amber-400 inline-block" /> Neutralizer ({oppositeAngle}°)
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-neutral-600 inline-block" /> Center (.0 Base)
            </span>
          </div>

          {/* Quick Tone Selector Chips with Numbers */}
          <div className="w-full space-y-1.5 pt-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block text-center">
              Tap Reflect Code (.X / /X)
            </span>
            <div className="flex flex-wrap justify-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectNatural}
                className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isNaturalBase
                    ? "bg-amber-500 text-neutral-950 font-black shadow-md ring-1 ring-amber-400 scale-105"
                    : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full ring-1 ring-white/30"
                  style={{ backgroundColor: naturalCenterColorimetry.baseHex }}
                />
                <span>Natural</span>
                <span className="font-mono text-[9px] opacity-80">.0</span>
              </button>

              {WHEEL_SECTORS.map((s) => {
                const isSelected = !isNaturalBase && activeSector.id === s.id;
                const chipColor = computeHairColorimetry(level, s.tone, s.secondaryTone).baseHex;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleSelectSector(s)}
                    className={`px-2 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-amber-500 text-neutral-950 font-black shadow-md ring-1 ring-amber-400 scale-105"
                        : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full shadow-xs ring-1 ring-white/30"
                      style={{ backgroundColor: chipColor }}
                    />
                    <span>{s.nameEn.split(" / ")[0]}</span>
                    <span className="font-mono text-[9px] opacity-80">.{s.iccCode}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Formulation Console & Scientific Breakdown */}
        <div className="space-y-3.5">
          {/* Card 1: Calibrated Swatch & Tone Identity */}
          <div
            className="relative w-full h-20 rounded-2xl overflow-hidden shadow-md border border-neutral-700/60 p-3 flex flex-col justify-between transition-all duration-500"
            style={{ background: currentColorimetry.gradient }}
          >
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/50 via-transparent to-black/50 pointer-events-none" />
            <div className="absolute inset-0 opacity-20 bg-[repeating-linear-gradient(90deg,transparent,transparent_2px,rgba(255,255,255,0.25)_3px,transparent_4px)] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between">
              <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-black/80 backdrop-blur-md border border-white/20 text-white font-black text-[11px] font-mono">
                Depth {level} (L* {levelMetric.lStar})
              </span>
              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-amber-400 text-neutral-950 font-black text-[10px] font-mono shadow-xs">
                {isNaturalBase ? ".0 NATURAL BASE" : `.${activeSector.iccCode} (${activeSector.reflectCode})`}
              </span>
            </div>

            <div className="relative z-10 flex items-end justify-between">
              <div>
                <h4 className="text-sm font-black text-white drop-shadow-md leading-tight">
                  {isNaturalBase ? "Pure Natural Base (.0 / /0)" : activeSector.nameEn}
                </h4>
                <p className="text-[10px] font-bold text-amber-200 drop-shadow-md">
                  {isNaturalBase ? "100% Resistant White / Grey Coverage" : activeSector.nameHi}
                </p>
              </div>
              <span className="text-[10px] font-bold text-neutral-200/90 font-mono bg-black/60 px-2 py-0.5 rounded-md backdrop-blur-xs">
                Reflect: {activeSector.tone}
              </span>
            </div>
          </div>

          {/* Card 2: Cross-Brand Formulation Numbers */}
          <div className="rounded-2xl border border-neutral-800 bg-neutral-950/80 p-3.5 space-y-2.5 shadow-inner">
            <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
              <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                <span>🔢</span> Cross-Brand Formulation Matrix
              </span>
              <span className="text-[11px] font-mono font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                Level {level} • {isNaturalBase ? "Natural" : activeSector.nameEn.split(" / ")[0]}
              </span>
            </div>

            {/* 4 Brand Number Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/90 p-2">
                <span className="text-[9px] text-neutral-400 font-bold block uppercase tracking-wider">Universal ICC</span>
                <span className="text-sm font-black font-mono text-white block mt-0.5">{iccNumber}</span>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/90 p-2">
                <span className="text-[9px] text-amber-400 font-bold block uppercase tracking-wider">Wella</span>
                <span className="text-sm font-black font-mono text-amber-300 block mt-0.5">{wellaNumber}</span>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/90 p-2">
                <span className="text-[9px] text-blue-400 font-bold block uppercase tracking-wider">L&apos;Oréal</span>
                <span className="text-sm font-black font-mono text-blue-300 block mt-0.5">{lorealNumber}</span>
              </div>
              <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/90 p-2">
                <span className="text-[9px] text-red-400 font-bold block uppercase tracking-wider">Schwarzkopf</span>
                <span className="text-sm font-black font-mono text-red-300 block mt-0.5">{schwarzkopfNumber}</span>
              </div>
            </div>

            {/* Matrix / Alternative Notation */}
            <div className="flex items-center justify-between text-[10px] text-neutral-400 px-1 pt-0.5">
              <span>Matrix SoColor: <strong className="font-mono text-neutral-200">{matrixNumber}</strong></span>
              <span>Reflect Tone: <strong className="text-neutral-200">{activeSector.tone}</strong></span>
            </div>
          </div>

          {/* Card 3: Neutralization Law & Underlying Pigment Science (Unified) */}
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-3.5 space-y-2.5">
            {/* Header */}
            <div className="flex items-center justify-between text-xs font-bold text-amber-300">
              <span className="flex items-center gap-1.5">
                <span>⚖️</span>
                <span>180° Neutralization Law:</span>
              </span>
              <span className="font-mono text-[10px] text-white bg-neutral-900 px-2 py-0.5 rounded border border-neutral-700">
                Δθ = 180.0° Exact
              </span>
            </div>

            {/* Chemical Equation Box */}
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/90 p-2 text-center font-mono text-xs flex items-center justify-center gap-1.5 flex-wrap">
              <span className="text-amber-400 font-bold">
                {iccNumber} ({activeSector.nameEn.split(" / ")[0]} {activeAngle}°)
              </span>
              <span className="text-neutral-400">+</span>
              <span className="text-cyan-400 font-bold">
                {oppIccNumber} ({activeSector.oppositeNameEn.split(" / ")[0]} {oppositeAngle}°)
              </span>
              <span className="text-neutral-400">=</span>
              <span className="text-emerald-400 font-bold">
                {level}.0 (Neutral Base)
              </span>
            </div>

            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {isNaturalBase
                ? "Natural base contains complete primary pigment balance. No counteracting reflect required."
                : activeSector.neutralizesWhatEn}
            </p>

            {/* Cross-Brand Neutralizers */}
            <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400 pt-1 border-t border-amber-500/20">
              <span>Counter Wella: <strong className="text-white">{oppWellaNumber}</strong></span>
              <span>Counter L&apos;Oréal: <strong className="text-white">{oppIccNumber}</strong></span>
            </div>

            {/* Exposed Underlying Pigment Row */}
            <div className="pt-2 border-t border-neutral-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
              <div className="flex items-center gap-1.5 text-neutral-300">
                <span>🧬 NRP:</span>
                <span className="font-bold text-white px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-700 text-[10px]">
                  {levelMetric.eupName}
                </span>
                <span className="text-[10px] text-neutral-400">({levelMetric.eupMelaninDistribution})</span>
              </div>
              <div className="flex items-center gap-1 text-[10px]">
                <span className="text-neutral-400">Anti-Warmth:</span>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                  {levelMetric.eupCancelReflect} ({levelMetric.eupCancelToneName})
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
