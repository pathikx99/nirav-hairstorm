/**
 * Formulation API Service
 */

import { apiClient } from "./api";
import {
  FormulationEvaluateRequest,
  FormulationResultResponse,
} from "../types/formulation";
import { Manufacturer } from "../types/manufacturer";

export async function evaluateFormulation(
  request: FormulationEvaluateRequest
): Promise<FormulationResultResponse> {
  return apiClient<FormulationResultResponse>("/formulations/evaluate", {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getManufacturers(): Promise<Manufacturer[]> {
  return apiClient<Manufacturer[]>("/manufacturers");
}
