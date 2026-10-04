import { apiFetch } from "./client";

export interface Alert {
  id: number;
  location_id: number;
  location_name: string | null;
  title: string;
  severity: "HIGH" | "CRITICAL";
  message: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  created_at: string;
  /** Percentage points from 0 to 100, or null if the source prediction is unavailable. */
  risk_score: number | null;
  /** Predicted-class probability as a fraction from 0 to 1, or null if unavailable. */
  probability: number | null;
  risk_timestamp: string | null;
  acknowledged_at: string | null;
  resolved_at: string | null;
  response_recommendation: string;
}

export function getAlerts(locationId?: number): Promise<Alert[]> {
  const query = locationId === undefined ? "" : `?location_id=${locationId}`;
  return apiFetch<Alert[]>(`/api/alerts${query}`);
}

export function acknowledgeAlert(alertId: number): Promise<Alert> {
  return apiFetch<Alert>(`/api/alerts/${alertId}/acknowledge`, { method: "POST" });
}

export function resolveAlert(alertId: number): Promise<Alert> {
  return apiFetch<Alert>(`/api/alerts/${alertId}/resolve`, { method: "POST" });
}