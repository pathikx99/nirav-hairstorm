/**
 * avatarAssetService.ts
 * High-performance asset loading, caching, and URL resolution for Nirav Hairstorm Hair Avatar Studio.
 */

import { AvatarView, HairstyleId } from "../types/avatar.types";

export const AVATAR_ASSET_VERSION = "20261119-v1";

export interface AvatarAssetUrls {
  baseModel: string;
  cleanBg: string;
  hairAlpha: string;
  hairZones: string;
  hairFlow: string;
  hairGrey: string;
  skinMask?: string;
  featuresProtect?: string;
  eyebrows?: string;
  scalp?: string;
  follicles?: string;
}

export function getAvatarAssetUrl(relativePath: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_AVATAR_CDN_URL?.replace(/\/$/, "") || "";
  const cleanPath = relativePath.startsWith("/") ? relativePath : `/${relativePath}`;
  return `${cdnBase}${cleanPath}?v=${AVATAR_ASSET_VERSION}`;
}

/**
 * Returns all asset URLs required to render a given hairstyle in a given perspective.
 */
export function getHairstyleAssetUrls(hairstyle: HairstyleId, view: AvatarView): AvatarAssetUrls {
  const isFront = view === "front";
  const archPrefix = `/avatar/archetypes/${hairstyle}`;
  const sharedPrefix = "/avatar";

  if (isFront) {
    return {
      baseModel: getAvatarAssetUrl(`${archPrefix}/avatar_front_model.jpg`),
      cleanBg: getAvatarAssetUrl(`${archPrefix}/hair_front_clean_bg.jpg`),
      hairAlpha: getAvatarAssetUrl(`${archPrefix}/hair_front_alpha.png`),
      hairZones: getAvatarAssetUrl(`${archPrefix}/hair_front_zones.png`),
      hairFlow: getAvatarAssetUrl(`${archPrefix}/hair_front_flow.png`),
      hairGrey: getAvatarAssetUrl(`${archPrefix}/hair_front_grey_strands.png`),
      skinMask: getAvatarAssetUrl(`${sharedPrefix}/hair_front_skin.png`),
      featuresProtect: getAvatarAssetUrl(`${sharedPrefix}/hair_front_features_protect.png`),
      eyebrows: getAvatarAssetUrl(`${sharedPrefix}/hair_front_eyebrows.png`),
      scalp: getAvatarAssetUrl(`${sharedPrefix}/hair_front_scalp.png`),
      follicles: getAvatarAssetUrl(`${sharedPrefix}/hair_front_follicles.png`),
    };
  } else {
    return {
      baseModel: getAvatarAssetUrl(`${archPrefix}/avatar_back_model.jpg`),
      cleanBg: getAvatarAssetUrl(`${archPrefix}/hair_back_clean_bg.jpg`),
      hairAlpha: getAvatarAssetUrl(`${archPrefix}/hair_back_alpha.png`),
      hairZones: getAvatarAssetUrl(`${archPrefix}/hair_back_zones.png`),
      hairFlow: getAvatarAssetUrl(`${archPrefix}/hair_back_flow.png`),
      hairGrey: getAvatarAssetUrl(`${archPrefix}/hair_back_grey_strands.png`),
    };
  }
}

// In-memory image caching singleton
const globalImageCache: Map<string, Promise<HTMLImageElement>> = new Map();

export function loadAvatarImage(url: string): Promise<HTMLImageElement> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cannot load images during server-side rendering"));
  }

  const existing = globalImageCache.get(url);
  if (existing) return existing;

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      globalImageCache.delete(url); // allow retry on error
      reject(new Error(`Failed to load avatar asset: ${url} (${err})`));
    };
    img.src = url;
  });

  globalImageCache.set(url, promise);
  return promise;
}

export interface LoadedAvatarTextures {
  baseModel: HTMLImageElement;
  cleanBg: HTMLImageElement;
  hairAlpha: HTMLImageElement;
  hairZones: HTMLImageElement;
  hairFlow: HTMLImageElement;
  hairGrey: HTMLImageElement;
  skinMask?: HTMLImageElement;
  featuresProtect?: HTMLImageElement;
  eyebrows?: HTMLImageElement;
  scalp?: HTMLImageElement;
  follicles?: HTMLImageElement;
}

/**
 * Preloads all textures for a hairstyle and perspective in parallel.
 */
export async function preloadHairstyleTextures(
  hairstyle: HairstyleId,
  view: AvatarView
): Promise<LoadedAvatarTextures> {
  const urls = getHairstyleAssetUrls(hairstyle, view);
  const isFront = view === "front";

  const [baseModel, cleanBg, hairAlpha, hairZones, hairFlow, hairGrey] = await Promise.all([
    loadAvatarImage(urls.baseModel),
    loadAvatarImage(urls.cleanBg),
    loadAvatarImage(urls.hairAlpha),
    loadAvatarImage(urls.hairZones),
    loadAvatarImage(urls.hairFlow),
    loadAvatarImage(urls.hairGrey),
  ]);

  let skinMask: HTMLImageElement | undefined;
  let featuresProtect: HTMLImageElement | undefined;
  let eyebrows: HTMLImageElement | undefined;
  let scalp: HTMLImageElement | undefined;
  let follicles: HTMLImageElement | undefined;

  if (isFront && urls.skinMask && urls.featuresProtect && urls.eyebrows) {
    [skinMask, featuresProtect, eyebrows, scalp, follicles] = await Promise.all([
      loadAvatarImage(urls.skinMask),
      loadAvatarImage(urls.featuresProtect),
      loadAvatarImage(urls.eyebrows),
      urls.scalp ? loadAvatarImage(urls.scalp) : Promise.resolve(undefined as unknown as HTMLImageElement),
      urls.follicles ? loadAvatarImage(urls.follicles) : Promise.resolve(undefined as unknown as HTMLImageElement),
    ]);
  }

  return {
    baseModel,
    cleanBg,
    hairAlpha,
    hairZones,
    hairFlow,
    hairGrey,
    skinMask,
    featuresProtect,
    eyebrows,
    scalp,
    follicles,
  };
}
