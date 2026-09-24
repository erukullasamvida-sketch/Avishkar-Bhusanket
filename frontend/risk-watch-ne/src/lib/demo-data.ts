/**
 * Offline fallback dataset. Mirrors the seeded database rows so every screen
 * still renders during a live demo if the network is slow or unavailable.
 */

export type LocationRow = {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  risk_score: number;
  rainfall_24h: number;
  soil_moisture: number;
  slope_angle: number;
  elevation: number;
  land_cover: string;
  population: number;
  nearby_villages: string;
  updated_at: string;
};

export type AlertRow = {
  id: string;
  location_id: string | null;
  location_name: string;
  title: string;
  message: string;
  severity: string;
  risk_score: number;
  predicted_in: string;
  status: string;
  created_at: string;
};

export type FieldReportRow = {
  id: string;
  location_name: string;
  report_type: string;
  severity: string;
  description: string;
  photo_url: string | null;
  status: string;
  reporter_name: string;
  created_at: string;
};

export type HistoryRow = {
  id: string;
  location_id: string;
  recorded_on: string;
  risk_score: number;
  rainfall: number;
};

export type DataSourceRow = {
  id: string;
  name: string;
  provider: string;
  category: string;
  status: string;
  latency_ms: number;
  refresh_interval: string;
  last_sync: string;
  description: string;
};

const now = () => new Date().toISOString();
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000).toISOString();

export const DEMO_LOCATIONS: LocationRow[] = [
  ["11111111-1111-4111-8111-000000000001", "Dima Hasao", "Dima Hasao", "Assam", 25.6, 93.17, 0.78, 120, 32, 38, 600, "Forest / Sparse", 14200, "Haflong, Maibong, Harangajao"],
  ["11111111-1111-4111-8111-000000000002", "Haflong", "Dima Hasao", "Assam", 25.165, 93.017, 0.67, 104, 29.5, 34, 680, "Hill Forest", 44000, "Jatinga, Mahur, Harangajao"],
  ["11111111-1111-4111-8111-000000000003", "Maibong", "Dima Hasao", "Assam", 25.3, 93.13, 0.73, 112, 31, 36.5, 420, "Mixed Forest", 9800, "Langting, Dittokcherra"],
  ["11111111-1111-4111-8111-000000000004", "Umrangso", "Dima Hasao", "Assam", 25.53, 92.7, 0.41, 68, 22, 24, 380, "Grass / Shrub", 12500, "Kalyani, Garampani"],
  ["11111111-1111-4111-8111-000000000005", "Karbi Anglong", "Karbi Anglong", "Assam", 26.0, 93.5, 0.58, 88, 26.5, 29, 520, "Forest / Sparse", 31000, "Diphu, Bokajan, Howraghat"],
  ["11111111-1111-4111-8111-000000000006", "Sivasagar", "Sivasagar", "Assam", 26.985, 94.64, 0.82, 142, 36, 31, 300, "Agriculture / Slope", 52000, "Nazira, Amguri"],
  ["11111111-1111-4111-8111-000000000007", "Jatinga", "Dima Hasao", "Assam", 25.09, 92.98, 0.54, 76, 25, 27.5, 750, "Hill Forest", 3200, "Haflong, Harangajao"],
  ["11111111-1111-4111-8111-000000000008", "Cachar", "Cachar", "Assam", 24.83, 92.78, 0.63, 96, 28, 22, 220, "Agriculture", 60000, "Silchar, Lakhipur"],
  ["11111111-1111-4111-8111-000000000009", "Diphu", "Karbi Anglong", "Assam", 25.84, 93.43, 0.36, 54, 19, 18.5, 186, "Urban / Mixed", 65000, "Manja, Dokmoka"],
  ["11111111-1111-4111-8111-000000000010", "Tamenglong", "Tamenglong", "Manipur", 24.98, 93.51, 0.49, 72, 24, 33, 1260, "Dense Forest", 8600, "Nungba, Khoupum"],
  ["11111111-1111-4111-8111-000000000011", "Aizawl Hills", "Aizawl", "Mizoram", 23.73, 92.72, 0.71, 118, 30.5, 40, 1130, "Hill Forest", 29300, "Durtlang, Sairang"],
  ["11111111-1111-4111-8111-000000000012", "Cherrapunji", "East Khasi Hills", "Meghalaya", 25.3, 91.7, 0.69, 168, 34, 37, 1430, "Plateau / Grass", 14800, "Mawsynram, Sohra"],
].map((row) => {
  const [id, name, district, state, latitude, longitude, risk_score, rainfall_24h, soil_moisture, slope_angle, elevation, land_cover, population, nearby_villages] = row as [
    string, string, string, string, number, number, number, number, number, number, number, string, number, string,
  ];
  return {
    id, name, district, state, latitude, longitude, risk_score, rainfall_24h,
    soil_moisture, slope_angle, elevation, land_cover, population, nearby_villages,
    updated_at: now(),
  };
});

export const DEMO_ALERTS: AlertRow[] = [
  { id: "a1", location_id: DEMO_LOCATIONS[5]!.id, location_name: "Sivasagar", title: "Critical risk detected near Sivasagar", message: "Continuous heavy rainfall with saturated soil. Immediate evacuation advisory for slope-adjacent settlements.", severity: "critical", risk_score: 0.82, predicted_in: "2 hours", status: "active", created_at: hoursAgo(0.2) },
  { id: "a2", location_id: DEMO_LOCATIONS[0]!.id, location_name: "Dima Hasao", title: "High risk in Dima Hasao", message: "Rainfall 120mm in 24h, soil moisture rising. Restrict movement on NH-27 hill stretch.", severity: "high", risk_score: 0.78, predicted_in: "6 hours", status: "active", created_at: hoursAgo(0.4) },
  { id: "a3", location_id: DEMO_LOCATIONS[2]!.id, location_name: "Maibong", title: "High risk in Maibong", message: "Slope instability detected along railway embankment.", severity: "high", risk_score: 0.73, predicted_in: "8 hours", status: "active", created_at: hoursAgo(0.8) },
  { id: "a4", location_id: DEMO_LOCATIONS[4]!.id, location_name: "Karbi Anglong", title: "Moderate risk in Karbi Anglong", message: "Soil moisture at 26.5%. Monitor over next 12 hours.", severity: "moderate", risk_score: 0.58, predicted_in: "12 hours", status: "acknowledged", created_at: hoursAgo(2) },
  { id: "a5", location_id: DEMO_LOCATIONS[10]!.id, location_name: "Aizawl Hills", title: "High risk in Aizawl Hills", message: "Steep slope with 118mm rainfall; historical landslide zone.", severity: "high", risk_score: 0.71, predicted_in: "10 hours", status: "active", created_at: hoursAgo(3) },
  { id: "a6", location_id: DEMO_LOCATIONS[3]!.id, location_name: "Umrangso", title: "Rainfall alert - 68 mm", message: "Region: Umrangso | Source: IMD rainfall radar.", severity: "moderate", risk_score: 0.41, predicted_in: "24 hours", status: "resolved", created_at: hoursAgo(24) },
  { id: "a7", location_id: DEMO_LOCATIONS[1]!.id, location_name: "Haflong", title: "High risk in Haflong", message: "Road cut slope showing tension cracks after 104mm rainfall.", severity: "high", risk_score: 0.67, predicted_in: "9 hours", status: "active", created_at: hoursAgo(5) },
  { id: "a8", location_id: DEMO_LOCATIONS[8]!.id, location_name: "Diphu", title: "Low risk advisory - Diphu", message: "Conditions stable. Routine monitoring continues.", severity: "low", risk_score: 0.36, predicted_in: "-", status: "resolved", created_at: hoursAgo(48) },
];

export const DEMO_REPORTS: FieldReportRow[] = [
  { id: "r1", location_name: "Dima Hasao", report_type: "Ground Crack", severity: "high", description: "Slope crack observed 40m along the hill road shoulder near village approach.", photo_url: null, status: "verified", reporter_name: "R. Terang", created_at: hoursAgo(4) },
  { id: "r2", location_name: "Karbi Anglong", report_type: "Road Blockage", severity: "critical", description: "Road damage with debris blocking one lane after overnight rain.", photo_url: null, status: "in_review", reporter_name: "B. Rongphar", created_at: hoursAgo(9) },
  { id: "r3", location_name: "Jatinga", report_type: "Waterlogging", severity: "moderate", description: "Water seepage from hill face onto the settlement path.", photo_url: null, status: "pending", reporter_name: "L. Thaosen", created_at: hoursAgo(24) },
  { id: "r4", location_name: "Cachar", report_type: "Landslide", severity: "high", description: "Land movement of about 15m width reported on the slope above the highway.", photo_url: null, status: "verified", reporter_name: "S. Dutta", created_at: hoursAgo(48) },
];

export const DEMO_HISTORY: HistoryRow[] = DEMO_LOCATIONS.flatMap((loc) =>
  Array.from({ length: 7 }, (_, d) => {
    const date = new Date(Date.now() - (6 - d) * 86_400_000);
    return {
      id: `${loc.id}-${d}`,
      location_id: loc.id,
      recorded_on: date.toISOString().slice(0, 10),
      risk_score: Math.min(0.98, Math.max(0.05, Number((loc.risk_score - 0.18 + d * 0.03).toFixed(2)))),
      rainfall: Number((loc.rainfall_24h * (0.55 + d * 0.075)).toFixed(1)),
    };
  }),
);

export const DEMO_SOURCES: DataSourceRow[] = [
  { id: "s1", name: "Weather Data", provider: "India Meteorological Department", category: "weather", status: "connected", latency_ms: 110, refresh_interval: "15 min", last_sync: hoursAgo(0.1), description: "Temperature, humidity, wind and forecast feeds for NE India." },
  { id: "s2", name: "Rainfall Radar", provider: "IMD Doppler Radar (Guwahati)", category: "rainfall", status: "connected", latency_ms: 180, refresh_interval: "10 min", last_sync: hoursAgo(0.15), description: "Real-time rainfall intensity and accumulation grids." },
  { id: "s3", name: "Soil Moisture Sensors", provider: "State IoT Sensor Grid", category: "soil", status: "connected", latency_ms: 95, refresh_interval: "5 min", last_sync: hoursAgo(0.05), description: "142 in-situ sensors across Assam hill districts." },
  { id: "s4", name: "Satellite Feeds", provider: "ISRO Bhuvan / Sentinel-2", category: "satellite", status: "degraded", latency_ms: 640, refresh_interval: "6 hours", last_sync: hoursAgo(5), description: "Optical imagery for slope and land cover change detection." },
  { id: "s5", name: "Terrain DEM", provider: "Cartosat-1 DEM 30m", category: "terrain", status: "connected", latency_ms: 70, refresh_interval: "Static", last_sync: hoursAgo(20), description: "Elevation, slope and aspect derivatives." },
  { id: "s6", name: "Historical Data", provider: "GSI Landslide Inventory", category: "historical", status: "connected", latency_ms: 60, refresh_interval: "Monthly", last_sync: hoursAgo(72), description: "Historical landslide occurrence records since 1998." },
];
