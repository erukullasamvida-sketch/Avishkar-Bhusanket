import { apiFetch } from "./client";

export type HistoricalLandslideEvent = {
  event_id: string;
  location_name: string;
  event_date: string;
  district: string;
  description: string;
  reported_impact: string | null;
  source_name: string;
  source_url: string;
};

export type HistoricalEventsResponse = {
  location_id: number;
  location_name: string;
  events: HistoricalLandslideEvent[];
};

export function getHistoricalEvents(
  locationId: number,
): Promise<HistoricalEventsResponse> {
  return apiFetch<HistoricalEventsResponse>(
    `/api/historical-events/${locationId}`,
  );
}
