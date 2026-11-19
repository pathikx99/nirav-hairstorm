/**
 * avatarAssetService.ts
 * Production Static Asset Delivery Service for Digital Human Avatar.
 */

export const AVATAR_ASSET_VERSION = "20261118-master-static-v1";

// Asset integrity ledger
export const ASSET_INTEGRITY_LEDGER: Record<string, { md5: string; sizeBytes: number; mime: string }> = {
  // Master Studio Model Photographs
  "avatar_front_model.jpg": { md5: "64c7bd0489851b6cde833323660984e1", sizeBytes: 358107, mime: "image/jpeg" },
  "avatar_back_model.jpg": { md5: "d4105636ae6f79204bf4ad836fd41305", sizeBytes: 308453, mime: "image/jpeg" },
};

/**
 * Returns the fully qualified URL for an avatar asset.
 */
export function getAvatarAssetUrl(filename: string): string {
  const cdnBase = process.env.NEXT_PUBLIC_AVATAR_CDN_URL?.replace(/\/$/, "") || "";
  const basePath = cdnBase ? `${cdnBase}/avatar` : "/avatar";
  return `${basePath}/${filename}?v=${AVATAR_ASSET_VERSION}`;
}

// Global in-memory image preloading cache
const imageCache: Map<string, Promise<HTMLImageElement>> = new Map();

export function loadAvatarImage(url: string): Promise<HTMLImageElement> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cannot preload image in SSR environment"));
  }

  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = (err) => {
      imageCache.delete(url);
      reject(new Error(`Failed to load avatar image from ${url}: ${err}`));
    };
    img.src = url;
  });

  imageCache.set(url, promise);
  return promise;
}

export function preloadAvatarAssets(view: "front" | "back"): Promise<HTMLImageElement[]> {
  const filename = view === "back" ? "avatar_back_model.jpg" : "avatar_front_model.jpg";
  return Promise.all([loadAvatarImage(getAvatarAssetUrl(filename))]);
}
