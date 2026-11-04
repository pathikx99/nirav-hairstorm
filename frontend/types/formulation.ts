/**
 * Formulation Types
 */

import { HairAssessmentInput, HairRegion } from "./assessment";
import { ToneFamily, ToneIntensity, UniversalLevel } from "./uhcr";

export type ServiceClassification =
  | "DEPOSIT"
  | "DARKENING"
  | "SAME_LEVEL_COLOURING"
  | "LIFTING"
  | "TONING"
  | "NEUTRALISATION"
  | "COLOUR_REMOVAL"
  | "LIGHTENING"
  | "MULTI_STAGE_PROCESS"
  | "UNSUPPORTED"
  | "INSUFFICIENT_INFORMATION";

export type SafetyStatus = "PASS" | "WARNING" | "BLOCKED" | "NEEDS_ASSESSMENT";

export type FormulationResultStatus =
  | "DRAFT"
  | "INSUFFICIENT_INFORMATION"
  | "BLOCKED"
  | "REQUIRES_PROFESSIONAL_REVIEW"
  | "ELIGIBLE_FOR_REVIEW"
  | "APPROVED_BY_COLOURIST"
  | "SUPERSEDED";

export type ProcessMode = "PREFERRED_MANUFACTURER" | "CROSS_BRAND_COMPARISON";

export interface TargetColourInput {
  target_colour_id?: string;
  universal_level: UniversalLevel;
  primary_tone: ToneFamily;
  secondary_tone?: ToneFamily | null;
  tone_intensity: ToneIntensity;
  reference_image_id?: string | null;
  notes?: string | null;
}

export interface FormulationEvaluateRequest {
  assessment?: HairAssessmentInput;
  target_colour?: TargetColourInput;
  mode: ProcessMode;
  manufacturer_id?: string | null;
  manufacturer_ids?: string[];
  market: string;
}

export interface SafetyCheckResult {
  check_code: string;
  status: SafetyStatus;
  title: string;
  detail: string;
  blocked_reason?: string | null;
  recommendation?: string | null;
}

export interface ProductComponentFormula {
  product_type: string;
  product_id?: string | null;
  product_name: string;
  shade_id?: string | null;
  shade_code?: string | null;
  shade_name?: string | null;
  parts: number;
  weight_grams?: number | null;
  length_cm?: number | null;
  is_pure_natural?: boolean;
  notes?: string | null;
}

export interface DeveloperComponentFormula {
  developer_id?: string | null;
  developer_name: string;
  concentration_percent: number;
  volume_in_vol?: number | null;
  parts: number;
  weight_grams?: number | null;
}

export interface FormulationStage {
  stage_number: number;
  service_type: ServiceClassification;
  stage_description: string;
  target_regions: HairRegion[];
  products: ProductComponentFormula[];
  developer?: DeveloperComponentFormula | null;
  mixing_ratio_text: string;
  development_time_minutes: number;
  development_time_range: string;
  heat_permitted: boolean;
  application_instructions: string;
  rules_applied: string[];
  source_document_references: string[];
}

export interface RegionFormulationPlan {
  region: HairRegion;
  initial_level: number;
  target_level: number;
  level_delta: number;
  service_classification: ServiceClassification;
  stages: FormulationStage[];
  grey_coverage_notes?: string | null;
  special_mix_notes?: string | null;
}

export interface PredictedResult {
  universal_colour?: {
    level: UniversalLevel;
    primary_tone: ToneFamily;
    secondary_tone?: ToneFamily | null;
    tone_intensity: ToneIntensity;
  } | null;
  confidence: "HIGH" | "MEDIUM" | "LOW" | "INSUFFICIENT";
  guarantee_disclaimer: string;
}

export interface FormulationResultResponse {
  formulation_id: string;
  status: FormulationResultStatus;
  market: string;
  manufacturer_id?: string | null;
  manufacturer_name?: string | null;
  catalogue_version_id?: string | null;
  engine_version: string;
  assessment_id?: string | null;
  target_colour_id?: string | null;
  service_classification: ServiceClassification;
  stages: FormulationStage[];
  regions: RegionFormulationPlan[];
  shared_regional_formulation: boolean;
  safety_checks: SafetyCheckResult[];
  warnings: string[];
  missing_information: string[];
  predicted_result: PredictedResult;
  source_references: string[];
  chemical_equivalence: "NOT_ESTABLISHED";
  evaluated_at: string;
}
