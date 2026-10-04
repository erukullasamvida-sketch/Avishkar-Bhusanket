import { apiFetch } from "./client";

export type EnvironmentalObservation = {
  id: number;
  location_id: number;
  rainfall_24h: number;
  /** Open-Meteo volumetric fraction, stored as a value from 0 to 1. */
  soil_moisture: number;
  temperature: number | null;
  humidity: number | null;
  source: string;
  observed_at: string;
  data_type: string;
  data_status: string;
  timestamp_type: string;
  timestamp_timezone: string | null;
  fetched_at: string | null;
};

export async function getEnvironmentalData(
  locationId: number,
): Promise<EnvironmentalObservation[]> {
  return apiFetch<EnvironmentalObservation[]>(
    `/api/environmental?location_id=${locationId}`,
  );
}

export async function refreshEnvironmentalData(
  locationId: number,
): Promise<EnvironmentalObservation> {
  return apiFetch<EnvironmentalObservation>(`/api/environmental/${locationId}`, {
    method: "POST",
  });
}
