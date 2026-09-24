import { apiFetch } from "./client";

export type CreateFieldReport = {
  location_name: string;
  latitude: number;
  longitude: number;
  report_type: string;
  severity: string;
  description: string;
  image_url?: string | null;
};

export function createFieldReport(report: CreateFieldReport) {
  return apiFetch("/api/reports", {
    method: "POST",
    body: JSON.stringify(report),
  });
}
