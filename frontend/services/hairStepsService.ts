/**
 * Hair Colour Pathway & Step-by-Step Achievement Service
 * 
 * Computes deterministic, chemically validated salon steps to transform
 * starting hair (assessment) into the desired target hair colour.
 * Obeying the fundamental laws of cosmetology:
 * 1. "Color does not lift color" (artificial dye requires lightening/cleansing).
 * 2. Virgin lift depends on developer volume (10 Vol = deposit, 20 Vol = 1-2 levels, 30 Vol = 2-3 levels).
 * 3. Lift exposes underlying natural pigment (warmth) governed by the Oswald Colour Wheel.
 * 4. Opposite tones on the colour wheel counteract and neutralize unwanted brassiness.
 * 5. Darkening by 2+ levels strictly requires repigmentation (filler) to prevent hollow green cast.
 * 6. 30%+ grey hair requires adding 50% natural base (/0) to guarantee opaque coverage.
 */

import { HairAssessmentInput } from "../types/assessment";
import { TargetColourInput } from "../types/formulation";
import { ToneFamily, UniversalLevel } from "../types/uhcr";

export interface UnderlyingPigmentInfo {
  level: UniversalLevel;
  pigmentNameEn: string;
  pigmentNameHi: string;
  colorHex: string;
  neutralizingTone: ToneFamily;
  neutralizingNameEn: string;
  neutralizingNameHi: string;
  neutralizingShadeCode: string;
  reasonEn: string;
  reasonHi: string;
}

export interface AchievementStep {
  stepNumber: number;
  icon: string;
  titleEn: string;
  titleHi: string;
  instructionEn: string;
  instructionHi: string;
  chemicalActionEn: string;
  chemicalActionHi: string;
  timing: string;
  developerRequired?: string;
  mixingRatio?: string;
  audioEn: string;
  audioHi: string;
  isCrucial?: boolean;
}

export interface HairAchievementPlan {
  startingLevel: UniversalLevel;
  targetLevel: UniversalLevel;
  levelDelta: number; // positive = lift, negative = darken, 0 = same level
  actionType: "VIRGIN_LIFT" | "ARTIFICIAL_DECOLORIZE" | "SAME_LEVEL" | "REPIGMENTATION_DARKEN" | "DIRECT_DARKEN";
  actionSummaryEn: string;
  actionSummaryHi: string;
  exposedPigment: UnderlyingPigmentInfo;
  steps: AchievementStep[];
  hasArtificialColor: boolean;
  isBleachRequired: boolean;
  isRepigmentationRequired: boolean;
  isGreyCoverageNeeded: boolean;
  greyPercentage: number;
  safetyAlerts: Array<{ en: string; hi: string; severity: "WARNING" | "BLOCKED" | "INFO" }>;
}

// Universal Underlying Exposed Pigments by Depth Level (ICC)
export const UNDERLYING_PIGMENTS: Record<UniversalLevel, UnderlyingPigmentInfo> = {
  1: {
    level: 1,
    pigmentNameEn: "Dense Black / Dark Blue-Black",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#09090b",
    neutralizingTone: "NATURAL",
    neutralizingNameEn: "Natural Tone",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/0",
    reasonEn: "Maximum eumelanin density; no underlying warm reflect exposed.",
    reasonHi: "Professional Salon Step",
  },
  2: {
    level: 2,
    pigmentNameEn: "Dark Brown-Black",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#1c140e",
    neutralizingTone: "NATURAL",
    neutralizingNameEn: "Natural Base",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/0",
    reasonEn: "Extremely deep melanin base.",
    reasonHi: "Professional Salon Step",
  },
  3: {
    level: 3,
    pigmentNameEn: "Deep Red-Brown",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#3b1e15",
    neutralizingTone: "GREEN",
    neutralizingNameEn: "Matte Green Anti-Red",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/2 (.7)",
    reasonEn: "Deep red undertone starts surfacing. Use green reflect to neutralize red.",
    reasonHi: "Professional Salon Step",
  },
  4: {
    level: 4,
    pigmentNameEn: "Red Undertone",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#7f1d1d",
    neutralizingTone: "GREEN",
    neutralizingNameEn: "Green / Matte Ash",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/2 or /19",
    reasonEn: "Raw red pigment exposed. Green is opposite Red on the colour wheel.",
    reasonHi: "Professional Salon Step",
  },
  5: {
    level: 5,
    pigmentNameEn: "Red-Orange (Auburn)",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#9a3412",
    neutralizingTone: "BLUE",
    neutralizingNameEn: "Blue-Green / Ash",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/1 or /19",
    reasonEn: "Red and orange mixture. Blue-green cancels red-orange warmth.",
    reasonHi: "Professional Salon Step",
  },
  6: {
    level: 6,
    pigmentNameEn: "Orange (Copper Undertone)",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#c2410c",
    neutralizingTone: "BLUE",
    neutralizingNameEn: "Blue / Ash Anti-Orange",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/1 (.1)",
    reasonEn: "Prominent orange exposed. Blue is opposite Orange on the colour wheel.",
    reasonHi: "Professional Salon Step",
  },
  7: {
    level: 7,
    pigmentNameEn: "Orange-Yellow (Gold-Copper)",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#d97706",
    neutralizingTone: "PEARL",
    neutralizingNameEn: "Blue-Violet / Pearl Cendré",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/8 or /16",
    reasonEn: "Orange and yellow co-exist. Blue-violet cancels both orange and yellow brassiness.",
    reasonHi: "Professional Salon Step",
  },
  8: {
    level: 8,
    pigmentNameEn: "Yellow (Gold Undertone)",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#eab308",
    neutralizingTone: "VIOLET",
    neutralizingNameEn: "Violet / Purple Anti-Yellow",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/6 (.2)",
    reasonEn: "Pure yellow exposed. Violet is opposite Yellow on the colour wheel.",
    reasonHi: "Professional Salon Step",
  },
  9: {
    level: 9,
    pigmentNameEn: "Pale Yellow",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#fde047",
    neutralizingTone: "PEARL",
    neutralizingNameEn: "Pale Violet / Irisé Pearl",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/96 or /86",
    reasonEn: "Soft yellow melanin. Delicate violet-pearl creates a clean icy/neutral blonde.",
    reasonHi: "Professional Salon Step",
  },
  10: {
    level: 10,
    pigmentNameEn: "Extra Pale Ivory / Lightest Yellow",
    pigmentNameHi: "Professional Salon Step",
    colorHex: "#fef08a",
    neutralizingTone: "VIOLET",
    neutralizingNameEn: "Pastel Violet Toner",
    neutralizingNameHi: "Professional Salon Step",
    neutralizingShadeCode: "/16 or /96",
    reasonEn: "Trace yellow remaining. Pastel toner produces Scandinavian pure platinum.",
    reasonHi: "Professional Salon Step",
  },
};

/**
 * Calculates step-by-step hair coloring pathway
 */
export function calculateHairAchievementPlan(
  assessment: HairAssessmentInput | null,
  target: TargetColourInput
): HairAchievementPlan {
  const startingLevel: UniversalLevel = (assessment?.roots?.observed_level || 4) as UniversalLevel;
  const targetLevel: UniversalLevel = (target.universal_level || 7) as UniversalLevel;
  const levelDelta = targetLevel - startingLevel;

  const hasArtificialColor = Boolean(
    assessment?.roots?.existing_artificial_colour ||
    assessment?.mid_lengths?.existing_artificial_colour ||
    assessment?.ends?.existing_artificial_colour
  );

  const greyPercentage = Math.max(
    assessment?.roots?.grey_percentage || 0,
    assessment?.mid_lengths?.grey_percentage || 0
  );

  const hasHenna = Boolean(assessment?.history?.has_metallic_salts_or_henna);
  const hasRelaxer = Boolean(assessment?.history?.has_sodium_hydroxide_relaxer);

  const exposedPigment = UNDERLYING_PIGMENTS[targetLevel] || UNDERLYING_PIGMENTS[7];

  const safetyAlerts: Array<{ en: string; hi: string; severity: "WARNING" | "BLOCKED" | "INFO" }> = [];

  if (hasHenna) {
    safetyAlerts.push({
      en: "Metallic Salts / Henna present. Chemical lighteners cause violent heat & severe breakage! Strand test mandatory.",
      hi: "Professional Salon Step",
      severity: "BLOCKED",
    });
  }

  if (hasRelaxer) {
    safetyAlerts.push({
      en: "Sodium Hydroxide Relaxer treated hair. High lift peroxide and bleach will dissolve hair bonds.",
      hi: "Professional Salon Step",
      severity: "WARNING",
    });
  }

  if (greyPercentage >= 30) {
    safetyAlerts.push({
      en: `${greyPercentage}% Grey Hair detected. Add 50% Natural Base (/0) to guarantee 100% opaque grey coverage.`,
      hi: `Professional Salon Step`,
      severity: "INFO",
    });
  }

  let actionType: HairAchievementPlan["actionType"] = "SAME_LEVEL";
  let actionSummaryEn = "";
  let actionSummaryHi = "";
  const steps: AchievementStep[] = [];
  let isBleachRequired = false;
  let isRepigmentationRequired = false;

  // CASE 1: LIFTING OVER PREVIOUSLY COLOURED HAIR
  if (levelDelta > 0 && hasArtificialColor) {
    actionType = "ARTIFICIAL_DECOLORIZE";
    isBleachRequired = true;
    actionSummaryEn = `Artificial Color Lift: Pre-lightening required (+${levelDelta} levels lift). Tint cannot lift tint.`;
    actionSummaryHi = `Professional Salon Step`;

    steps.push({
      stepNumber: 1,
      icon: "⚡",
      titleEn: "Step 1: Bleach Cleansing / Pre-Lightening",
      titleHi: "Professional Salon Step",
      instructionEn: `Apply Multi-Blonde powder with 20 Vol (6%) developer (1:1.5 ratio) on mid-lengths and ends to lift past previous dye to Level ${targetLevel}.`,
      instructionHi: `Professional Salon Step`,
      chemicalActionEn: `Removes synthetic artificial pigment to reveal underlying natural depth (Level ${targetLevel} ${exposedPigment.pigmentNameEn}).`,
      chemicalActionHi: `Professional Salon Step`,
      timing: "30–45 mins (Visual check every 10 min)",
      developerRequired: "20 Vol (6%)",
      mixingRatio: "1:1.5",
      audioEn: `Step 1: Apply lightener with 20 volume developer to lift previous artificial dye to level ${targetLevel}.`,
      audioHi: `Professional Salon Step`,
      isCrucial: true,
    });

    steps.push({
      stepNumber: 2,
      icon: "🎡",
      titleEn: "Step 2: Underlying Pigment Neutralization",
      titleHi: "Professional Salon Step",
      instructionEn: `Lightening exposes raw ${exposedPigment.pigmentNameEn}. Use opposite tone (${exposedPigment.neutralizingNameEn} - ${exposedPigment.neutralizingShadeCode}) on the colour wheel to balance warmth.`,
      instructionHi: `Professional Salon Step`,
      chemicalActionEn: exposedPigment.reasonEn,
      chemicalActionHi: exposedPigment.reasonHi,
      timing: "During Step 3 formulation",
      audioEn: `Step 2: Lightening exposes raw undertone. Colour wheel tone ${exposedPigment.neutralizingNameEn} counteracts unwanted brassiness.`,
      audioHi: `Professional Salon Step`,
    });

    steps.push({
      stepNumber: 3,
      icon: "🥣",
      titleEn: "Step 3: Target Shade Deposit & Tone",
      titleHi: "Professional Salon Step",
      instructionEn: `Mix target shade Level ${targetLevel} ${target.primary_tone} with 1.9% (6 Vol) or 3% (10 Vol) developer (1:2 ratio) for gentle, rich deposit.`,
      instructionHi: `Professional Salon Step`,
      chemicalActionEn: "Deposits target tone without opening hair cuticle harshly, locking in shine and longevity.",
      chemicalActionHi: "Deposits luminous tone without damage and seals cuticular shine.",
      timing: "15–20 minutes",
      developerRequired: "6 Vol (1.9%) or 10 Vol (3%)",
      mixingRatio: "1:2",
      audioEn: `Step 3: Deposit target shade with low volume developer for 20 minutes to achieve desired tone.`,
      audioHi: `Professional Salon Step`,
    });

    steps.push({
      stepNumber: 4,
      icon: "🧴",
      titleEn: "Step 4: Emulsify, Rinse & Cuticle Seal",
      titleHi: "Professional Salon Step",
      instructionEn: "Emulsify with warm water at basin for 2 minutes, rinse thoroughly, and apply acidic Post-Color Treatment (pH 4.5) to normalize hair.",
      instructionHi: "Professional Salon Step",
      chemicalActionEn: "Recloses hair cuticles and stops oxidation process.",
      chemicalActionHi: "Professional Salon Step",
      timing: "5 minutes",
      audioEn: "Step 4: Emulsify at the basin, rinse cleanly and apply pH sealing post-color treatment.",
      audioHi: "Professional Salon Step",
    });
  }

  // CASE 2: VIRGIN HAIR LIFT (Delta > 0, No Artificial Color)
  else if (levelDelta > 0) {
    actionType = "VIRGIN_LIFT";
    const devVol = levelDelta === 1 ? 20 : levelDelta === 2 ? 20 : levelDelta === 3 ? 30 : 40;
    const devPct = devVol === 20 ? "6%" : devVol === 30 ? "9%" : "12%";

    if (levelDelta <= 3) {
      actionSummaryEn = `Single-Process Permanent Lift: +${levelDelta} levels lift using ${devVol} Vol (${devPct}) developer.`;
      actionSummaryHi = `Professional Salon Step`;

      steps.push({
        stepNumber: 1,
        icon: "🥣",
        titleEn: `Step 1: Formula Preparation (${devVol} Vol Developer)`,
        titleHi: `Step 1: Formula Preparation (${devVol} Vol Developer)`,
        instructionEn: `Mix target shade Level ${targetLevel} ${target.primary_tone} with ${devVol} Vol (${devPct}) developer in a 1:1 ratio. ${
          greyPercentage >= 30 ? "Include 50% Natural base (/0) for grey coverage." : ""
        }`,
        instructionHi: `Mix target shade Level ${targetLevel} with ${devVol} Vol (${devPct}) developer 1:1 on digital scale.`,
        chemicalActionEn: `Hydrogen peroxide lifts natural melanin by ${levelDelta} levels while simultaneously depositing target reflect.`,
        chemicalActionHi: `Professional Salon Step`,
        timing: "Mix fresh on digital scale",
        developerRequired: `${devVol} Vol (${devPct})`,
        mixingRatio: "1:1",
        audioEn: `Step 1: Mix target shade with ${devVol} volume developer 1:1 on digital scale.`,
        audioHi: `Professional Salon Step`,
      });

      steps.push({
        stepNumber: 2,
        icon: "🎡",
        titleEn: "Step 2: Colour Wheel Undertone Balancing",
        titleHi: "Professional Salon Step",
        instructionEn: `Lifting virgin Level ${startingLevel} hair to Level ${targetLevel} exposes ${exposedPigment.pigmentNameEn}. ${
          target.primary_tone === "ASH" || target.primary_tone === "PEARL"
            ? `Formula uses ${exposedPigment.neutralizingNameEn} to eliminate brassiness for a pure cool finish.`
            : `Natural warmth supports your ${target.primary_tone} target tone for rich, glowing dimension.`
        }`,
        instructionHi: `Lifting hair reveals ${exposedPigment.pigmentNameEn}. Colour wheel formula balances warmth for pure reflect.`,
        chemicalActionEn: exposedPigment.reasonEn,
        chemicalActionHi: exposedPigment.reasonHi,
        timing: "Formulation adjustment",
        audioEn: `Step 2: Natural lift reveals ${exposedPigment.pigmentNameEn}. Colour wheel counteracts unwanted brassiness.`,
        audioHi: `Professional Salon Step`,
      });

      steps.push({
        stepNumber: 3,
        icon: "⏱️",
        titleEn: "Step 3: Zoned Application (Prevent Hot Roots)",
        titleHi: "Professional Salon Step",
        instructionEn: "Apply to mid-lengths and ends first (leaving 1.5 cm scalp regrowth). Scalp heat lifts faster; apply to roots during the final 20 minutes.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Body heat accelerates lift rate near the scalp; phased application produces uniform root-to-end tone.",
        chemicalActionHi: "Professional Salon Step",
        timing: "Lengths: 35–40 mins | Roots: last 20 mins",
        audioEn: "Step 3: Apply to lengths first. Apply to scalp roots for the last 20 minutes to prevent uneven hot roots.",
        audioHi: "Professional Salon Step",
        isCrucial: true,
      });

      steps.push({
        stepNumber: 4,
        icon: "🧴",
        titleEn: "Step 4: Basin Emulsification & Rinse",
        titleHi: "Professional Salon Step",
        instructionEn: "Add a splash of water, massage hair at basin for 2 minutes to emulsify color, rinse until water runs clear, and apply color stabilizer conditioner.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Gently lifts color off scalp and locks shine into hair shaft.",
        chemicalActionHi: "Professional Salon Step",
        timing: "5 minutes",
        audioEn: "Step 4: Emulsify with water at the sink, rinse thoroughly and condition.",
        audioHi: "Professional Salon Step",
      });
    } else {
      // Delta > 3 on virgin hair: Lightener mandatory
      isBleachRequired = true;
      actionSummaryEn = `High-Lift / Lightening: +${levelDelta} levels lift requires double process (Pre-lightener + Toner).`;
      actionSummaryHi = `Professional Salon Step`;

      steps.push({
        stepNumber: 1,
        icon: "⚡",
        titleEn: "Step 1: Multi-Blonde Pre-Lightening",
        titleHi: "Professional Salon Step",
        instructionEn: `Mix Blondor powder with 20 Vol developer (1:1.5). Apply evenly to lift virgin hair to underlying Level ${targetLevel} (${exposedPigment.pigmentNameEn}).`,
        instructionHi: `Professional Salon Step`,
        chemicalActionEn: "Dissolves dense eumelanin to clear the canvas for high-level target reflect.",
        chemicalActionHi: "Professional Salon Step",
        timing: "Up to 45 mins (Visual check every 10 min)",
        developerRequired: "20 Vol (6%)",
        mixingRatio: "1:1.5",
        audioEn: `Step 1: Pre-lighten virgin hair with blonde powder and 20 volume to level ${targetLevel}.`,
        audioHi: `Professional Salon Step`,
        isCrucial: true,
      });

      steps.push({
        stepNumber: 2,
        icon: "🥣",
        titleEn: "Step 2: Toning & Target Deposit",
        titleHi: "Professional Salon Step",
        instructionEn: `Apply target shade Level ${targetLevel} with 1.9% (6 Vol) deposit developer (1:2 ratio) to deposit pure, luminous ${target.primary_tone} tone.`,
        instructionHi: `Professional Salon Step`,
        chemicalActionEn: "Fills the pre-lightened hair shaft with desired tone reflect without further cuticle swelling.",
        chemicalActionHi: "Professional Salon Step",
        timing: "15–20 minutes",
        developerRequired: "6 Vol (1.9%)",
        mixingRatio: "1:2",
        audioEn: `Step 2: Deposit target tone using low volume developer for 20 minutes.`,
        audioHi: `Professional Salon Step`,
      });

      steps.push({
        stepNumber: 3,
        icon: "🧴",
        titleEn: "Step 3: Post-Color Sealing Treatment",
        titleHi: "Professional Salon Step",
        instructionEn: "Rinse cleanly and apply bond-building acidic mask to seal cuticle and restore tensile strength.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Acidic pH treatment normalizes cuticle scales.",
        chemicalActionHi: "Professional Salon Step",
        timing: "5–10 minutes",
        audioEn: "Step 3: Rinse and apply acidic hair bond mask.",
        audioHi: "Professional Salon Step",
      });
    }
  }

  // CASE 3: SAME LEVEL COLOURING (Delta == 0)
  else if (levelDelta === 0) {
    actionType = "SAME_LEVEL";
    actionSummaryEn = `Tone-on-Tone Colouring (Same Level ${targetLevel}): Pure tone enrichment or grey coverage without depth lift.`;
    actionSummaryHi = `Professional Salon Step`;

    steps.push({
      stepNumber: 1,
      icon: "🥣",
      titleEn: "Step 1: Formula Mix on Digital Scale",
      titleHi: "Professional Salon Step",
      instructionEn: `Mix Level ${targetLevel} ${target.primary_tone} with ${
        greyPercentage >= 30 ? "20 Vol (6%) Developer for 100% Grey Coverage (1:1)" : "10 Vol (3%) or 6 Vol (1.9%) Developer for Gentle Deposit (1:1)"
      }.`,
      instructionHi: `Mix Level ${targetLevel} ${target.primary_tone} with ${greyPercentage >= 30 ? "20 Vol developer for grey coverage" : "10 Vol developer for gentle deposit"}.`,
      chemicalActionEn: greyPercentage >= 30 ? "Softens resistant grey hair cuticle for maximum pigment penetration." : "Deposits tone without lifting natural melanin.",
      chemicalActionHi: greyPercentage >= 30 ? "Softens resistant grey hair cuticle for maximum coverage." : "Deposits tone without lifting natural melanin.",
      timing: "Mix fresh on scale",
      developerRequired: greyPercentage >= 30 ? "20 Vol (6%)" : "10 Vol (3%)",
      mixingRatio: "1:1",
      audioEn: `Step 1: Mix target shade with ${greyPercentage >= 30 ? "20" : "10"} volume developer 1:1 on digital scale.`,
      audioHi: `Professional Salon Step`,
    });

    steps.push({
      stepNumber: 2,
      icon: "🖌️",
      titleEn: "Step 2: Root-to-Ends Application",
      titleHi: "Professional Salon Step",
      instructionEn: "Apply with tint brush to roots first. Comb or massage through to mid-lengths and ends for the remaining development time.",
      instructionHi: "Professional Salon Step",
      chemicalActionEn: "Ensures complete saturation across all hair sections.",
      chemicalActionHi: "Professional Salon Step",
      timing: "30–35 minutes total",
      audioEn: "Step 2: Apply to roots first, then emulsify through ends for uniform coverage.",
      audioHi: "Professional Salon Step",
    });

    steps.push({
      stepNumber: 3,
      icon: "🧴",
      titleEn: "Step 3: Rinse & Post-Color Care",
      titleHi: "Professional Salon Step",
      instructionEn: "Rinse thoroughly with lukewarm water until runoff is clear. Apply color protective conditioner.",
      instructionHi: "Professional Salon Step",
      chemicalActionEn: "Removes alkaline residue and stabilizes pigment inside cortex.",
      chemicalActionHi: "Professional Salon Step",
      timing: "5 minutes",
      audioEn: "Step 3: Rinse until water runs clear and condition.",
      audioHi: "Professional Salon Step",
    });
  }

  // CASE 4: GOING DARKER (Delta < 0)
  else {
    const depthDarkened = Math.abs(levelDelta);
    if (depthDarkened >= 2) {
      actionType = "REPIGMENTATION_DARKEN";
      isRepigmentationRequired = true;
      actionSummaryEn = `Going Darker (-${depthDarkened} Levels): Pre-pigmentation / Repigmentation filler MANDATORY to prevent hollow greenish fade!`;
      actionSummaryHi = `Professional Salon Step`;

      steps.push({
        stepNumber: 1,
        icon: "⚠️",
        titleEn: "Step 1: Pre-Pigmentation / Repigmentation (Color Filler)",
        titleHi: "Professional Salon Step",
        instructionEn: `CRITICAL STEP: Light hair lacks warm melanin. Apply a warm copper/gold filler (Level ${targetLevel} /4 or /3 mixed with warm water or 1.9% dev) onto porous lengths. Blot excess; do NOT rinse!`,
        instructionHi: `Professional Salon Step`,
        chemicalActionEn: "Restores missing foundational warm pheomelanin so dark tint has a base to anchor upon, preventing hollow muddy/green results.",
        chemicalActionHi: "Restores missing warm undertone filler to prevent hollow or muddy results.",
        timing: "Apply & blot excess (5–10 mins)",
        developerRequired: "Warm Water or 1.9% (6 Vol)",
        mixingRatio: "1:2 (with warm water)",
        audioEn: "Step 1: Apply warm filler shade to lengths first. This prevents the hair from turning muddy or green.",
        audioHi: "Professional Salon Step",
        isCrucial: true,
      });

      steps.push({
        stepNumber: 2,
        icon: "🥣",
        titleEn: "Step 2: Target Dark Shade Application",
        titleHi: "Professional Salon Step",
        instructionEn: `Apply target shade Level ${targetLevel} ${target.primary_tone} mixed with 10 Vol (3%) developer (1:1 ratio) directly over the filled hair.`,
        instructionHi: `Professional Salon Step`,
        chemicalActionEn: "Oxidative pigments link to the filler pigments, creating a rich, opaque, multidimensional deep tone.",
        chemicalActionHi: "Locks rich target depth over base filler for long-lasting vibrant color.",
        timing: "25–30 minutes",
        developerRequired: "10 Vol (3%)",
        mixingRatio: "1:1",
        audioEn: `Step 2: Apply target dark shade with 10 volume developer over the filler for 30 minutes.`,
        audioHi: `Professional Salon Step`,
      });

      steps.push({
        stepNumber: 3,
        icon: "🧴",
        titleEn: "Step 3: Basin Emulsification & Seal",
        titleHi: "Professional Salon Step",
        instructionEn: "Rinse thoroughly with cool water and apply acidic pH locking treatment.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Locks large oxidative pigment molecules permanently inside cortex.",
        chemicalActionHi: "Professional Salon Step",
        timing: "5 minutes",
        audioEn: "Step 3: Rinse with cool water and apply acidic post-color seal.",
        audioHi: "Professional Salon Step",
      });
    } else {
      // 1 level darker: direct deposit
      actionType = "DIRECT_DARKEN";
      actionSummaryEn = `Direct Deposit (-1 Level): Gentle deposit with 10 Vol (3%) developer.`;
      actionSummaryHi = `Professional Salon Step`;

      steps.push({
        stepNumber: 1,
        icon: "🥣",
        titleEn: "Step 1: Formula Preparation",
        titleHi: "Step 1: Formula Preparation",
        instructionEn: `Mix Level ${targetLevel} ${target.primary_tone} with 10 Vol (3%) developer in a 1:1 ratio on digital scale.`,
        instructionHi: `Professional Salon Step`,
        chemicalActionEn: "Deposits tone without lifting underlying melanin.",
        chemicalActionHi: "Professional Salon Step",
        timing: "Mix fresh on scale",
        developerRequired: "10 Vol (3%)",
        mixingRatio: "1:1",
        audioEn: "Step 1: Mix target shade with 10 volume developer 1:1 on digital scale.",
        audioHi: "Professional Salon Step",
      });

      steps.push({
        stepNumber: 2,
        icon: "🖌️",
        titleEn: "Step 2: Complete Saturation & Processing",
        titleHi: "Professional Salon Step",
        instructionEn: "Apply from roots to ends with tint brush. Process for 25–30 minutes.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Ensures uniform depth absorption.",
        chemicalActionHi: "Professional Salon Step",
        timing: "25–30 minutes",
        audioEn: "Step 2: Apply evenly from roots to ends for 30 minutes.",
        audioHi: "Professional Salon Step",
      });

      steps.push({
        stepNumber: 3,
        icon: "🧴",
        titleEn: "Step 3: Rinse & Condition",
        titleHi: "Professional Salon Step",
        instructionEn: "Rinse cleanly and condition.",
        instructionHi: "Professional Salon Step",
        chemicalActionEn: "Cuticle sealing.",
        chemicalActionHi: "Professional Salon Step",
        timing: "5 minutes",
        audioEn: "Step 3: Rinse and condition.",
        audioHi: "Professional Salon Step",
      });
    }
  }

  return {
    startingLevel,
    targetLevel,
    levelDelta,
    actionType,
    actionSummaryEn,
    actionSummaryHi,
    exposedPigment,
    steps,
    hasArtificialColor,
    isBleachRequired,
    isRepigmentationRequired,
    isGreyCoverageNeeded: greyPercentage >= 30,
    greyPercentage,
    safetyAlerts,
  };
}
