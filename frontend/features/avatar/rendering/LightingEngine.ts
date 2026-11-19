/**
 * LightingEngine.ts
 * Environmental illumination and metamerism matrix computations.
 */

import { AvatarLightingEnvironment } from "../types/avatar.types";
import { getLightingShaderUniforms } from "../data/lightingProfiles";

export class LightingEngine {
  public static getUniforms(mode: AvatarLightingEnvironment) {
    return getLightingShaderUniforms(mode);
  }
}
