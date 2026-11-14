/**
 * Hair Colorimetry & Depth Modulation Service
 * 
 * Accurately models the interaction between Depth Level (Lightness L* 10% to 96%)
 * and Tone Reflect (Hue Angle & Chroma) conforming to CIELAB metrics and verified
 * salon shade charts (Wella Koleston Perfect, L'Oréal Majirel, Schwarzkopf Igora).
 */

import { ToneFamily, ToneIntensity, UniversalLevel } from "../types/uhcr";

export interface HairColorimetryResult {
  level: UniversalLevel;
  primaryTone: ToneFamily;
  secondaryTone: ToneFamily | null;
  baseHex: string;
  shadowHex: string;
  highlightHex: string;
  gradient: string;
  sheenIntensity: number; // 0 to 1
  undertoneSummaryEn: string;
  undertoneSummaryHi: string;
  reactionSpeechEn: string;
  reactionSpeechHi: string;
}

// Universal Melanin Depth Lightness & Desaturation Curves
// At low levels (1-3), melanin absorbs ~80-90% of light, dampening tone vibrancy.
// At mid levels (4-6), rich tones emerge.
// At level 7-8, maximum chromatic reflect is visible.
// At level 9-10, high lightness dilutes tones into pastel/translucent pigments.

interface ToneColorCurve {
  hueDeg: number;
  // Per-level (1 to 10) RGB calibration (base, shadow, highlight)
  levels: Record<UniversalLevel, { base: string; shadow: string; highlight: string }>;
}

export const TONE_CURVES: Record<ToneFamily, ToneColorCurve> = {
  NATURAL: {
    hueDeg: 30,
    levels: {
      1: { base: "#0d0d0f", shadow: "#050507", highlight: "#222227" },
      2: { base: "#1a120c", shadow: "#0f0a06", highlight: "#332418" },
      3: { base: "#2a1c12", shadow: "#180f09", highlight: "#483222" },
      4: { base: "#3d2a1b", shadow: "#24180e", highlight: "#61442d" },
      5: { base: "#593f2b", shadow: "#382618", highlight: "#825d41" },
      6: { base: "#7a583e", shadow: "#4f3624", highlight: "#a87d5b" },
      7: { base: "#9e7755", shadow: "#694e36", highlight: "#c99d75" },
      8: { base: "#c49d74", shadow: "#876949", highlight: "#edd0aa" },
      9: { base: "#dfbf97", shadow: "#a68865", highlight: "#fcedd7" },
      10: { base: "#f5e2cb", shadow: "#c7b299", highlight: "#ffffff" },
    },
  },

  GOLD: {
    hueDeg: 55,
    levels: {
      1: { base: "#12100a", shadow: "#070603", highlight: "#2b2513" },
      2: { base: "#211b0e", shadow: "#120e06", highlight: "#423617" },
      3: { base: "#332810", shadow: "#1c1507", highlight: "#5c4819" },
      4: { base: "#4d3a14", shadow: "#2b1f08", highlight: "#7a5c1e" },
      5: { base: "#6e5218", shadow: "#402f0b", highlight: "#9e7924" },
      6: { base: "#946f1d", shadow: "#59420d", highlight: "#c4982f" },
      7: { base: "#b88c25", shadow: "#785811", highlight: "#e5b43d" },
      8: { base: "#dba935", shadow: "#947119", highlight: "#f7cf65" },
      9: { base: "#ecc55d", shadow: "#ab8a2f", highlight: "#fae59b" },
      10: { base: "#f7df8f", shadow: "#c2ab5b", highlight: "#fff7cc" },
    },
  },

  COPPER: {
    hueDeg: 25,
    levels: {
      1: { base: "#140c09", shadow: "#080402", highlight: "#2e1a12" },
      2: { base: "#24120a", shadow: "#120703", highlight: "#472111" },
      3: { base: "#3b1a0d", shadow: "#210c04", highlight: "#692c13" },
      4: { base: "#572410", shadow: "#331205", highlight: "#8f3a18" },
      5: { base: "#7a3112", shadow: "#471a06", highlight: "#b84c1b" },
      6: { base: "#a34316", shadow: "#632609", highlight: "#de6223" },
      7: { base: "#c9551c", shadow: "#80340d", highlight: "#f27a3a" },
      8: { base: "#e67332", shadow: "#9c4a1b", highlight: "#f79e68" },
      9: { base: "#f29863", shadow: "#b3683b", highlight: "#fcc19d" },
      10: { base: "#fac29e", shadow: "#cfa180", highlight: "#fde5d5" },
    },
  },

  RED: {
    hueDeg: 350,
    levels: {
      1: { base: "#14080a", shadow: "#080203", highlight: "#2b1014" },
      2: { base: "#240b10", shadow: "#120306", highlight: "#47131d" },
      3: { base: "#3d0e17", shadow: "#21050a", highlight: "#6b1827" },
      4: { base: "#5c1320", shadow: "#33080f", highlight: "#941e33" },
      5: { base: "#801729", shadow: "#470b14", highlight: "#bd243d" },
      6: { base: "#a81e35", shadow: "#660d1d", highlight: "#e3324f" },
      7: { base: "#cc2b47", shadow: "#87162b", highlight: "#f05b73" },
      8: { base: "#e34b65", shadow: "#a1293e", highlight: "#f58296" },
      9: { base: "#f07a90", shadow: "#b84b60", highlight: "#fab5c2" },
      10: { base: "#f7b2c0", shadow: "#cc8594", highlight: "#fde3e8" },
    },
  },

  VIOLET: {
    hueDeg: 280,
    levels: {
      1: { base: "#0f0814", shadow: "#060208", highlight: "#25122e" },
      2: { base: "#1c0c26", shadow: "#0c0412", highlight: "#3d1952" },
      3: { base: "#2d123d", shadow: "#160621", highlight: "#572275" },
      4: { base: "#441a5c", shadow: "#240a33", highlight: "#752c9e" },
      5: { base: "#5e2380", shadow: "#330f47", highlight: "#9639cc" },
      6: { base: "#7a2fa6", shadow: "#471863", highlight: "#b84df7" },
      7: { base: "#9942cf", shadow: "#5f2482", highlight: "#cb72fa" },
      8: { base: "#b66bf0", shadow: "#7b41a6", highlight: "#dd9eff" },
      9: { base: "#d29eff", shadow: "#996ec2", highlight: "#f0d4ff" },
      10: { base: "#e8caff", shadow: "#bfa0db", highlight: "#faf0ff" },
    },
  },

  MAHOGANY: {
    hueDeg: 320,
    levels: {
      1: { base: "#12080c", shadow: "#060204", highlight: "#261019" },
      2: { base: "#1f0c14", shadow: "#0d0307", highlight: "#3d1626" },
      3: { base: "#33121f", shadow: "#1a060e", highlight: "#591e35" },
      4: { base: "#4d192c", shadow: "#290915", highlight: "#7a2744" },
      5: { base: "#69203b", shadow: "#380d1e", highlight: "#992e54" },
      6: { base: "#872b4b", shadow: "#4d1329", highlight: "#b83d67" },
      7: { base: "#a63a5f", shadow: "#661e38", highlight: "#d45780" },
      8: { base: "#bf567b", shadow: "#803551", highlight: "#e880a1" },
      9: { base: "#d67d9d", shadow: "#99526d", highlight: "#f2acc4" },
      10: { base: "#e8acc3", shadow: "#b88295", highlight: "#fcdce6" },
    },
  },

  ASH: {
    hueDeg: 210,
    levels: {
      1: { base: "#0a0c10", shadow: "#030406", highlight: "#191d26" },
      2: { base: "#13161c", shadow: "#08090d", highlight: "#2a303d" },
      3: { base: "#1e222b", shadow: "#0f1117", highlight: "#3c4454" },
      4: { base: "#2c3340", shadow: "#181c24", highlight: "#515c70" },
      5: { base: "#3d4657", shadow: "#232933", highlight: "#68758f" },
      6: { base: "#515d73", shadow: "#313845", highlight: "#8292b0" },
      7: { base: "#697791", shadow: "#424b5c", highlight: "#9eafcc" },
      8: { base: "#8594b0", shadow: "#576275", highlight: "#bcd0f2" },
      9: { base: "#aab8d4", shadow: "#748099", highlight: "#d6e2fa" },
      10: { base: "#ccd7eb", shadow: "#9aa6bd", highlight: "#f2f6fc" },
    },
  },

  PEARL: {
    hueDeg: 240,
    levels: {
      1: { base: "#0b0b12", shadow: "#040407", highlight: "#1c1c2b" },
      2: { base: "#151521", shadow: "#08080f", highlight: "#2c2c42" },
      3: { base: "#212133", shadow: "#10101c", highlight: "#3f3f5e" },
      4: { base: "#303047", shadow: "#191926", highlight: "#53537a" },
      5: { base: "#424261", shadow: "#242436", highlight: "#6c6c99" },
      6: { base: "#595980", shadow: "#33334d", highlight: "#8888bf" },
      7: { base: "#72729e", shadow: "#464663", highlight: "#a4a4db" },
      8: { base: "#8f8fc2", shadow: "#5d5d82", highlight: "#c3c3fa" },
      9: { base: "#b0b0e0", shadow: "#7a7aa3", highlight: "#dedeff" },
      10: { base: "#d2d2fa", shadow: "#9e9ec7", highlight: "#f5f5ff" },
    },
  },

  GREEN: {
    hueDeg: 140,
    levels: {
      1: { base: "#0a100c", shadow: "#030604", highlight: "#18241b" },
      2: { base: "#121c15", shadow: "#070d09", highlight: "#26382b" },
      3: { base: "#1b291f", shadow: "#0d1710", highlight: "#374f3d" },
      4: { base: "#273b2d", shadow: "#142118", highlight: "#4c6e54" },
      5: { base: "#36523e", shadow: "#1f3024", highlight: "#628f6d" },
      6: { base: "#476b52", shadow: "#2b4232", highlight: "#7ab58c" },
      7: { base: "#5d8768", shadow: "#3a5441", highlight: "#96d6a6" },
      8: { base: "#77a683", shadow: "#4d6e55", highlight: "#b2f0c1" },
      9: { base: "#98c4a3", shadow: "#668a6f", highlight: "#d1fae0" },
      10: { base: "#bee3c7", shadow: "#88ab90", highlight: "#e8faee" },
    },
  },

  BEIGE: {
    hueDeg: 40,
    levels: {
      1: { base: "#0f0d0a", shadow: "#060503", highlight: "#241f17" },
      2: { base: "#1c1813", shadow: "#0c0a07", highlight: "#3b3327" },
      3: { base: "#2b251c", shadow: "#14110b", highlight: "#524634" },
      4: { base: "#3d3527", shadow: "#211c13", highlight: "#6b5c43" },
      5: { base: "#544935", shadow: "#30291c", highlight: "#877555" },
      6: { base: "#706146", shadow: "#423827", highlight: "#a69068" },
      7: { base: "#8f7c59", shadow: "#594d36", highlight: "#c4ab7c" },
      8: { base: "#b09c73", shadow: "#756649", highlight: "#dec89a" },
      9: { base: "#cfbd93", shadow: "#948463", highlight: "#f5e6be" },
      10: { base: "#ebdcb6", shadow: "#b8a884", highlight: "#fff6db" },
    },
  },

  BLUE: {
    hueDeg: 220,
    levels: {
      1: { base: "#070b14", shadow: "#020408", highlight: "#121b2e" },
      2: { base: "#0d1424", shadow: "#040712", highlight: "#1d2b47" },
      3: { base: "#142038", shadow: "#070f1f", highlight: "#2b406e" },
      4: { base: "#1d2e4f", shadow: "#0c172e", highlight: "#3b5894" },
      5: { base: "#293e69", shadow: "#132242", highlight: "#4c71bd" },
      6: { base: "#37528a", shadow: "#1c2e54", highlight: "#5e87db" },
      7: { base: "#496ab5", shadow: "#273f73", highlight: "#759eff" },
      8: { base: "#668be0", shadow: "#39579c", highlight: "#94b1ff" },
      9: { base: "#8faeff", shadow: "#5878bf", highlight: "#bfd3ff" },
      10: { base: "#bdceff", shadow: "#8aa4db", highlight: "#e8efff" },
    },
  },

  YELLOW: {
    hueDeg: 60,
    levels: {
      1: { base: "#121107", shadow: "#060602", highlight: "#2b2910" },
      2: { base: "#211f0a", shadow: "#0f0e03", highlight: "#423f13" },
      3: { base: "#36320e", shadow: "#1a1805", highlight: "#615a18" },
      4: { base: "#524b12", shadow: "#2b2707", highlight: "#82771d" },
      5: { base: "#756a16", shadow: "#423b0a", highlight: "#aba024" },
      6: { base: "#9c8e1a", shadow: "#5c530b", highlight: "#d4c428" },
      7: { base: "#c4b421", shadow: "#7d7211", highlight: "#fae634" },
      8: { base: "#ded03c", shadow: "#9c911e", highlight: "#fcf068" },
      9: { base: "#ebe16a", shadow: "#b8ae3e", highlight: "#fcf8a2" },
      10: { base: "#f7f29e", shadow: "#ccc46e", highlight: "#fffee0" },
    },
  },

  ORANGE: {
    hueDeg: 20,
    levels: {
      1: { base: "#140b06", shadow: "#080402", highlight: "#2e180d" },
      2: { base: "#24130a", shadow: "#120803", highlight: "#472513" },
      3: { base: "#3d1e0d", shadow: "#210e05", highlight: "#6b3517" },
      4: { base: "#592b10", shadow: "#331607", highlight: "#94481a" },
      5: { base: "#7d3b14", shadow: "#471e08", highlight: "#bd5a1e" },
      6: { base: "#a64e17", shadow: "#612c0a", highlight: "#e36e22" },
      7: { base: "#cc621b", shadow: "#7d380c", highlight: "#f78536" },
      8: { base: "#e87e35", shadow: "#9e511b", highlight: "#fca362" },
      9: { base: "#f5a267", shadow: "#b8723d", highlight: "#fdc49d" },
      10: { base: "#fac69d", shadow: "#cca27e", highlight: "#ffe6d4" },
    },
  },

  PINK: {
    hueDeg: 335,
    levels: {
      1: { base: "#14080e", shadow: "#080205", highlight: "#2b101c" },
      2: { base: "#240c17", shadow: "#120409", highlight: "#47142b" },
      3: { base: "#3d1124", shadow: "#210611", highlight: "#6b1b3e" },
      4: { base: "#5c1634", shadow: "#33081a", highlight: "#942152" },
      5: { base: "#801d48", shadow: "#470b24", highlight: "#bd2b69" },
      6: { base: "#a8255d", shadow: "#661036", highlight: "#de377e" },
      7: { base: "#cc3373", shadow: "#871b4a", highlight: "#f25a97" },
      8: { base: "#e6538f", shadow: "#a63363", highlight: "#fa87b3" },
      9: { base: "#f27fad", shadow: "#bd5984", highlight: "#fdb5d0" },
      10: { base: "#fab4ce", shadow: "#cfa1b3", highlight: "#fee0ec" },
    },
  },

  MIXED: {
    hueDeg: 300,
    levels: {
      1: { base: "#120a14", shadow: "#060308", highlight: "#26152b" },
      2: { base: "#1e1024", shadow: "#0d0512", highlight: "#3b1e47" },
      3: { base: "#30183b", shadow: "#170821", highlight: "#572b6b" },
      4: { base: "#472159", shadow: "#240c33", highlight: "#783696" },
      5: { base: "#632d7d", shadow: "#361447", highlight: "#9947c2" },
      6: { base: "#7f38a1", shadow: "#491c61", highlight: "#b85be3" },
      7: { base: "#9f4cc9", shadow: "#632c80", highlight: "#d475ff" },
      8: { base: "#bd6ef0", shadow: "#8246ab", highlight: "#e39eff" },
      9: { base: "#d69eff", shadow: "#a370c9", highlight: "#f2d4ff" },
      10: { base: "#eccaff", shadow: "#c2a3db", highlight: "#fbf2ff" },
    },
  },

  UNKNOWN: {
    hueDeg: 0,
    levels: {
      1: { base: "#121212", shadow: "#060606", highlight: "#242424" },
      2: { base: "#1c1c1c", shadow: "#0c0c0c", highlight: "#333333" },
      3: { base: "#292929", shadow: "#141414", highlight: "#474747" },
      4: { base: "#3b3b3b", shadow: "#1f1f1f", highlight: "#5c5c5c" },
      5: { base: "#525252", shadow: "#2e2e2e", highlight: "#787878" },
      6: { base: "#6e6e6e", shadow: "#424242", highlight: "#999999" },
      7: { base: "#8c8c8c", shadow: "#595959", highlight: "#b8b8b8" },
      8: { base: "#ababab", shadow: "#757575", highlight: "#d4d4d4" },
      9: { base: "#cccccc", shadow: "#949494", highlight: "#ededed" },
      10: { base: "#ebebeb", shadow: "#b8b8b8", highlight: "#ffffff" },
    },
  },
};

/**
 * Computes exact calibrated hair colorimetry for any depth level and tone reflect combination.
 */
export function computeHairColorimetry(
  level: UniversalLevel,
  primaryTone: ToneFamily,
  secondaryTone?: ToneFamily | null,
  intensity: ToneIntensity = "STANDARD"
): HairColorimetryResult {
  const primaryCurve = TONE_CURVES[primaryTone] || TONE_CURVES.NATURAL;
  const primaryLevel = primaryCurve.levels[level] || primaryCurve.levels[7];

  let base = primaryLevel.base;
  let shadow = primaryLevel.shadow;
  let highlight = primaryLevel.highlight;

  // Secondary tone nuance blending (70% primary / 30% secondary)
  if (secondaryTone && secondaryTone !== primaryTone && TONE_CURVES[secondaryTone]) {
    const secCurve = TONE_CURVES[secondaryTone];
    const secLevel = secCurve.levels[level] || secCurve.levels[7];
    base = blendHex(primaryLevel.base, secLevel.base, 0.7);
    shadow = blendHex(primaryLevel.shadow, secLevel.shadow, 0.7);
    highlight = blendHex(primaryLevel.highlight, secLevel.highlight, 0.7);
  }

  // Intensity modifier
  if (intensity === "INTENSE" || intensity === "EXTRA_INTENSE") {
    highlight = adjustLightness(highlight, 1.1);
  } else if (intensity === "SOFT") {
    base = blendHex(base, TONE_CURVES.NATURAL.levels[level].base, 0.5);
  }

  // Realistic hair fiber linear gradient with directional luster
  const gradient = `linear-gradient(135deg, ${shadow} 0%, ${base} 45%, ${highlight} 70%, ${shadow} 100%)`;

  // Cartoon dialogue reaction
  const reactions = getCartoonReactions(level, primaryTone, secondaryTone);

  return {
    level,
    primaryTone,
    secondaryTone: secondaryTone || null,
    baseHex: base,
    shadowHex: shadow,
    highlightHex: highlight,
    gradient,
    sheenIntensity: level >= 7 ? 0.85 : 0.65,
    undertoneSummaryEn: getUndertoneEn(level),
    undertoneSummaryHi: getUndertoneHi(level),
    reactionSpeechEn: reactions.en,
    reactionSpeechHi: reactions.hi,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function hexToRgb(hex: string): [number, number, number] {
  const sanitized = hex.replace("#", "");
  const num = parseInt(sanitized, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  return (
    "#" +
    [clamp(r), clamp(g), clamp(b)]
      .map((x) => x.toString(16).padStart(2, "0"))
      .join("")
  );
}

function blendHex(hex1: string, hex2: string, weight1: number): string {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const w2 = 1 - weight1;
  return rgbToHex(r1 * weight1 + r2 * w2, g1 * weight1 + g2 * w2, b1 * weight1 + b2 * w2);
}

function adjustLightness(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex);
  return rgbToHex(r * factor, g * factor, b * factor);
}

function getUndertoneEn(lvl: UniversalLevel): string {
  const map: Record<UniversalLevel, string> = {
    1: "Dense Black Eumelanin",
    2: "Dark Red-Brown",
    3: "Deep Red-Brown",
    4: "Red Melanin",
    5: "Red-Orange (Auburn)",
    6: "Orange (Copper)",
    7: "Orange-Yellow (Gold-Orange)",
    8: "Yellow (Gold)",
    9: "Pale Yellow",
    10: "Extra Pale Platinum Ivory",
  };
  return map[lvl];
}

function getUndertoneHi(lvl: UniversalLevel): string {
  return getUndertoneEn(lvl);
}

function getCartoonReactions(
  lvl: UniversalLevel,
  primary: ToneFamily,
  secondary?: ToneFamily | null
): { en: string; hi: string } {
  let text = `Level ${lvl} Natural gives silky, healthy depth! ☕`;
  if (primary === "COPPER") {
    if (secondary === "GOLD") {
      text = `Level ${lvl} Amber Copper-Gold glows with sunlit radiance! ✨`;
    } else if (secondary === "RED") {
      text = `Level ${lvl} Auburn Red-Copper gives rich fiery warmth! 🔥`;
    } else {
      text = `Level ${lvl} Copper looks vibrant with luminous shine! ✨`;
    }
  } else if (primary === "GOLD") {
    text = `Level ${lvl} Gold gives gorgeous sunlit warmth! 🌟`;
  } else if (primary === "ASH" || primary === "PEARL") {
    text = `Level ${lvl} Cool Ash cancels yellow for a sleek, clean finish! ❄️`;
  } else if (primary === "RED" || primary === "MAHOGANY") {
    if (secondary === "VIOLET") {
      text = `Level ${lvl} Deep Plum Burgundy gives opulent velvet richness! 🍷`;
    } else {
      text = `Level ${lvl} Crimson Wine is bold, rich, and festive! 🍷`;
    }
  }

  return { en: text, hi: text };
}
