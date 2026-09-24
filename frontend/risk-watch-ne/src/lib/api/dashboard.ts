import { apiFetch } from "./client";

export interface DashboardData {
  monitored_locations: number;
  high_risk_zones: number;
  critical_zones: number;
  active_alerts: number;
  average_risk_score: number;
  system_status: string;
}

export function getDashboard(): Promise<DashboardData> {
  return apiFetch<DashboardData>("/api/dashboard");
}