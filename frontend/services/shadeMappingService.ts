/**
 * Shade Mapping and Comparison API Service
 */

import { apiClient } from "./api";
import { CrossBrandCompareResponse } from "../types/manufacturer";
import { ToneFamily, UniversalLevel } from "../types/uhcr";

export interface CrossBrandComparePayload {
  market: string;
  target: {
    level: UniversalLevel;
    primary_tone: ToneFamily;
    secondary_tone?: ToneFamily | null;
    tone_intensity?: string;
    colour_family?: string;
  };
  product_categories?: string[];
  require_verified_mapping?: boolean;
  max_level_difference?: number;
  limit?: number;
}

export async function compareShades(
  payload: CrossBrandComparePayload
): Promise<CrossBrandCompareResponse> {
  return apiClient<CrossBrandCompareResponse>("/shade-mapping/compare", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
