/**
 * HairColourTransform.ts
 * Prepares colorimetric transformations and shader pigment uniforms for hair regions.
 */

import { RegionColourConfig } from "../types/avatar.types";
import { resolveRegionShading, ResolvedRegionShading } from "../services/avatarColourAdapter";

export class HairColourTransform {
  /**
   * Prepares resolved shading for roots, mid-lengths, and ends.
   */
  public static transform(config: RegionColourConfig): ResolvedRegionShading {
    return resolveRegionShading(config);
  }
}
