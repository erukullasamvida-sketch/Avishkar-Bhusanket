import { apiFetch } from "./client";

export interface Alert {
  id: number;
  location_id: number;
  location: string | null;
  title: string;
  severity: string;
  message: string;
  status: string;
  created_at: string;
}

export function getAlerts(locationId?: number): Promise<Alert[]> {
  const query = locationId === undefined ? "" : `?location_id=${locationId}`;
  return apiFetch<Alert[]>(`/api/alerts${query}`);
}