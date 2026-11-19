/**
 * SkinRenderer.ts
 * Manages dermal skin tone calculations and facial protection.
 */

import { SkinTone } from "../../../constants/skinTones";
import { SkinCustomAdjustment } from "../types/avatar.types";
import {
  calculateContinuousSkinColor,
  calculateSkinDermalShift,
} from "../data/skinTonePalette";

export class SkinRenderer {
  public static calculateShift(
    baseTone: SkinTone,
    custom: SkinCustomAdjustment
  ) {
    const targetRgb = calculateContinuousSkinColor(baseTone, custom);
    return calculateSkinDermalShift(targetRgb);
  }
}
