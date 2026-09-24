import { apiFetch } from "./client";

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