export type SkinTone =
  | "PORCELAIN"
  | "FAIR"
  | "LIGHT"
  | "WARM_BEIGE"
  | "MEDIUM"
  | "OLIVE"
  | "TAN"
  | "CARAMEL"
  | "DEEP"
  | "EBONY";

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
    faceHex: "#e9d1ce",
    shadowHex: "#c8aba3",
    blushHex: "#a76e72",
    noseStroke: "#a87e74",
    collarboneStroke: "#ba9086",
    preview: "#e9d1ce",
  },
  {
    id: "FAIR",
    label: "Fair",
    faceHex: "#e1beb2",
    shadowHex: "#b58f80",
    blushHex: "#9d605d",
    noseStroke: "#9c7263",
    collarboneStroke: "#ab8171",
    preview: "#e1beb2",
  },
  {
    id: "LIGHT",
    label: "Light",
    faceHex: "#d8ae9f",
    shadowHex: "#b08573",
    blushHex: "#985957",
    noseStroke: "#946754",
    collarboneStroke: "#a37663",
    preview: "#d8ae9f",
  },
  {
    id: "WARM_BEIGE",
    label: "Warm Beige",
    faceHex: "#d3a390",
    shadowHex: "#a87861",
    blushHex: "#91524f",
    noseStroke: "#8c5c45",
    collarboneStroke: "#9c6b54",
    preview: "#d3a390",
  },
  {
    id: "MEDIUM",
    label: "Medium",
    faceHex: "#ca9986",
    shadowHex: "#9e6f59",
    blushHex: "#8e4c4b",
    noseStroke: "#82503a",
    collarboneStroke: "#915e48",
    preview: "#ca9986",
  },
  {
    id: "OLIVE",
    label: "Olive",
    faceHex: "#c69988",
    shadowHex: "#a0725c",
    blushHex: "#a36462",
    noseStroke: "#83523d",
    collarboneStroke: "#94634d",
    preview: "#c69988",
  },
  {
    id: "TAN",
    label: "Tan",
    faceHex: "#c08d77",
    shadowHex: "#96654e",
    blushHex: "#ae6c6c",
    noseStroke: "#774731",
    collarboneStroke: "#86563f",
    preview: "#c08d77",
  },
  {
    id: "CARAMEL",
    label: "Caramel",
    faceHex: "#c48a70",
    shadowHex: "#955e42",
    blushHex: "#ae6c67",
    noseStroke: "#734027",
    collarboneStroke: "#834f35",
    preview: "#c48a70",
  },
  {
    id: "DEEP",
    label: "Deep",
    faceHex: "#996550",
    shadowHex: "#6e3f2b",
    blushHex: "#95605a",
    noseStroke: "#4d2516",
    collarboneStroke: "#5d3221",
    preview: "#996550",
  },
  {
    id: "EBONY",
    label: "Ebony",
    faceHex: "#865745",
    shadowHex: "#543022",
    blushHex: "#7c4c48",
    noseStroke: "#381a10",
    collarboneStroke: "#472418",
    preview: "#865745",
  },
];

export function getSkinToneConfig(id: SkinTone): SkinToneConfig {
  const found = SKIN_TONES.find((s) => s.id === id);
  return found || SKIN_TONES[1]; // Default Fair
}
