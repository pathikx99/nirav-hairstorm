/**
 * avatarRegistry.ts
 * Hairstyle Registries & Optical Configuration for Nirav Hairstorm Digital Human.
 */

import { HairstyleId, HairstyleMetadata } from "../types/avatar.types";

export const HAIRSTYLES_REGISTRY: Record<HairstyleId, HairstyleMetadata> = {
  straight: {
    id: "straight",
    name: "Silky Straight",
    subtitle: "Type 1A–1C",
    description: "Glass-like sleek straight hair with high directional specular sheen and uniform root-to-end alignment.",
    typeCode: "Type 1",
    curlPattern: "Sleek planar strands with zero curl radius",
    specularExponent: 42.0,
    internalEntrapment: 0.00,
    diffuseDispersion: 0.10,
    coherence: 1.25,
    volumeMultiplier: 1.0,
    strandCaliber: "fine",
    thumbnailFront: "/avatar/archetypes/straight/avatar_front_model.jpg",
    thumbnailBack: "/avatar/archetypes/straight/avatar_back_model.jpg",
  },
  wavy: {
    id: "wavy",
    name: "Soft Beach Waves",
    subtitle: "Type 2A–2C",
    description: "Flowing S-pattern cascade with natural salon bounce, soft highlights, and gentle volumetric contour.",
    typeCode: "Type 2",
    curlPattern: "Loose undulating S-waves with 25-35mm amplitude",
    specularExponent: 28.0,
    internalEntrapment: 0.05,
    diffuseDispersion: 0.30,
    coherence: 1.00,
    volumeMultiplier: 1.15,
    strandCaliber: "medium",
    thumbnailFront: "/avatar/archetypes/wavy/avatar_front_model.jpg",
    thumbnailBack: "/avatar/archetypes/wavy/avatar_back_model.jpg",
  },
  curly: {
    id: "curly",
    name: "Spring Curls",
    subtitle: "Type 3A–3C",
    description: "Defined corkscrew ringlets with multi-angle light catches, dynamic depth shadows, and expressive volume.",
    typeCode: "Type 3",
    curlPattern: "Defined helical spiral coils with 12-18mm pitch",
    specularExponent: 24.0,
    internalEntrapment: 0.22,
    diffuseDispersion: 0.45,
    coherence: 0.90,
    volumeMultiplier: 1.35,
    strandCaliber: "medium",
    thumbnailFront: "/avatar/archetypes/curly/avatar_front_model.jpg",
    thumbnailBack: "/avatar/archetypes/curly/avatar_back_model.jpg",
  },
  coily: {
    id: "coily",
    name: "Sculpted Coily",
    subtitle: "Type 4A–4C",
    description: "Dense micro-coiled afro crown with soft diffuse light entrapment, rich sculptural silhouette, and tactile texture.",
    typeCode: "Type 4",
    curlPattern: "Tight Z-pattern and micro-helices with <6mm diameter",
    specularExponent: 18.0,
    internalEntrapment: 0.38,
    diffuseDispersion: 0.65,
    coherence: 0.80,
    volumeMultiplier: 1.55,
    strandCaliber: "coarse",
    thumbnailFront: "/avatar/archetypes/coily/avatar_front_model.jpg",
    thumbnailBack: "/avatar/archetypes/coily/avatar_back_model.jpg",
  },
};

export const HAIRSTYLES_ORDER: HairstyleId[] = ["straight", "wavy", "curly", "coily"];

export function getHairstyleMetadata(id: HairstyleId): HairstyleMetadata {
  return HAIRSTYLES_REGISTRY[id] || HAIRSTYLES_REGISTRY.wavy;
}
