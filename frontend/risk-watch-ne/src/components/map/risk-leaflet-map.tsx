import "leaflet/dist/leaflet.css";

import { CircleMarker, MapContainer, Polyline, Popup, TileLayer, Tooltip } from "react-leaflet";
import { Link } from "@tanstack/react-router";

import type { RiskLocation } from "@/lib/api/risk";
import { riskHex, riskLabel, riskLevel, riskLevelFromBackend, type RiskLevel } from "@/lib/risk";

export type MapLayers = {
  riskZones: boolean;
  rainfall: boolean;
  soilMoisture: boolean;
  slope: boolean;
  historical: boolean;
  roads: boolean;
};

const ROADS: [number, number][][] = [
  [
    [26.985, 94.64],
    [26.0, 93.5],
    [25.84, 93.43],
    [25.6, 93.17],
    [25.3, 93.13],
    [25.165, 93.017],
  ],
  [
    [25.165, 93.017],
    [25.09, 92.98],
    [24.83, 92.78],
  ],
];

export default function RiskLeafletMap({
  locations,
  layers,
  height = 420,
  compact = false,
  demoActive = false,
  selectedLocationId = null,
  demoLevel = null,
  demoAlertTriggered = false,
}: {
  locations: RiskLocation[];
  layers?: Partial<MapLayers> | undefined;
  height?: number;
  compact?: boolean;
  demoActive?: boolean;
  selectedLocationId?: number | null;
  demoLevel?: RiskLevel | null;
  demoAlertTriggered?: boolean;
}) {

  const demoProbabilityByLevel: Record<Exclude<RiskLevel, "low"> | "low", number> = {
    low: 0.24,
    moderate: 0.45,
    high: 0.68,
    critical: 0.94,
  };

  const l: MapLayers = {
    riskZones: true,
    rainfall: false,
    soilMoisture: false,
    slope: false,
    historical: false,
    roads: true,
    ...layers,
  };

  return (
    <MapContainer
      center={[25.6, 93.1]}
      zoom={compact ? 7 : 8}
      scrollWheelZoom={!compact}
      style={{ height, width: "100%", borderRadius: "0.5rem", zIndex: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {l.roads &&
        ROADS.map((path, i) => (
          <Polyline key={i} positions={path} pathOptions={{ color: "#334155", weight: 2, dashArray: "6 6" }} />
        ))}

      {locations.map((loc) => {
        const probability = loc.probability;
        const hasRiskData = probability !== null && Number.isFinite(probability);
        const baseLevel = hasRiskData ? (loc.risk_level ? riskLevelFromBackend(loc.risk_level) : riskLevel(probability)) : null;
        const baseColor = baseLevel ? riskHex[baseLevel] : "#64748b";
        const isDemoSelected = demoActive && loc.id === selectedLocationId;
        const effectiveLevel = isDemoSelected ? (demoAlertTriggered ? "critical" : demoLevel ?? "moderate") : baseLevel;
        const effectiveProbability = isDemoSelected ? demoProbabilityByLevel[effectiveLevel ?? "moderate"] : probability;
        const markerColor = effectiveLevel ? riskHex[effectiveLevel] : "#64748b";

        return (
          <div key={loc.id}>
            {l.riskZones && (
              <CircleMarker
                center={[loc.latitude, loc.longitude]}
                radius={hasRiskData ? 12 + (probability ?? 0) * 22 : 8}
                pathOptions={{ color: baseColor, fillColor: baseColor, fillOpacity: 0.18, weight: 0 }}
              />
            )}
            {l.rainfall && (
              <CircleMarker
                center={[loc.latitude, loc.longitude]}
                radius={6}
                pathOptions={{ color: "#2563EB", fillColor: "#2563EB", fillOpacity: 0.12, weight: 1 }}
              />
            )}
            {l.soilMoisture && (
              <CircleMarker
                center={[loc.latitude, loc.longitude]}
                radius={4}
                pathOptions={{ color: "#0891B2", fillColor: "#0891B2", fillOpacity: 0.12, weight: 1 }}
              />
            )}
            {l.slope && (
              <CircleMarker
                center={[loc.latitude, loc.longitude]}
                radius={3 + loc.slope / 5}
                pathOptions={{ color: "#7C3AED", fillColor: "#7C3AED", fillOpacity: 0.1, weight: 1 }}
              />
            )}
            {l.historical && probability !== null && probability > 0.55 && (
              <CircleMarker
                center={[loc.latitude + 0.05, loc.longitude + 0.05]}
                radius={5}
                pathOptions={{ color: "#78350F", fillColor: "#78350F", fillOpacity: 0.6, weight: 1 }}
              />
            )}
            <CircleMarker
              center={[loc.latitude, loc.longitude]}
              radius={effectiveLevel ? 7 : 6}
              pathOptions={{ color: "#ffffff", fillColor: markerColor, fillOpacity: 1, weight: 2 }}
            >
              <Tooltip direction="top">{loc.name}</Tooltip>
              <Popup>
                <div style={{ minWidth: 190 }}>
                  <p style={{ fontWeight: 700, margin: 0 }}>{loc.name}</p>
                  <p style={{ margin: "2px 0 6px", color: markerColor, fontWeight: 600 }}>
                    {effectiveLevel
                      ? `Risk Level: ${riskLabel[effectiveLevel]} · Model Probability: ${((effectiveProbability ?? 0) * 100).toFixed(1)}%`
                      : "Risk Level: Data unavailable · Awaiting observation"}
                  </p>
                  <p style={{ margin: 0, fontSize: 12 }}>Slope: {loc.slope}°</p>
                  <Link
                    to="/risk/$id"
                    params={{ id: String(loc.id) }}
                    style={{ display: "inline-block", marginTop: 8, fontWeight: 600, color: "#15803D" }}
                  >
                    View Details →
                  </Link>
                </div>
              </Popup>
            </CircleMarker>
          </div>
        );
      })}
    </MapContainer>
  );
}
