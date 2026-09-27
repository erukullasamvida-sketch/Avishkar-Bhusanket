import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { MapPanel } from "@/components/map/map-panel";
import { RiskBadge } from "@/components/risk-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useDemoMode } from "@/hooks/use-demo-mode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { locationsQuery } from "@/lib/api";
import { getLocations } from "@/lib/api/locations";
import { getRiskZone } from "@/lib/api/risk";
import { useLocationSelection } from "@/hooks/use-location-selection";
import { useProfile } from "@/hooks/use-profile";
import { riskLevelFromBackend } from "@/lib/risk";
import type { MapLayers } from "@/components/map/risk-leaflet-map";

export const Route = createFileRoute("/_authenticated/risk-map")({
  head: () => ({
    meta: [
      { title: "Interactive Risk Map — BHUSANKET" },
      {
        name: "description",
        content:
          "GIS map of landslide risk zones across the North Eastern Region with rainfall, soil moisture, slope and historical landslide layers.",
      },
      { property: "og:title", content: "Interactive Risk Map — BHUSANKET" },
      {
        property: "og:description",
        content: "Explore landslide risk zones and terrain layers across NE India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RiskMapPage,
});

const LAYER_LABELS: [keyof MapLayers, string][] = [
  ["riskZones", "Risk Zones"],
  ["rainfall", "Rainfall"],
  ["soilMoisture", "Soil Moisture"],
  ["slope", "Slope"],
  ["historical", "Historical Landslides"],
  ["roads", "Roads"],
];

function RiskMapPage() {
  const { data: profile } = useProfile();
  const { selectedLocationId } = useLocationSelection();
  const { demoActive, demoLevel, demoAlertTriggered } = useDemoMode();
  const { data: backendLocations = [] } = useQuery({
    queryKey: ["risk_backend_locations"],
    queryFn: () => getLocations(),
  });
  const { data: locations = [] } = useQuery({
    queryKey: ["risk_map_locations"],
    queryFn: async () => {
      const locations = await getLocations();
      const liveLocations = await Promise.all(
        locations.map(async (location) => {
          const risk = await getRiskZone(location.id);
          const hasRiskRecord = Boolean(risk.risk_record);
          return {
            ...location,
            risk_score: hasRiskRecord ? risk.risk_record!.probability : null,
            risk_level: hasRiskRecord ? risk.risk_record!.risk_level : "Data unavailable",
            district: location.district,
            state: location.district,
          };
        }),
      );
      return liveLocations as Array<{
        id: number;
        name: string;
        district: string;
        state: string;
        latitude: number;
        longitude: number;
        elevation: number;
        slope: number;
        ndvi: number;
        historical_events: number;
        monitored: boolean;
        risk_score: number | null;
        risk_level: string;
      }>;
    },
  });

  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("all");
  const [level, setLevel] = useState("all");
  const [layers, setLayers] = useState<MapLayers>({
    riskZones: true,
    rainfall: false,
    soilMoisture: false,
    slope: false,
    historical: false,
    roads: true,
  });

  const districts = useMemo(
    () => Array.from(new Set(backendLocations.map((l) => l.district))).sort(),
    [backendLocations],
  );

  const demoRiskScoreByLevel = {
    low: 24,
    moderate: 45,
    high: 68,
    critical: 94,
  } as const;

  const selectedDemoLevel =
    demoActive && selectedLocationId !== null
      ? (demoAlertTriggered ? "critical" : demoLevel ?? "moderate")
      : null;

  const displayLocations = useMemo(() => {
    if (selectedDemoLevel === null) return locations;

    return locations.map((location) => {
      if (location.id !== selectedLocationId) {
        return location;
      }

      return {
        ...location,
        risk_level: selectedDemoLevel,
        risk_score: demoRiskScoreByLevel[selectedDemoLevel],
      };
    });
  }, [demoRiskScoreByLevel, locations, selectedDemoLevel, selectedLocationId]);

  const filtered = displayLocations.filter((l) => {
    const matchesSearch = !search || l.name.toLowerCase().includes(search.toLowerCase());
    const matchesDistrict = district === "all" || l.district === district;
    const hasRiskData = l.risk_score !== null && l.risk_score !== undefined;
    const matchesLevel =
      level === "all" || (hasRiskData && riskLevelFromBackend(l.risk_level) === level);
    return matchesSearch && matchesDistrict && matchesLevel;
  });

  return (
    <AppShell
      title="Interactive Risk Map"
      subtitle="Landslide risk zones, terrain and weather layers across the North Eastern Region"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4">
          <SectionCard title="Filters">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search location..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <Select value={district} onValueChange={setDistrict}>
                <SelectTrigger>
                  <SelectValue placeholder="District" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All districts</SelectItem>
                  {districts.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Risk level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All risk levels</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </SectionCard>

          <SectionCard title={`${filtered.length} locations shown`}>
            {filtered.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No live locations match the current filters.</p>
            ) : (
              <MapPanel
                locations={filtered}
                layers={layers}
                height={520}
                demoActive={demoActive}
                selectedLocationId={selectedLocationId}
                demoLevel={demoLevel}
                demoAlertTriggered={demoAlertTriggered}
              />
            )}
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="Map Layers">
            <div className="space-y-3">
              {LAYER_LABELS.map(([key, label]) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <Label htmlFor={key} className="text-sm font-normal">
                    {label}
                  </Label>
                  <Switch
                    id={key}
                    checked={layers[key]}
                    onCheckedChange={(checked) => setLayers((p) => ({ ...p, [key]: checked }))}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Risk Level Legend">
            <ul className="space-y-2 text-sm">
              {[
                ["Low", "0.00 – 0.30", "bg-risk-low"],
                ["Moderate", "0.31 – 0.55", "bg-risk-moderate"],
                ["High", "0.56 – 0.75", "bg-risk-high"],
                ["Critical", "0.76 – 1.00", "bg-risk-critical"],
              ].map(([label, range, color]) => (
                <li key={label} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
                  </span>
                  <span className="text-xs text-muted-foreground">{range}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Locations">
            <ul className="max-h-80 space-y-2 overflow-y-auto">
              {filtered.map((loc) => {
                const hasRiskData = loc.risk_score !== null && loc.risk_score !== undefined;
                const effectiveRiskLevel =
                  demoActive && selectedLocationId === loc.id
                    ? (demoAlertTriggered ? "critical" : demoLevel ?? "moderate")
                    : hasRiskData
                      ? riskLevelFromBackend(loc.risk_level)
                      : undefined;
                const effectiveRiskScore =
                  demoActive && selectedLocationId === loc.id
                    ? demoRiskScoreByLevel[effectiveRiskLevel ?? "moderate"]
                    : hasRiskData
                      ? loc.risk_score
                      : undefined;

                return (
                  <li key={loc.id}>
                    <Link
                      to="/risk/$id"
                      params={{ id: String(loc.id) }}
                      className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-md border border-border p-2.5 hover:bg-muted"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-foreground">
                          {loc.name}
                        </span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {loc.district}, {loc.state}
                        </span>
                      </span>
                      <RiskBadge
                        level={effectiveRiskLevel}
                        score={effectiveRiskScore !== undefined ? effectiveRiskScore / 100 : undefined}
                        showScore={Boolean(effectiveRiskLevel)}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </SectionCard>
        </div>
      </div>
    </AppShell>
  );
}
