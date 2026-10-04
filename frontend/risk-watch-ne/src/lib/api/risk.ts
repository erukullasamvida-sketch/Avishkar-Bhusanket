import { apiFetch } from "./client";
import type { BackendLocation } from "./locations";

export interface RiskZone {
  location_id: number;
  location: string;
  latitude: number;
  longitude: number;
  risk_level: string;
  /** Risk score in percentage points (0-100). */
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
  /** Predicted-class probability as a fraction from 0 to 1; null before a prediction. */
  probability: number | null;
  risk_level?: string;
}

export interface RiskRecord {
  id: number;
  location_id: number;
  rainfall_24h: number;
  /** Model input scale: percentage points (0-100). */
  soil_moisture: number;
  slope: number;
  elevation: number;
  ndvi: number;
  historical_events: number;
  /** Stored risk score in percentage points (0-100). */
  risk_score: number;
  risk_level: string;
  /** Predicted-class probability as a fraction from 0 to 1. */
  probability: number;
  created_at: string;
}

export interface LocationRisk {
  location: BackendLocation;
  risk_record: RiskRecord | null;
  risk_available: boolean;
}

export interface RiskTimeline {
  location_id: number;
  location_name: string;
  events: (RiskRecord & { response_recommendation: string })[];
}

export function getRiskZones(): Promise<RiskZone[]> {
  return apiFetch<RiskZone[]>("/api/risk/zones");
}

export function getRiskZone(locationId: number) {
  return apiFetch<LocationRisk>(`/api/risk/${locationId}`);
}

export function getRiskTimeline(locationId: number): Promise<RiskTimeline> {
  return apiFetch<RiskTimeline>(`/api/risk/${locationId}/timeline`);
}