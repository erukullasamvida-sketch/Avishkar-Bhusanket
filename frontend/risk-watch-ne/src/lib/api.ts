import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { apiFetch } from "./api/client";
import {
  DEMO_ALERTS,
  DEMO_LOCATIONS,
  type AlertRow,
  type FieldReportRow,
  type LocationRow,
} from "./demo-data";

/** Runs a live query but never lets a slow/failed network break the demo. */
async function withFallback<T>(run: () => Promise<T[] | null>, fallback: T[]): Promise<T[]> {
  try {
    const rows = await run();
    if (!rows || rows.length === 0) return fallback;
    return rows;
  } catch {
    return fallback;
  }
}

const num = (v: unknown) => Number(v ?? 0);

export const locationsQuery = queryOptions({
  queryKey: ["risk_locations"],
  staleTime: 30_000,
  queryFn: async (): Promise<LocationRow[]> =>
    withFallback(async () => {
      const { data, error } = await supabase
        .from("risk_locations")
        .select("*")
        .order("risk_score", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        ...r,
        risk_score: num(r.risk_score),
        rainfall_24h: num(r.rainfall_24h),
        soil_moisture: num(r.soil_moisture),
        slope_angle: num(r.slope_angle),
        elevation: num(r.elevation),
      })) as LocationRow[];
    }, DEMO_LOCATIONS),
});

export const alertsQuery = queryOptions({
  queryKey: ["alerts"],
  staleTime: 10_000,
  queryFn: async (): Promise<AlertRow[]> =>
    withFallback(async () => {
      const { data, error } = await supabase
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({ ...r, risk_score: num(r.risk_score) })) as AlertRow[];
    }, DEMO_ALERTS),
});

export const reportsQuery = queryOptions({
  queryKey: ["field_reports"],
  staleTime: 10_000,
  queryFn: async (): Promise<FieldReportRow[]> =>
    (await apiFetch<Record<string, unknown>[]>("/api/reports")).map((row) => ({
      id: String(row.id),
      location_name: String(row.location_name),
      report_type: String(row.report_type),
      severity: String(row.severity ?? "moderate"),
      description: String(row.description),
      photo_url: (row.image_url as string | null | undefined) ?? null,
      status: String(row.status),
      reporter_name: "Field Officer",
      created_at: String(row.created_at),
    })),
});
