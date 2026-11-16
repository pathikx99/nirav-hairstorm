/**
 * UHCR v1.0 — Frontend Type Definitions
 */

export type UniversalLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const UNIVERSAL_LEVEL_DETAILS: Record<
  UniversalLevel,
  { name: string; hex: string; desc: string }
> = {
  1: { name: "Black", hex: "#211f1e", desc: "Deepest black" },
  2: { name: "Darkest Brown", hex: "#302b28", desc: "Very dark espresso brown" },
  3: { name: "Dark Brown", hex: "#3e342d", desc: "Rich deep brown" },
  4: { name: "Medium Brown", hex: "#503f32", desc: "Classic neutral brown" },
  5: { name: "Light Brown", hex: "#654d39", desc: "Warm light brown" },
  6: { name: "Dark Blonde", hex: "#7c5f43", desc: "Deep honey / dark blonde" },
  7: { name: "Blonde", hex: "#967652", desc: "Standard natural blonde" },
  8: { name: "Light Blonde", hex: "#b49265", desc: "Clear light blonde" },
  9: { name: "Very Light Blonde", hex: "#cdb086", desc: "Very pale blonde" },
  10: { name: "Extra Light Blonde", hex: "#ddc9a7", desc: "Lightest platinum blonde" },
};

export type ToneFamily =
  | "NATURAL"
  | "ASH"
  | "BLUE"
  | "GREEN"
  | "VIOLET"
  | "PEARL"
  | "BEIGE"
  | "GOLD"
  | "YELLOW"
  | "COPPER"
  | "ORANGE"
  | "RED"
  | "MAHOGANY"
  | "PINK"
  | "MIXED"
  | "UNKNOWN";

export const TONE_DETAILS: Record<ToneFamily, { name: string; hex: string; reflect: string }> = {
  NATURAL: { name: "Natural", hex: "#967652", reflect: "Neutral" },
  ASH: { name: "Ash", hex: "#867862", reflect: "Cool Smoky Taupe" },
  BLUE: { name: "Blue", hex: "#5f7f95", reflect: "Intense Cool Slate Blue" },
  GREEN: { name: "Green", hex: "#6b8068", reflect: "Matt Green Anti-Red" },
  VIOLET: { name: "Violet", hex: "#916189", reflect: "Purple Anti-Yellow" },
  PEARL: { name: "Pearl", hex: "#7c7982", reflect: "Cool Violet/Ash" },
  BEIGE: { name: "Beige", hex: "#917859", reflect: "Balanced Warm Neutral" },
  GOLD: { name: "Gold", hex: "#9c7a45", reflect: "Warm Amber Gold" },
  YELLOW: { name: "Yellow", hex: "#a27c3c", reflect: "Vibrant Warm Gold" },
  COPPER: { name: "Copper", hex: "#ab6440", reflect: "Rich Auburn Copper" },
  ORANGE: { name: "Orange", hex: "#b06236", reflect: "Vibrant Copper-Orange" },
  RED: { name: "Red", hex: "#b55753", reflect: "Pure Carmine Red" },
  MAHOGANY: { name: "Mahogany", hex: "#a55b60", reflect: "Red-Violet" },
  PINK: { name: "Pink", hex: "#ab5775", reflect: "Pastel Rose" },
  MIXED: { name: "Mixed", hex: "#916189", reflect: "Multi-Reflective" },
  UNKNOWN: { name: "Unknown", hex: "#7c7c7c", reflect: "Unclassified" },
};

export type ToneIntensity =
  | "UNKNOWN"
  | "SOFT"
  | "STANDARD"
  | "INTENSE"
  | "EXTRA_INTENSE";

export type ColourFamily =
  | "NATURAL"
  | "FASHION"
  | "SPECIAL_BLONDE"
  | "HIGH_LIFT"
  | "PASTEL"
  | "TONER"
  | "GLOSS"
  | "CORRECTOR"
  | "SPECIAL_MIX"
  | "OTHER"
  | "UNKNOWN";
