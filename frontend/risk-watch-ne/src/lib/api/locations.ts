import { apiFetch } from "./client";

export type BackendLocation = {
  id: number;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  vegetation: string;
  ndvi: number;
  historical_events: number;
  monitored: boolean;
};

export async function getLocations(search?: string): Promise<BackendLocation[]> {
  const query = search?.trim() ? `?${new URLSearchParams({ search: search.trim() })}` : "";
  return apiFetch<BackendLocation[]>(`/api/locations${query}`);
}