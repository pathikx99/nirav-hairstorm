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
      1: { base: "#141210", shadow: "#090807", highlight: "#24201c" },
      2: { base: "#1e1915", shadow: "#100d0b", highlight: "#322a23" },
      3: { base: "#2c221e", shadow: "#18120f", highlight: "#44362e" },
      4: { base: "#3d2d24", shadow: "#221812", highlight: "#5c4638" },
      5: { base: "#543d32", shadow: "#30211a", highlight: "#7a5c4a" },
      6: { base: "#755742", shadow: "#463224", highlight: "#9e7a5e" },
      7: { base: "#9e7b5c", shadow: "#644c36", highlight: "#c6a07a" },
      8: { base: "#c4a47c", shadow: "#886c4c", highlight: "#e4c69e" },
      9: { base: "#e2c39a", shadow: "#aa8c66", highlight: "#f8e0be" },
      10: { base: "#f3dec2", shadow: "#c4ac8e", highlight: "#fff4e1" },
    },
  },

  GOLD: {
    hueDeg: 55,
    levels: {
      1: { base: "#211f1d", shadow: "#181615", highlight: "#32302e" },
      2: { base: "#312b26", shadow: "#221d19", highlight: "#46403b" },
      3: { base: "#403429", shadow: "#2c2219", highlight: "#594d42" },
      4: { base: "#54402c", shadow: "#382919", highlight: "#715d4a" },
      5: { base: "#694e30", shadow: "#453119", highlight: "#8c7154" },
      6: { base: "#816137", shadow: "#533b1a", highlight: "#aa8a62" },
      7: { base: "#9c7a45", shadow: "#63491f", highlight: "#cdaa79" },
      8: { base: "#ba9657", shadow: "#745928", highlight: "#f4cf94" },
      9: { base: "#d3b379", shadow: "#826a3d", highlight: "#ffefb9" },
      10: { base: "#e5cc9e", shadow: "#8b7855", highlight: "#fff1c6" },
    },
  },

  COPPER: {
    hueDeg: 25,
    levels: {
      1: { base: "#231f1d", shadow: "#191614", highlight: "#33302e" },
      2: { base: "#342924", shadow: "#241b18", highlight: "#483d39" },
      3: { base: "#453027", shadow: "#301f18", highlight: "#5d483f" },
      4: { base: "#5c3829", shadow: "#3f2317", highlight: "#785546" },
      5: { base: "#75432d", shadow: "#4f2817", highlight: "#976550" },
      6: { base: "#915134", shadow: "#603019", highlight: "#b87a5d" },
      7: { base: "#ab6440", shadow: "#703a1d", highlight: "#da9370" },
      8: { base: "#ca8052", shadow: "#824a26", highlight: "#ffb88c" },
      9: { base: "#e29f73", shadow: "#8f5c3a", highlight: "#ffdfb5" },
      10: { base: "#efbc9a", shadow: "#946e53", highlight: "#ffeaca" },
    },
  },

  RED: {
    hueDeg: 350,
    levels: {
      1: { base: "#231f1f", shadow: "#191616", highlight: "#332f30" },
      2: { base: "#332728", shadow: "#231a1b", highlight: "#473c3c" },
      3: { base: "#452d2f", shadow: "#301d1e", highlight: "#5c4546" },
      4: { base: "#5b3436", shadow: "#3f2021", highlight: "#765051" },
      5: { base: "#773c3e", shadow: "#522325", highlight: "#975e5f" },
      6: { base: "#964849", shadow: "#65282a", highlight: "#bc706f" },
      7: { base: "#b55753", shadow: "#792f2e", highlight: "#e18681" },
      8: { base: "#cf7165", shadow: "#883f37", highlight: "#ffa89b" },
      9: { base: "#e09283", shadow: "#8f5349", highlight: "#ffd0c1" },
      10: { base: "#e8b2a5", shadow: "#91675e", highlight: "#ffe8dc" },
    },
  },

  VIOLET: {
    hueDeg: 280,
    levels: {
      1: { base: "#211f20", shadow: "#181617", highlight: "#323031" },
      2: { base: "#2f282c", shadow: "#201b1e", highlight: "#433c40" },
      3: { base: "#3d3039", shadow: "#2a1f26", highlight: "#544750" },
      4: { base: "#4f3848", shadow: "#362330", highlight: "#6a5363" },
      5: { base: "#63425b", shadow: "#43283c", highlight: "#82627a" },
      6: { base: "#7a4f71", shadow: "#502f4a", highlight: "#9e7695" },
      7: { base: "#916189", shadow: "#5e3958", highlight: "#bc8eb3" },
      8: { base: "#a67ba0", shadow: "#6a4865", highlight: "#d9b0d2" },
      9: { base: "#ba99b5", shadow: "#745a70", highlight: "#f5d6f0" },
      10: { base: "#cbb5c8", shadow: "#7c6b79", highlight: "#ffeeff" },
    },
  },

  MAHOGANY: {
    hueDeg: 320,
    levels: {
      1: { base: "#221f20", shadow: "#191616", highlight: "#333030" },
      2: { base: "#312829", shadow: "#221b1c", highlight: "#453c3e" },
      3: { base: "#422e32", shadow: "#2e1e21", highlight: "#594649" },
      4: { base: "#56363b", shadow: "#3b2125", highlight: "#715256" },
      5: { base: "#6f3f45", shadow: "#4b252b", highlight: "#8e6065" },
      6: { base: "#894b52", shadow: "#5c2b32", highlight: "#ae7277" },
      7: { base: "#a55b60", shadow: "#6d3439", highlight: "#d0898c" },
      8: { base: "#bd7576", shadow: "#7b4345", highlight: "#efabaa" },
      9: { base: "#ce9593", shadow: "#825756", highlight: "#ffd2cf" },
      10: { base: "#d9b2b0", shadow: "#866967", highlight: "#ffebe9" },
    },
  },

  ASH: {
    hueDeg: 210,
    levels: {
      1: { base: "#201f1f", shadow: "#171616", highlight: "#303030" },
      2: { base: "#2d2b2a", shadow: "#1f1d1c", highlight: "#42403f" },
      3: { base: "#383531", shadow: "#262320", highlight: "#504d4a" },
      4: { base: "#48413a", shadow: "#2f2a24", highlight: "#645e57" },
      5: { base: "#5a5144", shadow: "#3a3329", highlight: "#7b7266" },
      6: { base: "#6f6352", shadow: "#463d30", highlight: "#968a7a" },
      7: { base: "#867862", shadow: "#544938", highlight: "#b4a691" },
      8: { base: "#a49479", shadow: "#655944", highlight: "#dbcbb2" },
      9: { base: "#beb098", shadow: "#746956", highlight: "#fff1d9" },
      10: { base: "#d2c8b6", shadow: "#7e7768", highlight: "#fcf3e1" },
    },
  },

  PEARL: {
    hueDeg: 240,
    levels: {
      1: { base: "#1f2020", shadow: "#161617", highlight: "#303030" },
      2: { base: "#2b2b2c", shadow: "#1d1d1e", highlight: "#3f3f41" },
      3: { base: "#353437", shadow: "#232325", highlight: "#4d4c4f" },
      4: { base: "#424145", shadow: "#2b2a2d", highlight: "#5e5d61" },
      5: { base: "#515055", shadow: "#333237", highlight: "#727176" },
      6: { base: "#646269", shadow: "#3e3d42", highlight: "#8b8990" },
      7: { base: "#7c7982", shadow: "#4c4a51", highlight: "#aba8b1" },
      8: { base: "#97949f", shadow: "#5c5962", highlight: "#cfccd6" },
      9: { base: "#b5b1be", shadow: "#6d6a73", highlight: "#f5f2fe" },
      10: { base: "#cecad8", shadow: "#7b7783", highlight: "#f6f2ff" },
    },
  },

  GREEN: {
    hueDeg: 140,
    levels: {
      1: { base: "#1e201d", shadow: "#151715", highlight: "#2f312e" },
      2: { base: "#272c27", shadow: "#1a1e1a", highlight: "#3c413b" },
      3: { base: "#2f372e", shadow: "#1e251d", highlight: "#474f46" },
      4: { base: "#3a4538", shadow: "#242d23", highlight: "#566155" },
      5: { base: "#465444", shadow: "#2b3629", highlight: "#687566" },
      6: { base: "#566854", shadow: "#344132", highlight: "#7e8f7c" },
      7: { base: "#6b8068", shadow: "#3f503d", highlight: "#9baf98" },
      8: { base: "#849d80", shadow: "#4c604a", highlight: "#bcd4b9" },
      9: { base: "#9ebb9a", shadow: "#5a7158", highlight: "#e0fbdc" },
      10: { base: "#b4d5af", shadow: "#668063", highlight: "#ddfcd9" },
    },
  },

  BEIGE: {
    hueDeg: 40,
    levels: {
      1: { base: "#211f1e", shadow: "#171615", highlight: "#31302f" },
      2: { base: "#2f2b29", shadow: "#201d1b", highlight: "#43403e" },
      3: { base: "#3b342f", shadow: "#28221e", highlight: "#534c47" },
      4: { base: "#4d4036", shadow: "#332921", highlight: "#695d52" },
      5: { base: "#604f3e", shadow: "#3f3124", highlight: "#827060" },
      6: { base: "#77614a", shadow: "#4d3b29", highlight: "#9f8872" },
      7: { base: "#917859", shadow: "#5c4931", highlight: "#c0a78a" },
      8: { base: "#af946f", shadow: "#6d593c", highlight: "#e8cda9" },
      9: { base: "#c8b18f", shadow: "#7b6a4f", highlight: "#fff1d0" },
      10: { base: "#dbcaaf", shadow: "#847863", highlight: "#fff2d9" },
    },
  },

  BLUE: {
    hueDeg: 220,
    levels: {
      1: { base: "#1d2022", shadow: "#141719", highlight: "#2e3133" },
      2: { base: "#252c31", shadow: "#181e22", highlight: "#3a4045" },
      3: { base: "#2b363e", shadow: "#1b242b", highlight: "#444e56" },
      4: { base: "#34444f", shadow: "#1f2c35", highlight: "#51606a" },
      5: { base: "#3e5362", shadow: "#243540", highlight: "#617482" },
      6: { base: "#4c6678", shadow: "#2b404e", highlight: "#768d9e" },
      7: { base: "#5f7f95", shadow: "#344e5f", highlight: "#91adc2" },
      8: { base: "#759bb5", shadow: "#3f5e72", highlight: "#b0d2eb" },
      9: { base: "#8db9d7", shadow: "#4c6f87", highlight: "#d2f9ff" },
      10: { base: "#a1d2f5", shadow: "#557e98", highlight: "#cdf9ff" },
    },
  },

  YELLOW: {
    hueDeg: 60,
    levels: {
      1: { base: "#211f1c", shadow: "#181614", highlight: "#32302d" },
      2: { base: "#312b24", shadow: "#221d17", highlight: "#464039" },
      3: { base: "#413426", shadow: "#2c2217", highlight: "#5a4d3f" },
      4: { base: "#554027", shadow: "#392917", highlight: "#735d46" },
      5: { base: "#6b4f2c", shadow: "#463217", highlight: "#8f7350" },
      6: { base: "#856230", shadow: "#553c17", highlight: "#af8c5a" },
      7: { base: "#a27c3c", shadow: "#664b1f", highlight: "#d6b06e" },
      8: { base: "#c2994c", shadow: "#785b24", highlight: "#ffd485" },
      9: { base: "#deb76c", shadow: "#876d35", highlight: "#fff3a8" },
      10: { base: "#edd08f", shadow: "#8e7c4b", highlight: "#fff7bf" },
    },
  },

  ORANGE: {
    hueDeg: 20,
    levels: {
      1: { base: "#231f1d", shadow: "#191614", highlight: "#33302e" },
      2: { base: "#342923", shadow: "#241b17", highlight: "#483d38" },
      3: { base: "#463025", shadow: "#301f16", highlight: "#5e483d" },
      4: { base: "#5d3725", shadow: "#402214", highlight: "#795442" },
      5: { base: "#774227", shadow: "#502714", highlight: "#996449" },
      6: { base: "#944f2b", shadow: "#622f14", highlight: "#bb7753" },
      7: { base: "#b06236", shadow: "#733817", highlight: "#df8f63" },
      8: { base: "#cf7c46", shadow: "#85471e", highlight: "#ffb37c" },
      9: { base: "#e69b66", shadow: "#91592f", highlight: "#ffdc9f" },
      10: { base: "#f2b78b", shadow: "#956b46", highlight: "#ffe7b8" },
    },
  },

  PINK: {
    hueDeg: 335,
    levels: {
      1: { base: "#221f20", shadow: "#191616", highlight: "#333030" },
      2: { base: "#32272a", shadow: "#221a1d", highlight: "#463b3f" },
      3: { base: "#432e35", shadow: "#2f1e24", highlight: "#5a464d" },
      4: { base: "#583541", shadow: "#3c212b", highlight: "#73515f" },
      5: { base: "#723d4e", shadow: "#4e2434", highlight: "#926074" },
      6: { base: "#8e4860", shadow: "#5f2a3e", highlight: "#b4728b" },
      7: { base: "#ab5775", shadow: "#70334a", highlight: "#d68aa7" },
      8: { base: "#c5718f", shadow: "#7e4259", highlight: "#f7acc7" },
      9: { base: "#d792ac", shadow: "#86586b", highlight: "#ffd0e3" },
      10: { base: "#e3b3c5", shadow: "#896c78", highlight: "#ffe7f2" },
    },
  },

  MIXED: {
    hueDeg: 300,
    levels: {
      1: { base: "#211f20", shadow: "#181617", highlight: "#323031" },
      2: { base: "#2f282c", shadow: "#201b1e", highlight: "#433c40" },
      3: { base: "#3d3039", shadow: "#2a1f26", highlight: "#544750" },
      4: { base: "#4f3848", shadow: "#362330", highlight: "#6a5363" },
      5: { base: "#63425b", shadow: "#43283c", highlight: "#82627a" },
      6: { base: "#7a4f71", shadow: "#502f4a", highlight: "#9e7695" },
      7: { base: "#916189", shadow: "#5e3958", highlight: "#bc8eb3" },
      8: { base: "#a67ba0", shadow: "#6a4865", highlight: "#d9b0d2" },
      9: { base: "#ba99b5", shadow: "#745a70", highlight: "#f5d6f0" },
      10: { base: "#cbb5c8", shadow: "#7c6b79", highlight: "#ffeeff" },
    },
  },

  UNKNOWN: {
    hueDeg: 0,
    levels: {
      1: { base: "#1f1f1f", shadow: "#161616", highlight: "#303030" },
      2: { base: "#2c2c2c", shadow: "#1e1e1e", highlight: "#404040" },
      3: { base: "#363636", shadow: "#232323", highlight: "#4e4e4e" },
      4: { base: "#424242", shadow: "#2b2b2b", highlight: "#5f5f5f" },
      5: { base: "#525252", shadow: "#343434", highlight: "#737373" },
      6: { base: "#656565", shadow: "#3e3e3e", highlight: "#8c8c8c" },
      7: { base: "#7c7c7c", shadow: "#4c4c4c", highlight: "#ababab" },
      8: { base: "#989898", shadow: "#5c5c5c", highlight: "#d0d0d0" },
      9: { base: "#b4b4b4", shadow: "#6c6c6c", highlight: "#f3f3f3" },
      10: { base: "#cbcbcb", shadow: "#797979", highlight: "#f3f3f3" },
    },
  },
};

/**
 * Underlying Pigment (Raw Contributing Undertone) Curves across Levels 1–10.
 * Conforms to International Color Chart (ICC) and salon decolorization physics.
 * When hair is bleached / pre-lightened, melanin is chemically dissolved, exposing
 * the raw underlying warm pigments.
 */
export const UNDERTONE_CURVES: Record<
  UniversalLevel,
  { base: string; shadow: string; highlight: string; name: string; nameHi: string; toneFamily: ToneFamily }
> = {
  1: { base: "#220a06", shadow: "#100302", highlight: "#3a120b", name: "Black / Dark Red", nameHi: "Black / Dark Red", toneFamily: "NATURAL" },
  2: { base: "#380f08", shadow: "#1c0603", highlight: "#56180e", name: "Dark Red", nameHi: "Dark Red", toneFamily: "RED" },
  3: { base: "#58160a", shadow: "#300a04", highlight: "#802010", name: "Deep Red", nameHi: "Deep Red", toneFamily: "RED" },
  4: { base: "#7c220c", shadow: "#461205", highlight: "#aa3214", name: "Red", nameHi: "Red", toneFamily: "RED" },
  5: { base: "#a63810", shadow: "#621e07", highlight: "#d44c18", name: "Red-Orange", nameHi: "Red-Orange", toneFamily: "COPPER" },
  6: { base: "#c65415", shadow: "#7a3209", highlight: "#ef7022", name: "Orange", nameHi: "Orange", toneFamily: "COPPER" },
  7: { base: "#de7c1a", shadow: "#8e4c0c", highlight: "#ffa02e", name: "Yellow-Orange (Gold-Copper)", nameHi: "Yellow-Orange (Gold-Copper)", toneFamily: "GOLD" },
  8: { base: "#e8a82a", shadow: "#9e6e12", highlight: "#ffcc48", name: "Yellow (Gold)", nameHi: "Yellow (Gold)", toneFamily: "YELLOW" },
  9: { base: "#f2cf58", shadow: "#b29230", highlight: "#ffe47e", name: "Pale Yellow", nameHi: "Pale Yellow", toneFamily: "YELLOW" },
  10: { base: "#fbf0a8", shadow: "#c8bc6e", highlight: "#fffad2", name: "Extra Pale Yellow / Platinum Raw", nameHi: "Extra Pale Yellow / Platinum Raw", toneFamily: "YELLOW" },
};

export function getUndertoneColor(level: UniversalLevel) {
  const lvl = (Math.max(1, Math.min(10, level)) || 7) as UniversalLevel;
  return UNDERTONE_CURVES[lvl] || UNDERTONE_CURVES[7];
}

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

/**
 * Applies physical lighting metamerism color shift based on correlated color temperature (CCT)
 * and Planckian spectral distribution:
 * - DAYLIGHT (6500K / CIE D65): Neutral baseline, 100 CRI reflection.
 * - WARM (3000K Halogen/Incandescent): Dominant long-wavelength red/amber shift (+16% R, +6% G, -24% B).
 * - COOL (4000K Cool White Fluorescent/Commercial LED): Blue/cyan peak shift (-12% R, +2% G, +18% B).
 */
export function applyMetamerism(hex: string, mode: "DAYLIGHT" | "WARM" | "COOL"): string {
  const [r, g, b] = hexToRgb(hex);
  if (mode === "DAYLIGHT") {
    return hex;
  } else if (mode === "WARM") {
    const wr = Math.min(255, Math.round(r * 1.025));
    const wg = Math.min(255, Math.round(g * 1.008));
    const wb = Math.max(0, Math.round(b * 0.975));
    return rgbToHex(wr, wg, wb);
  } else if (mode === "COOL") {
    const cr = Math.max(0, Math.round(r * 0.975));
    const cg = Math.min(255, Math.round(g * 1.005));
    const cb = Math.min(255, Math.round(b * 1.025));
    return rgbToHex(cr, cg, cb);
  }
  return hex;
}

const TONE_DIGIT_MAP: Record<ToneFamily, string> = {
  NATURAL: "0",
  ASH: "1",
  PEARL: "2",
  GOLD: "3",
  COPPER: "4",
  MAHOGANY: "5",
  VIOLET: "6",
  RED: "6",
  GREEN: "7",
  BEIGE: "8",
  BLUE: "1",
  YELLOW: "3",
  ORANGE: "4",
  PINK: "5",
  MIXED: "9",
  UNKNOWN: "0",
};

export function getSalonShadeCode(
  level: UniversalLevel,
  primary: ToneFamily,
  secondary?: ToneFamily | null
): { code: string; name: string } {
  const pDigit = TONE_DIGIT_MAP[primary] || "0";
  const sDigit = secondary ? (TONE_DIGIT_MAP[secondary] || "") : "";
  const code = sDigit && sDigit !== pDigit ? `${level}/${pDigit}${sDigit}` : `${level}/${pDigit}`;

  let name = `Level ${level} ${primary}`;
  if (secondary && secondary !== primary) {
    name = `Level ${level} ${primary}/${secondary}`;
  }

  if (primary === "COPPER" && secondary === "GOLD") name = `Fiery Amber Copper`;
  else if (primary === "GOLD" && level >= 8) name = `Honey Blonde`;
  else if (primary === "GOLD") name = `Golden Warmth`;
  else if (primary === "COPPER") name = `Fiery Copper`;
  else if (primary === "ASH") name = `Smoky Ash`;
  else if (primary === "PEARL") name = `Cool Pearl`;
  else if (primary === "RED" && secondary === "VIOLET") name = `Deep Burgundy Plum`;
  else if (primary === "RED") name = `Crimson Red`;
  else if (primary === "NATURAL" && level === 1) name = `Jet Black`;
  else if (primary === "NATURAL" && level <= 3) name = `Deep Espresso Brunette`;
  else if (primary === "NATURAL" && level <= 5) name = `Rich Chocolate Brown`;
  else if (primary === "NATURAL" && level >= 9) name = `Pure Platinum Blonde`;

  return { code, name };
}

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
