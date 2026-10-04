import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CloudRain, Layers, MapPin, ShieldAlert } from "lucide-react";

import { AppShell, EmptyRow, KpiCard, SectionCard } from "@/components/app-shell";
import { MapPanel } from "@/components/map/map-panel";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { getAlerts } from "@/lib/api/alerts";
import { getDashboard } from "@/lib/api/dashboard";
import { getLocations } from "@/lib/api/locations";
import { getRiskZone } from "@/lib/api/risk";
import { useProfile } from "@/hooks/use-profile";
import { riskLevelFromBackend, timeAgo } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — BHUSANKET" },
      {
        name: "description",
        content:
          "Live landslide risk overview for the North Eastern Region: monitored areas, high risk zones, rainfall and recent alerts.",
      },
      { property: "og:title", content: "Dashboard — BHUSANKET" },
      {
        property: "og:description",
        content: "Live landslide risk overview for Assam and the North Eastern Region of India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: profile } = useProfile();
  const { data: dashboardData } = useQuery({
    queryKey: ["dashboard-live"],
    queryFn: () => getDashboard(),
  });
  const { data: riskLocations = [] } = useQuery({
    queryKey: ["dashboard-risk-locations"],
    queryFn: async () => {
      const locations = await getLocations();
      const entries = await Promise.all(
        locations.map(async (location) => {
          const risk = await getRiskZone(location.id);
          return {
            ...location,
            probability: risk.risk_record?.probability ?? null,
            risk_level: risk.risk_record?.risk_level ?? "Data unavailable",
            rainfall_24h: risk.risk_record?.rainfall_24h ?? 0,
          };
        }),
      );
      return entries;
    },
  });
  const { data: alerts = [] } = useQuery({
    queryKey: ["dashboard-alerts-live"],
    queryFn: () => getAlerts(),
  });

  const monitoredLocations = dashboardData?.monitored_locations ?? riskLocations.length;
  const highRisk = riskLocations.filter((l) => riskLevelFromBackend(l.risk_level ?? "Low") === "high").length;
  const critical = riskLocations.filter((l) => riskLevelFromBackend(l.risk_level ?? "Low") === "critical").length;
  const rainfall = Math.round(
    riskLocations.reduce((sum, l) => sum + l.rainfall_24h, 0) / Math.max(1, riskLocations.length),
  );
  const priority = [...riskLocations]
    .sort((a, b) => (b.probability ?? -1) - (a.probability ?? -1))
    .slice(0, 5);
  const recent = alerts.slice(0, 4);

  return (
    <AppShell
      title={`Welcome, ${profile?.name ?? "Officer"}`}
      subtitle="Here is the current landslide risk situation in the North Eastern Region"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total Monitored Areas" value={monitoredLocations} icon={Layers} />
        <KpiCard label="High Risk Areas" value={highRisk} icon={AlertTriangle} tone="high" />
        <KpiCard label="Critical Areas" value={critical} icon={ShieldAlert} tone="critical" />
        <KpiCard label="Recent Rainfall" value={rainfall} unit="mm" icon={CloudRain} tone="info" />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_minmax(0,1fr)]">
        <SectionCard
          title="Regional Risk Map"
          description="Live risk zones across Assam and neighbouring states"
          actions={
            <Button asChild size="sm" variant="outline">
              <Link to="/risk-map">Open full map</Link>
            </Button>
          }
        >
          <MapPanel locations={riskLocations} height={380} compact />
          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[
              ["Low", "bg-risk-low"],
              ["Moderate", "bg-risk-moderate"],
              ["High", "bg-risk-high"],
              ["Critical", "bg-risk-critical"],
            ].map(([label, color]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className={`h-2.5 w-2.5 rounded-full ${color}`} /> {label}
              </span>
            ))}
          </div>
        </SectionCard>

        <SectionCard
          title="Recent Alerts"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link to="/alerts">View all →</Link>
            </Button>
          }
        >
          {recent.length === 0 ? (
            <EmptyRow>No active alerts.</EmptyRow>
          ) : (
            <ul className="space-y-3">
              {recent.map((alert) => (
                <li key={alert.id} className="rounded-md border border-border p-3">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                    <p className="min-w-0 text-sm font-semibold text-foreground">{alert.title}</p>
                    <RiskBadge
                      level={alert.severity === "CRITICAL" ? "critical" : "high"}
                    />
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{alert.message}</p>
                  <p className="mt-2 text-[11px] text-muted-foreground">{timeAgo(alert.created_at)}</p>
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Priority Risk Areas" description="Highest model probabilities right now">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">Location</th>
                <th className="pb-2 pr-3 font-medium">District</th>
                <th className="pb-2 pr-3 font-medium">Rainfall (24h)</th>
                <th className="pb-2 pr-3 font-medium">Model Probability</th>
                <th className="pb-2 pr-3 font-medium">Risk Level</th>
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {priority.map((loc) => (
                <tr key={loc.id} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 pr-3 font-medium text-foreground">
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                      {loc.name}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{loc.district}</td>
                  <td className="py-2.5 pr-3 text-muted-foreground">{loc.rainfall_24h} mm</td>
                  <td className="py-2.5 pr-3 font-semibold text-foreground">
                    {loc.probability === null
                      ? "Unavailable"
                      : `${(loc.probability * 100).toFixed(1)}%`}
                  </td>
                  <td className="py-2.5 pr-3">
                    {loc.probability === null ? (
                      <RiskBadge />
                    ) : (
                      <RiskBadge
                        level={riskLevelFromBackend(loc.risk_level)}
                        score={loc.probability}
                      />
                    )}
                  </td>
                  <td className="py-2.5 text-right">
                    <Link
                      to="/risk/$id"
                      params={{ id: loc.id }}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View Details →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
