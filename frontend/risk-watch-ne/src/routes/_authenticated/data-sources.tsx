import { createFileRoute } from "@tanstack/react-router";
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
import { useProfile } from "@/hooks/use-profile";

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

  return (
    <AppShell
      title="Data Sources"
      subtitle="Current backend environmental source status"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
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
