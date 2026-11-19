/**
 * Manufacturer and Shade Mapping Types
 */

import { ToneFamily, ToneIntensity, UniversalLevel } from "./uhcr";

export interface Manufacturer {
  id: string;
  name: string;
  slug: string;
  supported_markets?: string[] | Record<string, unknown>;
  status: string;
}

export interface CandidateShadeMatch {
  manufacturer: string;
  manufacturer_id?: string;
  product_line: string;
  product_name?: string;
  product_id?: string;
  shade_id?: string;
  shade_code: string;
  shade_name: string;
  match_classification: string;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  composite_distance: number;
  level_distance: number;
  tone_distance: number;
  accuracy_percentage?: number;
  substitution_recipe?: string;
  recommended_developer?: string;
  mixing_ratio?: string;
  processing_time_minutes?: number;
  universal_mapping: {
    level: UniversalLevel;
    primary_tone: ToneFamily;
    secondary_tone?: ToneFamily | null;
    tone_intensity: ToneIntensity;
  };
  chemical_equivalence: "NOT_ESTABLISHED";
}

export interface CrossBrandCompareResponse {
  mapping_engine_version: string;
  market: string;
  target: {
    level: UniversalLevel;
    primary_tone: ToneFamily;
    secondary_tone?: ToneFamily | null;
  };
  total: number;
  results: CandidateShadeMatch[];
}
