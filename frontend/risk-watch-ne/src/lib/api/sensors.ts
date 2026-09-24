import { apiFetch } from "./client";

export interface Sensor {
  id?: number;
  name: string;
  type: string;
  status: string;
  value?: number;
}

export function getSensors(): Promise<Sensor[]> {
  return apiFetch<Sensor[]>("/api/sensors");
}