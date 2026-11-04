/**
 * UHCR v1.0 — Frontend Type Definitions
 */

export type UniversalLevel = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export const UNIVERSAL_LEVEL_DETAILS: Record<
  UniversalLevel,
  { name: string; hex: string; desc: string }
> = {
  1: { name: "Black", hex: "#0f0f0f", desc: "Deepest black" },
  2: { name: "Darkest Brown", hex: "#1c140e", desc: "Very dark espresso brown" },
  3: { name: "Dark Brown", hex: "#2e1f14", desc: "Rich deep brown" },
  4: { name: "Medium Brown", hex: "#453020", desc: "Classic neutral brown" },
  5: { name: "Light Brown", hex: "#5e422c", desc: "Warm light brown" },
  6: { name: "Dark Blonde", hex: "#7a5c3d", desc: "Deep honey / dark blonde" },
  7: { name: "Blonde", hex: "#a48053", desc: "Standard natural blonde" },
  8: { name: "Light Blonde", hex: "#c9a674", desc: "Clear light blonde" },
  9: { name: "Very Light Blonde", hex: "#e5caa0", desc: "Very pale blonde" },
  10: { name: "Extra Light Blonde", hex: "#f6e4c4", desc: "Lightest platinum blonde" },
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
  NATURAL: { name: "Natural", hex: "#8a7b70", reflect: "Neutral" },
  ASH: { name: "Ash", hex: "#707b82", reflect: "Cool Blue/Green" },
  BLUE: { name: "Blue", hex: "#3b6e8c", reflect: "Intense Cool Blue" },
  GREEN: { name: "Green", hex: "#4a7a58", reflect: "Matt Green Anti-Red" },
  VIOLET: { name: "Violet", hex: "#755285", reflect: "Purple Anti-Yellow" },
  PEARL: { name: "Pearl", hex: "#9d8fa2", reflect: "Cool Violet/Ash" },
  BEIGE: { name: "Beige", hex: "#b5a38a", reflect: "Balanced Warm Neutral" },
  GOLD: { name: "Gold", hex: "#c99a2c", reflect: "Warm Yellow" },
  YELLOW: { name: "Yellow", hex: "#d9ab2b", reflect: "Vibrant Yellow" },
  COPPER: { name: "Copper", hex: "#bf5b28", reflect: "Rich Orange" },
  ORANGE: { name: "Orange", hex: "#c96522", reflect: "Vibrant Orange" },
  RED: { name: "Red", hex: "#ad2a2a", reflect: "Pure Red" },
  MAHOGANY: { name: "Mahogany", hex: "#7a2e38", reflect: "Red-Violet" },
  PINK: { name: "Pink", hex: "#c76d85", reflect: "Pastel Rose" },
  MIXED: { name: "Mixed", hex: "#8a6c82", reflect: "Multi-Reflective" },
  UNKNOWN: { name: "Unknown", hex: "#737373", reflect: "Unclassified" },
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
