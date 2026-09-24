import { apiFetch } from "./client";

export interface AnalyticsSummary {
  total_events: number;
  critical_events: number;
  high_risk_events: number;
  average_risk: number;
}

export function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  return apiFetch<AnalyticsSummary>("/api/analytics/summary");
}