import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { Info } from "lucide-react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { getLocations } from "@/lib/api/locations";
import { getRiskZone } from "@/lib/api/risk";
import { useProfile } from "@/hooks/use-profile";
import { formatDateTime, riskHex, riskLevelFromBackend } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Reports & Analytics — BHUSANKET" },
      {
        name: "description",
        content:
          "Risk distribution, rainfall trends and top high-risk areas across the North Eastern Region of India.",
      },
      { property: "og:title", content: "Reports & Analytics — BHUSANKET" },
      {
        property: "og:description",
        content: "Landslide risk analytics and trends for NE India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { data: profile } = useProfile();
  const { data: locations = [] } = useQuery({
    queryKey: ["analytics-live-locations"],
    queryFn: async () => {
      const backendLocations = await getLocations();
      const liveLocations = await Promise.all(
        backendLocations.map(async (location) => {
          const risk = await getRiskZone(location.id);
          return {
            ...location,
            risk_score: risk.risk_record?.risk_score ?? 0,
            risk_level: risk.risk_record?.risk_level ?? "Low",
            updated_at: risk.risk_record?.created_at,
          };
        }),
      );
      return liveLocations;
    },
  });

  const distribution = (["low", "moderate", "high", "critical"] as const).map((level) => ({
    name: level[0]!.toUpperCase() + level.slice(1),
    value: locations.filter((l) => riskLevelFromBackend(l.risk_level) === level).length,
    color: riskHex[level],
  }));

  const top5 = [...locations].sort((a, b) => b.risk_score - a.risk_score).slice(0, 5);
  return (
    <AppShell
      title="Reports & Analytics"
      subtitle="Risk distribution, rainfall patterns and regional trends"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          Live risk levels and model probabilities below are derived from the latest SQLite-backed risk records. Historical trend data is not available in the current prototype.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_1.4fr]">
        <SectionCard title="Risk Distribution" description={`${locations.length} monitored areas`}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={58} outerRadius={90} paddingAngle={2}>
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Rainfall Trend" description="Historical data unavailable">
          <p className="py-12 text-center text-sm text-muted-foreground">
            Historical trend data is not available in the current prototype.
          </p>
        </SectionCard>
      </div>

      <SectionCard className="mt-4" title="Risk Trend (Overall)" description="Live risk snapshot only">
        <p className="py-8 text-center text-sm text-muted-foreground">
          Historical trend data is not available in the current prototype.
        </p>
      </SectionCard>

      <SectionCard className="mt-4" title="Top 5 High Risk Areas">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Location</th>
                <th className="pb-2 pr-3 font-medium">Risk Level</th>
                <th className="pb-2 pr-3 font-medium">Model Probability</th>
                <th className="pb-2 pr-3 font-medium">Trend</th>
                <th className="pb-2 font-medium">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {top5.map((loc, i) => {
                const rising = loc.risk_score >= 0.5;
                return (
                  <tr key={loc.id} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 pr-3 text-muted-foreground">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-medium text-foreground">
                      <Link to="/risk/$id" params={{ id: loc.id }} className="hover:underline">
                        {loc.name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3">
                      <RiskBadge
                        level={riskLevelFromBackend(loc.risk_level)}
                        score={loc.risk_score / 100}
                      />
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-foreground">
                      {loc.risk_score.toFixed(1)}%
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className="text-xs text-muted-foreground">Unavailable</span>
                    </td>
                    <td className="py-2.5 text-xs text-muted-foreground">
                      {loc.updated_at ? formatDateTime(loc.updated_at) : "No recent update"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </AppShell>
  );
}
