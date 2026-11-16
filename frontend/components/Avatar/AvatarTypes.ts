/**
 * AvatarTypes.ts
 * Type definitions and core configurations for the Chromatique Procedural Hair Avatar
 */

import { UniversalLevel, ToneFamily } from "../../types/uhcr";

export type { UniversalLevel, ToneFamily };

export type AvatarView = "front" | "back";

export type LightingPreset = "sunlight" | "salon" | "cool";

export type SkinTonePreset =
  | "porcelain"
  | "fair"
  | "light"
  | "warm-beige"
  | "medium"
  | "olive"
  | "tan"
  | "caramel"
  | "deep"
  | "ebony";

export type SkinUndertone = "cool" | "neutral" | "warm" | "olive";

export type HairZoneId = "roots" | "midLengths" | "ends";

export type TonalFamilyKey =
  | "natural"
  | "ash"
  | "beige"
  | "gold"
  | "copper"
  | "red"
  | "violet"
  | "mahogany"
  | "pearl"
  | "matte";

export interface ZoneColorState {
  level: UniversalLevel;
  tone: ToneFamily;
  color?: string; // Optional custom hex override
  greyPercentage?: number; // Optional zone-specific grey percentage (0 to 100)
}

export interface AvatarSkinConfig {
  id: SkinTonePreset;
  label: string;
  baseHex: string;
  shadowHex: string;
  highlightHex: string;
  blushHex: string;
  featureStroke: string;
  collarboneStroke: string;
  preview: string;
}

export interface AvatarSkinState {
  tone: SkinTonePreset;
  undertone: SkinUndertone;
}

export interface AvatarHairState {
  naturalBaseLevel: UniversalLevel;
  roots: ZoneColorState;
  midLengths: ZoneColorState;
  ends: ZoneColorState;
  separateZones: boolean;
  blendIntensity: number; // 0 to 1
  greyPercentage?: number; // 0 to 100
  previousArtificialColor?: boolean;
}

export interface AvatarState {
  view: AvatarView;
  lighting: LightingPreset;
  skin: AvatarSkinState;
  hair: AvatarHairState;
  activeZone: HairZoneId;
}

export interface RenderedZoneColor {
  base: string;
  shadow: string;
  highlight: string;
  sheen: string;
  strands: string[];
  gradient: string;
  level: UniversalLevel;
  tone: ToneFamily;
}

export interface RenderedHairPalette {
  roots: RenderedZoneColor;
  midLengths: RenderedZoneColor;
  ends: RenderedZoneColor;
  blendIntensity: number;
  separateZones: boolean;
  continuousGradientId: string;
}

export interface LightingEnvironmentConfig {
  id: LightingPreset;
  title: string;
  kelvin: string;
  icon: string;
  ambientAura: string;
  specularGlintOpacity: number;
  sheenTint: string;
  svgFilter: string;
  cssFilter: string;
  skinToneModifier: {
    brightness: number;
    contrast: number;
    saturation: number;
    sepia?: number;
    hueRotateDeg?: number;
  };
}

export interface LevelDefinition {
  level: UniversalLevel;
  name: string;
  description: string;
  naturalBaseHex: string;
}

export const PROFESSIONAL_LEVELS: LevelDefinition[] = [
  { level: 1, name: "Jet Black", description: "Deepest black, maximum eumelanin", naturalBaseHex: "#0d0d11" },
  { level: 2, name: "Darkest Brown", description: "Very dark espresso brown", naturalBaseHex: "#1a120c" },
  { level: 3, name: "Dark Brown", description: "Rich deep brown", naturalBaseHex: "#2a1c12" },
  { level: 4, name: "Medium Brown", description: "Classic neutral brown", naturalBaseHex: "#3d2a1b" },
  { level: 5, name: "Light Brown", description: "Rich light brown with warm undertone", naturalBaseHex: "#593f2b" },
  { level: 6, name: "Dark Blonde", description: "Honey / dark blonde with amber reflect", naturalBaseHex: "#7a583e" },
  { level: 7, name: "Medium Blonde", description: "Standard radiant natural blonde", naturalBaseHex: "#9e7755" },
  { level: 8, name: "Light Blonde", description: "Clear luminous golden blonde", naturalBaseHex: "#c49d74" },
  { level: 9, name: "Very Light Blonde", description: "Pale pastel blonde", naturalBaseHex: "#dfbf97" },
  { level: 10, name: "Platinum Blonde", description: "Extra light translucent platinum blonde", naturalBaseHex: "#f5e2cb" },
];

export const TONAL_FAMILIES: { key: TonalFamilyKey; uhcr: ToneFamily; code: string; name: string; description: string; hex: string }[] = [
  { key: "natural", uhcr: "NATURAL", code: ".0", name: "Natural", description: "Balanced neutral pigment", hex: "#8a7b70" },
  { key: "ash", uhcr: "ASH", code: ".1", name: "Ash", description: "Cool blue/green-gray tone", hex: "#707b82" },
  { key: "beige", uhcr: "BEIGE", code: ".13", name: "Beige", description: "Champagne warm-cool balance", hex: "#b5a38a" },
  { key: "gold", uhcr: "GOLD", code: ".3", name: "Gold", description: "Radiant warm yellow-gold reflect", hex: "#c99a2c" },
  { key: "copper", uhcr: "COPPER", code: ".4", name: "Copper", description: "Vibrant rich orange-amber reflect", hex: "#bf5b28" },
  { key: "red", uhcr: "RED", code: ".6", name: "Red", description: "Deep scarlet and ruby red reflect", hex: "#ad2a2a" },
  { key: "violet", uhcr: "VIOLET", code: ".2", name: "Violet", description: "Cool anti-yellow plum & purple", hex: "#755285" },
  { key: "mahogany", uhcr: "MAHOGANY", code: ".5", name: "Mahogany", description: "Red-violet rich brunette tone", hex: "#7a2e38" },
  { key: "pearl", uhcr: "PEARL", code: ".8", name: "Pearl", description: "Luminous cool violet-ash iridescence", hex: "#9d8fa2" },
  { key: "matte", uhcr: "GREEN", code: ".7", name: "Matte", description: "Anti-red cool khaki/olive green", hex: "#4a7a58" },
];

export const SKIN_TONE_PRESETS: Record<SkinTonePreset, AvatarSkinConfig> = {
  "porcelain": {
    id: "porcelain",
    label: "Porcelain",
    baseHex: "#fff1e8",
    shadowHex: "#ecd4c4",
    highlightHex: "#ffffff",
    blushHex: "#ffccd5",
    featureStroke: "#d9a88c",
    collarboneStroke: "#dfb094",
    preview: "#fff1e8",
  },
  "fair": {
    id: "fair",
    label: "Fair",
    baseHex: "#fde8d0",
    shadowHex: "#e8c9aa",
    highlightHex: "#fff6ed",
    blushHex: "#fca5a5",
    featureStroke: "#c99772",
    collarboneStroke: "#d4a07a",
    preview: "#fde8d0",
  },
  "light": {
    id: "light",
    label: "Light",
    baseHex: "#f5d0a9",
    shadowHex: "#dbb78a",
    highlightHex: "#fae5cb",
    blushHex: "#f87171",
    featureStroke: "#b6845a",
    collarboneStroke: "#c49670",
    preview: "#f5d0a9",
  },
  "warm-beige": {
    id: "warm-beige",
    label: "Warm Beige",
    baseHex: "#e8be92",
    shadowHex: "#cca072",
    highlightHex: "#fae0bd",
    blushHex: "#f07865",
    featureStroke: "#b58252",
    collarboneStroke: "#b58252",
    preview: "#e8be92",
  },
  "medium": {
    id: "medium",
    label: "Medium",
    baseHex: "#d4a373",
    shadowHex: "#b8854e",
    highlightHex: "#e5bd94",
    blushHex: "#e5726a",
    featureStroke: "#8f5e33",
    collarboneStroke: "#9e7048",
    preview: "#d4a373",
  },
  "olive": {
    id: "olive",
    label: "Olive",
    baseHex: "#c49a6c",
    shadowHex: "#a67c4a",
    highlightHex: "#d8b488",
    blushHex: "#d4665d",
    featureStroke: "#7c552b",
    collarboneStroke: "#8b6238",
    preview: "#c49a6c",
  },
  "tan": {
    id: "tan",
    label: "Tan",
    baseHex: "#a67c52",
    shadowHex: "#8a6038",
    highlightHex: "#bd936a",
    blushHex: "#c05050",
    featureStroke: "#633d1c",
    collarboneStroke: "#724a28",
    preview: "#a67c52",
  },
  "caramel": {
    id: "caramel",
    label: "Caramel",
    baseHex: "#9b693e",
    shadowHex: "#7f4e27",
    highlightHex: "#b38052",
    blushHex: "#b34237",
    featureStroke: "#653a19",
    collarboneStroke: "#653a19",
    preview: "#9b693e",
  },
  "deep": {
    id: "deep",
    label: "Deep",
    baseHex: "#6b4226",
    shadowHex: "#4d2e16",
    highlightHex: "#8a5833",
    blushHex: "#8a3030",
    featureStroke: "#3d2410",
    collarboneStroke: "#3d2410",
    preview: "#6b4226",
  },
  "ebony": {
    id: "ebony",
    label: "Ebony",
    baseHex: "#3d2515",
    shadowHex: "#281608",
    highlightHex: "#573721",
    blushHex: "#6b2020",
    featureStroke: "#180a04",
    collarboneStroke: "#1f0e06",
    preview: "#3d2515",
  },
};

export const LIGHTING_PRESETS: Record<LightingPreset, LightingEnvironmentConfig> = {
  sunlight: {
    id: "sunlight",
    title: "Direct Sunlight (6500K)",
    kelvin: "6500K",
    icon: "☀️",
    ambientAura: "rgba(251, 191, 36, 0.28)",
    specularGlintOpacity: 0.95,
    sheenTint: "#fffbeb",
    svgFilter: "sunlightFilter",
    cssFilter: "brightness(1.05) contrast(1.04) saturate(1.05)",
    skinToneModifier: {
      brightness: 1.04,
      contrast: 1.03,
      saturation: 1.06,
    },
  },
  salon: {
    id: "salon",
    title: "Inside Salon (3000K)",
    kelvin: "3000K",
    icon: "💡",
    ambientAura: "rgba(245, 158, 11, 0.22)",
    specularGlintOpacity: 0.88,
    sheenTint: "#fef3c7",
    svgFilter: "salonFilter",
    cssFilter: "brightness(1.01) contrast(1.01) saturate(1.02)",
    skinToneModifier: {
      brightness: 1.01,
      contrast: 1.01,
      saturation: 1.02,
      sepia: 0.04,
    },
  },
  cool: {
    id: "cool",
    title: "Cool Indoor (4000K)",
    kelvin: "4000K",
    icon: "🏢",
    ambientAura: "rgba(96, 165, 250, 0.22)",
    specularGlintOpacity: 0.75,
    sheenTint: "#e0e7ff",
    svgFilter: "coolFilter",
    cssFilter: "brightness(0.98) contrast(1.02) saturate(0.96)",
    skinToneModifier: {
      brightness: 0.98,
      contrast: 1.02,
      saturation: 0.96,
      hueRotateDeg: 4,
    },
  },
};
