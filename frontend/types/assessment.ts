/**
 * Hair Assessment Types
 */

import { ToneFamily, UniversalLevel } from "./uhcr";

export type HairRegion = "ROOTS" | "MID_LENGTHS" | "ENDS";

export type Porosity = "LOW" | "NORMAL" | "HIGH" | "EXTREME" | "UNKNOWN";

export type HairCondition =
  | "VIRGIN"
  | "HEALTHY"
  | "MODERATELY_DAMAGED"
  | "SEVERELY_DAMAGED"
  | "UNKNOWN";

export interface HairRegionInput {
  region: HairRegion;
  observed_level: UniversalLevel;
  observed_undertone?: ToneFamily | null;
  existing_artificial_colour: boolean;
  grey_percentage: number;
  porosity: Porosity;
  condition: HairCondition;
  is_on_scalp: boolean;
  colourist_confirmed?: boolean;
}

export interface ClientHistoryInput {
  has_allergy_history: boolean;
  allergy_details?: string | null;
  patch_test_completed_48h: boolean;
  scalp_condition: string;
  previous_chemical_services: string[];
  has_metallic_salts_or_henna: boolean;
  has_sodium_hydroxide_relaxer: boolean;
}

export interface HairAssessmentInput {
  assessment_id?: string;
  market: string;
  history: ClientHistoryInput;
  roots: HairRegionInput;
  mid_lengths: HairRegionInput;
  ends: HairRegionInput;
  colourist_confirmation_status?: boolean;
}

export interface PhotoRegionPrediction {
  predicted_level: UniversalLevel;
  predicted_tone: ToneFamily;
  confidence: number;
  colourist_confirmed: boolean;
}

export interface PhotoAssessmentState {
  image_url?: string;
  lighting_type?: string;
  white_balance_status?: string;
  regions: {
    roots?: PhotoRegionPrediction;
    mid_lengths?: PhotoRegionPrediction;
    ends?: PhotoRegionPrediction;
  };
}
