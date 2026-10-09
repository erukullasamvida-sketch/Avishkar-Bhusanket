import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Mountain, Triangle } from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { getHistoricalEvents } from "@/lib/api/historical-events";
import { getRiskZone } from "@/lib/api/risk";
import { useLocationSelection } from "@/hooks/use-location-selection";
import { useProfile } from "@/hooks/use-profile";
import { riskLabel, type RiskLevel } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/risk/$id")({
  head: () => ({
    meta: [
      { title: "Risk Area Details — BHUSANKET" },
      { name: "description", content: "Detailed landslide risk analysis for a monitored area." },
    ],
  }),
  component: RiskDetails,
});

function toRiskLevel(value: string): RiskLevel {
  const normalized = value.toLowerCase();
  if (normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }
  return "low";
}

function RiskDetails() {
  const { id } = Route.useParams();
  const { selectedLocationId } = useLocationSelection();
  const { data: profile } = useProfile();
  const locationId = selectedLocationId ?? Number(id);
  const { data, isLoading, error } = useQuery({
    queryKey: ["risk", locationId],
    queryFn: () => getRiskZone(locationId),
    enabled: Number.isInteger(locationId) && locationId > 0,
  });
  const {
    data: historicalEvents,
    isLoading: historicalEventsLoading,
    error: historicalEventsError,
  } = useQuery({
    queryKey: ["historical-events", locationId],
    queryFn: () => getHistoricalEvents(locationId),
    enabled: Number.isInteger(locationId) && locationId > 0,
  });

  if (isLoading) {
    return <AppShell title="Risk area" user={profile ? { name: profile.name, role: profile.roleLabel } : null}><SectionCard><p className="py-6 text-center text-sm text-muted-foreground">Loading risk data...</p></SectionCard></AppShell>;
  }

  if (error || !data) {
    return <AppShell title="Risk area" user={profile ? { name: profile.name, role: profile.roleLabel } : null}><SectionCard><p className="text-sm text-muted-foreground">This area is not available. <Link to="/risk-map" className="font-semibold text-primary hover:underline">Back to risk map</Link></p></SectionCard></AppShell>;
  }

  const record = data.risk_record;
  const score = record ? record.probability : null;
  const level = record ? toRiskLevel(record.risk_level) : null;

  return (
    <AppShell title={data.location.name} subtitle={`${data.location.district} · ${data.location.latitude.toFixed(4)}°N, ${data.location.longitude.toFixed(4)}°E`} user={profile ? { name: profile.name, role: profile.roleLabel } : null}>
      <div className="grid gap-4 lg:grid-cols-[300px_minmax(0,1fr)]">
        <SectionCard title="Model Probability">
          <div className="flex flex-col items-center gap-3">
            {score === null ? <p className="py-8 text-center text-sm text-muted-foreground">No prediction available. Run a prediction first.</p> : <><p className="text-5xl font-bold text-foreground">{(score * 100).toFixed(1)}%</p><RiskBadge level={level ?? undefined} score={score} showScore /></>}
            <p className="text-center text-xs text-muted-foreground">Location ID {data.location.id} · Predicted-class probability from the Random Forest · Real backend data</p>
          </div>
        </SectionCard>

        <SectionCard title="Recorded Risk Factors">
          {record ? <div className="grid gap-3 sm:grid-cols-2">
            <Factor icon={<Triangle className="h-4 w-4" />} label="Rainfall (24h)" value={`${record.rainfall_24h} mm`} />
            <Factor icon={<Mountain className="h-4 w-4" />} label="Soil Moisture (model input)" value={`${record.soil_moisture.toFixed(1)}%`} />
            <Factor icon={<Triangle className="h-4 w-4" />} label="Slope" value={`${record.slope}°`} />
            <Factor icon={<Mountain className="h-4 w-4" />} label="Elevation" value={`${record.elevation} m`} />
            <Factor icon={<Mountain className="h-4 w-4" />} label="NDVI" value={record.ndvi.toFixed(2)} />
            <Factor icon={<Triangle className="h-4 w-4" />} label="Historical events" value={String(record.historical_events)} />
          </div> : <p className="py-6 text-center text-sm text-muted-foreground">No RiskRecord exists for this location yet.</p>}
        </SectionCard>
      </div>

      <SectionCard title="Historical Landslide Events">
        {historicalEventsLoading ? (
          <p className="py-4 text-sm text-muted-foreground">
            Loading historical events...
          </p>
        ) : historicalEventsError ? (
          <p className="py-4 text-sm text-destructive">
            Historical event records could not be loaded. Please try again.
          </p>
        ) : historicalEvents?.events.length ? (
          <ul className="divide-y divide-border">
            {historicalEvents.events.map((event) => (
              <li key={event.event_id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h3 className="font-semibold text-foreground">
                    {event.location_name}, {event.district}
                  </h3>
                  <time
                    className="text-sm text-muted-foreground"
                    dateTime={event.event_date}
                  >
                    {new Date(`${event.event_date}T00:00:00`).toLocaleDateString()}
                  </time>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {event.description}
                </p>
                {event.reported_impact && (
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">Reported impact:</span>{" "}
                    {event.reported_impact}
                  </p>
                )}
                <a
                  className="mt-2 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
                  href={event.source_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  Source: {event.source_name}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            No verified historical landslide records are currently available
            for this location.
          </p>
        )}
      </SectionCard>

      {level && <p className="mt-4 text-sm text-muted-foreground">Current model risk: {riskLabel[level]}. Risk records are generated by the existing prediction flow.</p>}
    </AppShell>
  );
}

function Factor({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return <div className="flex items-center gap-3 rounded-md border border-border p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">{icon}</div><div><p className="text-xs text-muted-foreground">{label}</p><p className="text-lg font-semibold text-foreground">{value}</p></div></div>;
}
