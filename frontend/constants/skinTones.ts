export type SkinTone =
  | "PORCELAIN"
  | "VERY_FAIR"
  | "FAIR"
  | "LIGHT"
  | "WARM_BEIGE"
  | "MEDIUM"
  | "OLIVE"
  | "TAN"
  | "CARAMEL"
  | "BROWN"
  | "DARK"
  | "ESPRESSO"
  | "DEEP";

export interface SkinToneConfig {
  id: SkinTone;
  label: string;
  faceHex: string; // Primary face/body fill
  shadowHex: string; // Ear, neck shadow, contour
  blushHex: string; // Cheek blush overlay
  noseStroke: string; // Nose/lip line stroke
  collarboneStroke: string;
  preview: string; // Swatch preview hex
}

export const SKIN_TONES: SkinToneConfig[] = [
  {
    id: "PORCELAIN",
    label: "Porcelain",
    faceHex: "#fff1e8",
    shadowHex: "#ecd4c4",
    blushHex: "#ffccd5",
    noseStroke: "#d9a88c",
    collarboneStroke: "#dfb094",
    preview: "#fff1e8",
  },
  {
    id: "VERY_FAIR",
    label: "Very Fair",
    faceHex: "#fde8d0",
    shadowHex: "#e8c9aa",
    blushHex: "#fca5a5",
    noseStroke: "#d4a07a",
    collarboneStroke: "#d4a07a",
    preview: "#fde8d0",
  },
  {
    id: "FAIR",
    label: "Fair",
    faceHex: "#f8e2cf",
    shadowHex: "#e0c2ab",
    blushHex: "#f89b9b",
    noseStroke: "#cda080",
    collarboneStroke: "#cda080",
    preview: "#f8e2cf",
  },
  {
    id: "LIGHT",
    label: "Light",
    faceHex: "#f5d0a9",
    shadowHex: "#dbb78a",
    blushHex: "#f87171",
    noseStroke: "#c49670",
    collarboneStroke: "#c49670",
    preview: "#f5d0a9",
  },
  {
    id: "WARM_BEIGE",
    label: "Warm Beige",
    faceHex: "#e8be92",
    shadowHex: "#cca072",
    blushHex: "#f07865",
    noseStroke: "#b58252",
    collarboneStroke: "#b58252",
    preview: "#e8be92",
  },
  {
    id: "MEDIUM",
    label: "Medium",
    faceHex: "#d4a373",
    shadowHex: "#b8854e",
    blushHex: "#e5726a",
    noseStroke: "#9e7048",
    collarboneStroke: "#9e7048",
    preview: "#d4a373",
  },
  {
    id: "OLIVE",
    label: "Olive",
    faceHex: "#c49a6c",
    shadowHex: "#a67c4a",
    blushHex: "#d4665d",
    noseStroke: "#8b6238",
    collarboneStroke: "#8b6238",
    preview: "#c49a6c",
  },
  {
    id: "TAN",
    label: "Tan",
    faceHex: "#a67c52",
    shadowHex: "#8a6038",
    blushHex: "#c05050",
    noseStroke: "#724a28",
    collarboneStroke: "#724a28",
    preview: "#a67c52",
  },
  {
    id: "CARAMEL",
    label: "Caramel",
    faceHex: "#9b693e",
    shadowHex: "#7f4e27",
    blushHex: "#b34237",
    noseStroke: "#653a19",
    collarboneStroke: "#653a19",
    preview: "#9b693e",
  },
  {
    id: "BROWN",
    label: "Brown",
    faceHex: "#8b5e3c",
    shadowHex: "#704828",
    blushHex: "#a84040",
    noseStroke: "#5c3720",
    collarboneStroke: "#5c3720",
    preview: "#8b5e3c",
  },
  {
    id: "DARK",
    label: "Dark",
    faceHex: "#6b4226",
    shadowHex: "#4d2e16",
    blushHex: "#8a3030",
    noseStroke: "#3d2410",
    collarboneStroke: "#3d2410",
    preview: "#6b4226",
  },
  {
    id: "ESPRESSO",
    label: "Espresso",
    faceHex: "#52321b",
    shadowHex: "#391f0e",
    blushHex: "#752222",
    noseStroke: "#2b1407",
    collarboneStroke: "#2b1407",
    preview: "#52321b",
  },
  {
    id: "DEEP",
    label: "Deep",
    faceHex: "#3d2515",
    shadowHex: "#281608",
    blushHex: "#6b2020",
    noseStroke: "#1f0e06",
    collarboneStroke: "#1f0e06",
    preview: "#3d2515",
  },
];

export function getSkinToneConfig(id: SkinTone): SkinToneConfig {
  const found = SKIN_TONES.find((s) => s.id === id);
  return found || SKIN_TONES[2]; // Default Fair
}
