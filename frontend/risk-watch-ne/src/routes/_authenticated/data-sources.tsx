import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CloudRain,
  Database,
  Droplets,
  History,
  Mountain,
  Satellite,
  Thermometer,
} from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { StatusPill } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { useLocationSelection } from "@/hooks/use-location-selection";
import { useProfile } from "@/hooks/use-profile";
import {
  getEnvironmentalData,
  refreshEnvironmentalData,
  type EnvironmentalObservation,
} from "@/lib/api/environmental";

export const Route = createFileRoute("/_authenticated/data-sources")({
  head: () => ({
    meta: [
      { title: "Data Sources — BHUSANKET" },
      {
        name: "description",
        content:
          "Connection status for weather, rainfall radar, soil moisture sensors, satellite feeds, terrain DEM and historical landslide data.",
      },
      { property: "og:title", content: "Data Sources — BHUSANKET" },
      {
        property: "og:description",
        content: "Monitoring feeds powering landslide risk analysis in NE India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DataSourcesPage,
});

const ICONS: Record<string, typeof Database> = {
  weather: Thermometer,
  rainfall: CloudRain,
  soil: Droplets,
  satellite: Satellite,
  terrain: Mountain,
  historical: History,
};

const SOURCES = [
  {
    id: "weather",
    name: "Weather Data",
    provider: "Open-Meteo",
    category: "weather",
    status: "connected",
    description: "Environmental observations collected by the backend weather service.",
  },
  {
    id: "historical",
    name: "Historical Data",
    provider: "Reference / planned source",
    category: "historical",
    status: "planned",
    description: "No historical landslide feed is connected in the current prototype.",
  },
  {
    id: "rainfall",
    name: "Rainfall Radar",
    provider: "Not connected",
    category: "rainfall",
    status: "not connected",
    description: "No live rainfall radar integration is connected.",
  },
  {
    id: "satellite",
    name: "Satellite Feeds",
    provider: "Not connected",
    category: "satellite",
    status: "not connected",
    description: "No satellite imagery feed is connected.",
  },
  {
    id: "soil",
    name: "Soil Moisture Sensors",
    provider: "Not connected",
    category: "soil",
    status: "not connected",
    description: "Soil moisture values currently come from Open-Meteo observations, not field sensors.",
  },
  {
    id: "terrain",
    name: "Terrain DEM",
    provider: "Reference / planned source",
    category: "terrain",
    status: "planned",
    description: "Terrain values are stored with monitored locations; no live DEM feed is connected.",
  },
];

function DataSourcesPage() {
  const { data: profile } = useProfile();
  const { selectedLocationId, selectedLocation } = useLocationSelection();
  const queryClient = useQueryClient();
  const queryKey = ["environmental_data", selectedLocationId];
  const { data: observations = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: () => getEnvironmentalData(selectedLocationId!),
    enabled: selectedLocationId !== null,
  });
  const refresh = useMutation({
    mutationFn: (locationId: number) => refreshEnvironmentalData(locationId),
    onSuccess: async (_observation, locationId) => {
      await queryClient.invalidateQueries({
        queryKey: ["environmental_data", locationId],
      });
    },
  });
  const latest: EnvironmentalObservation | undefined = observations[0];
  const refreshedAt =
    refresh.data?.location_id === selectedLocationId ? refresh.data.fetched_at : null;

  return (
    <AppShell
      title="Data Sources"
      subtitle="Forecast environmental inputs stored by the backend"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <SectionCard
        title="Environmental Data"
        description="Open-Meteo forecast values stored for the selected backend location."
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedLocation?.name ?? "Select a location"}
            </p>
            <p className="text-xs text-muted-foreground">
              Forecast values are not field sensor observations.
            </p>
          </div>
          <Button
            onClick={() => {
              if (selectedLocationId !== null) refresh.mutate(selectedLocationId);
            }}
            disabled={selectedLocationId === null || refresh.isPending}
          >
            {refresh.isPending ? "Refreshing..." : "Refresh Environmental Data"}
          </Button>
        </div>

        {refresh.isError && (
          <p role="alert" className="mb-3 text-sm text-risk-critical">
            Refresh failed: {refresh.error.message}. Previously stored data is unchanged.
          </p>
        )}
        {error && (
          <p role="alert" className="mb-3 text-sm text-risk-critical">
            Could not load stored environmental data: {error.message}
          </p>
        )}
        {selectedLocationId === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a location from the global location selector.
          </p>
        ) : isLoading ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Loading stored environmental data...
          </p>
        ) : latest ? (
          <>
            <div className="mb-4 flex flex-wrap items-center gap-2 text-xs">
              <StatusPill status="FORECAST" />
              <StatusPill status={latest.data_status} />
              <span className="text-muted-foreground">Source: {latest.source}</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <EnvironmentalValue
                label="Rainfall (24h forecast)"
                value={`${latest.rainfall_24h.toFixed(1)} mm`}
              />
              <EnvironmentalValue
                label="Soil moisture (forecast, %)"
                value={`${(latest.soil_moisture * 100).toFixed(1)}%`}
                detail="Stored fraction converted to percent for display"
              />
              <EnvironmentalValue
                label="Temperature (forecast)"
                value={latest.temperature === null ? "Unavailable" : `${latest.temperature.toFixed(1)} °C`}
              />
              <EnvironmentalValue
                label="Humidity (forecast)"
                value={latest.humidity === null ? "Unavailable" : `${latest.humidity.toFixed(1)}%`}
              />
            </div>
            <div className="mt-4 space-y-1 text-xs text-muted-foreground">
              <p>
                Forecast valid at: {latest.observed_at.replace("T", " ")}{" "}
                {latest.timestamp_timezone ?? ""}
              </p>
              <p>
                Last fetched: {refreshedAt ? new Date(refreshedAt).toLocaleString() : "Fetch time is not stored"}
              </p>
            </div>
          </>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No stored environmental data for this location. Refresh to fetch a forecast.
          </p>
        )}
      </SectionCard>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SOURCES.map((source) => {
          const Icon = ICONS[source.category] ?? Database;
          return (
            <SectionCard key={source.id}>
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{source.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{source.provider}</p>
                </div>
                <StatusPill status={source.status} />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">{source.description}</p>
            </SectionCard>
          );
        })}
      </div>
    </AppShell>
  );
}

function EnvironmentalValue({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
      {detail && <p className="mt-1 text-xs text-muted-foreground">{detail}</p>}
    </div>
  );
}
