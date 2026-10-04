import { apiFetch } from "./client";

export type PredictionFeatures = {
  rainfall_24h: number;
  /** Model input scale: percentage points (0-100), converted from stored fraction. */
  soil_moisture: number;
  slope: number;
  elevation: number;
  ndvi: number;
  historical_events: number;
};

export type ModelPrediction = {
  risk_level: string;
  /** Predicted-class probability as a fraction from 0 to 1. */
  probability: number;
  /** Each class probability is a fraction from 0 to 1. */
  probabilities: Record<string, number>;
};

export type StatelessPredictionResponse = ModelPrediction;

export type PreparedPredictionFeatures = {
  location_id: number;
  observation_id: number;
  observed_at: string;
  features: PredictionFeatures;
};

export type PredictionFeaturesResponse = PreparedPredictionFeatures;

export type FeatureImportance = {
  name: string;
  importance: number;
};

export type PredictionResponse = {
  location_id: number;
  observation_id: number;
  observed_at: string;
  features: PredictionFeatures;
  risk_level: string;
  /** Predicted-class probability as a fraction from 0 to 1. */
  probability: number;
  /** Each class probability is a fraction from 0 to 1. */
  probabilities: Record<string, number>;
  risk_record_id: number;
  /** Percentage points from 0 to 100. */
  risk_score: number;
  explanation: string[];
  alert_created: boolean;
  alert_reused: boolean;
};

export async function runActualPrediction(
  locationId: number,
): Promise<PredictionResponse> {
  return apiFetch<PredictionResponse>(`/api/predictions/${locationId}/run`, {
    method: "POST",
  });
}

export async function getPreparedPredictionFeatures(
  locationId: number,
): Promise<PreparedPredictionFeatures> {
  return apiFetch<PreparedPredictionFeatures>(
    `/api/predictions/features/${locationId}`,
  );
}

export async function predictScenario(
  features: PredictionFeatures,
): Promise<ModelPrediction> {
  return apiFetch<ModelPrediction>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(features),
  });
}

export async function getFeatureImportance(): Promise<FeatureImportance[]> {
  return apiFetch<FeatureImportance[]>("/api/predictions/feature-importance");
}

/**
 * Compatibility aliases for the existing What-If route.
 * These use the same current backend endpoints without changing behavior.
 */
export async function getPredictionFeatures(
  locationId: number,
): Promise<PredictionFeaturesResponse> {
  return getPreparedPredictionFeatures(locationId);
}

export async function predictRisk(
  features: PredictionFeatures,
): Promise<StatelessPredictionResponse> {
  return predictScenario(features);
}