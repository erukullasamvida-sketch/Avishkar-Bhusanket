import { apiFetch } from "./client";

export type PredictionFeatures = {
  rainfall_24h: number;
  soil_moisture: number;
  slope: number;
  elevation: number;
  ndvi: number;
  historical_events: number;
};

export type StatelessPredictionResponse = {
  risk_level: string;
  probability: number;
  probabilities: Record<string, number>;
};

export type PredictionFeaturesResponse = {
  location_id: number;
  observation_id: number;
  observed_at: string;
  features: PredictionFeatures;
};

export type PredictionResponse = {
  location_id: number;
  observation_id: number;
  observed_at: string;
  features: {
    rainfall_24h: number;
    soil_moisture: number;
    slope: number;
    elevation: number;
    ndvi: number;
    historical_events: number;
  };
  risk_level: string;
  probability: number;
  probabilities: Record<string, number>;
  risk_record_id: number;
  risk_score: number;
  explanation: string[];
  alert_created: boolean;
  alert_reused: boolean;
};

export async function getPrediction(locationId: number): Promise<PredictionResponse> {
  return apiFetch<PredictionResponse>(`/api/predictions/${locationId}`);
}

export async function getPredictionFeatures(
  locationId: number,
): Promise<PredictionFeaturesResponse> {
  return apiFetch<PredictionFeaturesResponse>(`/api/predictions/features/${locationId}`);
}

export async function predictRisk(
  features: PredictionFeatures,
): Promise<StatelessPredictionResponse> {
  return apiFetch<StatelessPredictionResponse>("/api/predictions", {
    method: "POST",
    body: JSON.stringify(features),
  });
}