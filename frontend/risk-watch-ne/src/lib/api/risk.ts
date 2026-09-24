import { apiFetch } from "./client";

export interface RiskZone {
  location_id: number;
  location: string;
  latitude: number;
  longitude: number;
  risk_level: string;
  risk_score: number;
}

export interface RiskLocation {
  id: number;
  name: string;
  district: string;
  latitude: number;
  longitude: number;
  elevation: number;
  slope: number;
  ndvi: number;
  historical_events: number;
  monitored: boolean;
  risk_score: number;
  risk_level?: string;
}

export interface RiskRecord {
  id: number;
  location_id: number;
  rainfall_24h: number;
  soil_moisture: number;
  slope: number;
  elevation: number;
  ndvi: number;
  historical_events: number;
  risk_score: number;
  risk_level: string;
  probability: number;
  created_at: string;
}

export interface LocationRisk {
  location: RiskLocation;
  risk_record: RiskRecord | null;
  risk_available: boolean;
}

export function getRiskZones(): Promise<RiskZone[]> {
  return apiFetch<RiskZone[]>("/api/risk/zones");
}

export function getRiskZone(locationId: number) {
  return apiFetch<LocationRisk>(`/api/risk/${locationId}`);
}