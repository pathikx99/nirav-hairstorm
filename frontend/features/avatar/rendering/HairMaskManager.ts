/**
 * HairMaskManager.ts
 * Manages texture asset lifecycle, preloading, and caching across hairstyles and viewing angles.
 */

import { AvatarView, HairstyleId } from "../types/avatar.types";
import {
  LoadedAvatarTextures,
  preloadHairstyleTextures,
} from "../services/avatarAssetService";

export class HairMaskManager {
  private cache: Map<string, Promise<LoadedAvatarTextures>> = new Map();

  private getCacheKey(hairstyle: HairstyleId, view: AvatarView): string {
    return `${hairstyle}_${view}`;
  }

  public getTextures(
    hairstyle: HairstyleId,
    view: AvatarView
  ): Promise<LoadedAvatarTextures> {
    const key = this.getCacheKey(hairstyle, view);
    let cached = this.cache.get(key);
    if (!cached) {
      cached = preloadHairstyleTextures(hairstyle, view);
      this.cache.set(key, cached);
    }
    return cached;
  }

  /**
   * Warm up adjacent views or hairstyles in the background.
   */
  public preloadAdjacent(currentHairstyle: HairstyleId, currentView: AvatarView): void {
    const alternateView: AvatarView = currentView === "front" ? "back" : "front";
    this.getTextures(currentHairstyle, alternateView).catch(() => {});
  }

  public clear(): void {
    this.cache.clear();
  }
}

export const globalHairMaskManager = new HairMaskManager();
