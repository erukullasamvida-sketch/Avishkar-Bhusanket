import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge, StatusPill } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { useLocationSelection } from "@/hooks/use-location-selection";
import { useProfile } from "@/hooks/use-profile";
import {
  acknowledgeAlert,
  getAlerts,
  resolveAlert,
  type Alert,
} from "@/lib/api/alerts";
import { getRiskTimeline, type RiskTimeline } from "@/lib/api/risk";
import { formatDateTime, timeAgo, type RiskLevel } from "@/lib/risk";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/alerts")({
  head: () => ({
    meta: [
      { title: "Alerts & Early Warning — BHUSANKET" },
      {
        name: "description",
        content: "Review saved landslide risk predictions and manage early warning alerts.",
      },
      { property: "og:title", content: "Alerts & Early Warning — BHUSANKET" },
      {
        property: "og:description",
        content: "Review and respond to landslide risk alerts across NE India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AlertsPage,
});

const FILTERS = ["all", "CRITICAL", "HIGH", "ACTIVE", "ACKNOWLEDGED", "RESOLVED"] as const;
type AlertFilter = (typeof FILTERS)[number];

function toRiskLevel(value: string): RiskLevel | null {
  const normalized = value.toLowerCase();
  if (
    normalized === "low" ||
    normalized === "moderate" ||
    normalized === "high" ||
    normalized === "critical"
  ) {
    return normalized;
  }
  return null;
}

function getTrend(events: RiskTimeline["events"]): string {
  if (events.length < 2) return "Insufficient history";

  const previous = events[events.length - 2];
  const current = events[events.length - 1];
  const previousLevel = toRiskLevel(previous.risk_level);
  const currentLevel = toRiskLevel(current.risk_level);
  if (previousLevel === null || currentLevel === null) return "Trend unavailable";

  const levels: RiskLevel[] = ["low", "moderate", "high", "critical"];
  const difference = levels.indexOf(currentLevel) - levels.indexOf(previousLevel);
  if (difference > 0) return "Rising";
  if (difference < 0) return "Falling";
  if (current.risk_score > previous.risk_score) return "Rising";
  if (current.risk_score < previous.risk_score) return "Falling";
  return "Stable";
}

function getEscalationState(events: RiskTimeline["events"]): string {
  if (events.length < 2) return "Insufficient prediction history";

  const previous = toRiskLevel(events[events.length - 2].risk_level);
  const current = toRiskLevel(events[events.length - 1].risk_level);
  if (previous === null || current === null) return "Escalation state unavailable";

  const levels: RiskLevel[] = ["low", "moderate", "high", "critical"];
  return levels.indexOf(current) > levels.indexOf(previous)
    ? "Escalated from previous prediction"
    : "No increase from previous prediction";
}

function filterAlerts(alerts: Alert[], filter: AlertFilter): Alert[] {
  if (filter === "all") return alerts;
  if (filter === "HIGH" || filter === "CRITICAL") {
    return alerts.filter((alert) => alert.severity === filter);
  }
  return alerts.filter((alert) => alert.status === filter);
}

function AlertsPage() {
  const { data: profile } = useProfile();
  const { selectedLocationId } = useLocationSelection();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<AlertFilter>("all");

  const {
    data: alerts = [],
    isLoading: alertsLoading,
    error: alertsError,
  } = useQuery({
    queryKey: ["backend_alerts", selectedLocationId],
    queryFn: () => getAlerts(selectedLocationId ?? undefined),
    enabled: selectedLocationId !== null,
  });
  const {
    data: timeline,
    isLoading: timelineLoading,
    error: timelineError,
  } = useQuery({
    queryKey: ["risk_timeline", selectedLocationId],
    queryFn: () => {
      if (selectedLocationId === null) {
        throw new Error("Select a location before loading its prediction history.");
      }
      return getRiskTimeline(selectedLocationId);
    },
    enabled: selectedLocationId !== null,
  });

  const alertAction = useMutation({
    mutationFn: ({
      alertId,
      action,
    }: {
      alertId: number;
      action: "acknowledge" | "resolve";
    }) => (action === "acknowledge" ? acknowledgeAlert(alertId) : resolveAlert(alertId)),
    onSuccess: async (_alert, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["backend_alerts", selectedLocationId],
      });
      toast.success(
        variables.action === "acknowledge" ? "Alert acknowledged" : "Alert resolved",
      );
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Unable to update alert.");
    },
  });

  const currentEvent =
    timeline && timeline.events.length > 0
      ? timeline.events[timeline.events.length - 1]
      : null;
  const currentLevel = currentEvent ? toRiskLevel(currentEvent.risk_level) : null;
  const trend = timeline ? getTrend(timeline.events) : "Unavailable";
  const activeAlerts = alerts.filter((alert) => alert.status === "ACTIVE");
  const acknowledgedAlerts = alerts.filter((alert) => alert.status === "ACKNOWLEDGED");
  const resolvedAlerts = alerts.filter((alert) => alert.status === "RESOLVED");
  const currentWarningAlert =
    currentEvent && currentLevel && ["high", "critical"].includes(currentLevel)
      ? alerts.find(
          (alert) =>
            alert.status !== "RESOLVED" &&
            alert.severity === currentLevel.toUpperCase(),
        )
      : undefined;
  const filteredAlerts = filterAlerts(alerts, filter);

  return (
    <AppShell
      title="Alerts & Early Warning"
      subtitle="Operational view of saved risk predictions and alert response"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      {selectedLocationId === null ? (
        <SectionCard>
          <p className="py-6 text-center text-sm text-muted-foreground">
            Select a location to view its alerts and risk timeline.
          </p>
        </SectionCard>
      ) : (
        <div className="space-y-5">
          <SectionCard
            title="Early Warning Manager"
            description={timeline?.location_name ?? "Current risk from persisted predictions"}
          >
            {timelineLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading risk history...</p>
            ) : timelineError ? (
              <p className="p-4 text-sm text-destructive">
                Unable to load risk history: {timelineError.message}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-px bg-border md:grid-cols-5">
                  <ManagerMetric
                    label="Current Risk"
                    value={currentLevel ? currentLevel.toUpperCase() : "No saved prediction"}
                  />
                  <ManagerMetric
                    label="Risk Trend"
                    value={
                      trend === "Rising" ? (
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          {trend}
                        </span>
                      ) : trend === "Falling" ? (
                        <span className="inline-flex items-center gap-1">
                          <TrendingDown className="h-4 w-4" />
                          {trend}
                        </span>
                      ) : (
                        trend
                      )
                    }
                  />
                  <ManagerMetric label="Active Alerts" value={activeAlerts.length} />
                  <ManagerMetric label="Acknowledged Alerts" value={acknowledgedAlerts.length} />
                  <ManagerMetric label="Resolved Alerts" value={resolvedAlerts.length} />
                </div>
                {timeline && timeline.events.length < 2 && (
                  <p className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                    Insufficient prediction history.
                  </p>
                )}
                {currentEvent && currentLevel && (
                  <div className="border-t border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">Current saved risk</span>
                      <RiskBadge level={currentLevel} />
                      <span className="text-xs text-muted-foreground">
                        {formatDateTime(currentEvent.created_at)}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-foreground">
                      <span className="font-medium">Response recommendation:</span>{" "}
                      {currentEvent.response_recommendation}
                    </p>
                    {["high", "critical"].includes(currentLevel) && (
                      <div className="mt-3 rounded-md border border-risk-high/30 bg-risk-high-soft p-3 text-sm">
                        <p className="font-semibold text-foreground">
                          {currentLevel === "critical" ? "Critical risk warning" : "High risk warning"}
                        </p>
                        <p className="mt-1 text-foreground">
                          Review field conditions and follow authorized response procedures.
                          Recommendations do not authorize evacuation.
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Alert status: {currentWarningAlert?.status ?? "No unresolved matching alert"} ·{" "}
                          Escalation state:{" "}
                          {timeline ? getEscalationState(timeline.events) : "Unavailable"}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </SectionCard>

          <SectionCard
            title="Risk Escalation Timeline"
            description="Only persisted location predictions are shown, in timestamp order."
          >
            {timelineLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading prediction timeline...</p>
            ) : timelineError ? (
              <p className="p-4 text-sm text-destructive">
                Unable to load prediction timeline: {timelineError.message}
              </p>
            ) : !timeline || timeline.events.length < 2 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Insufficient prediction history.
                {timeline?.events.length === 1 && (
                  <span> One saved prediction is listed below.</span>
                )}
              </p>
            ) : null}
            {timeline && timeline.events.length > 0 && (
              <ol className="divide-y divide-border">
                {timeline.events.map((event, index) => {
                  const level = toRiskLevel(event.risk_level);
                  return (
                    <li key={event.id} className="grid gap-3 p-4 md:grid-cols-[1fr_2fr]">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {level ? <RiskBadge level={level} /> : <span>Risk class unavailable</span>}
                          <span className="text-xs text-muted-foreground">
                            Prediction {index + 1}
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {formatDateTime(event.created_at)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Risk score {event.risk_score.toFixed(1)}% · Probability{" "}
                          {(event.probability * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs sm:grid-cols-3">
                          <EnvironmentalValue label="Rainfall (24h)" value={event.rainfall_24h} />
                          <EnvironmentalValue
                            label="Soil moisture (model input %)"
                            value={`${event.soil_moisture.toFixed(1)}%`}
                          />
                          <EnvironmentalValue label="Slope" value={event.slope} />
                          <EnvironmentalValue label="Elevation" value={event.elevation} />
                          <EnvironmentalValue label="NDVI" value={event.ndvi} />
                          <EnvironmentalValue
                            label="Historical events"
                            value={event.historical_events}
                          />
                        </dl>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {event.response_recommendation}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </SectionCard>

          <SectionCard
            title="Alerts"
            description="HIGH and CRITICAL saved predictions generate alerts; no delivery channel is simulated."
          >
            <div className="flex flex-wrap gap-2 border-b border-border p-4">
              {FILTERS.map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={cn(
                    "rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors",
                    filter === item
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:text-foreground",
                  )}
                >
                  {item === "all" ? "All" : item[0] + item.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            {alertsLoading ? (
              <p className="p-4 text-sm text-muted-foreground">Loading alerts...</p>
            ) : alertsError ? (
              <p className="p-4 text-sm text-destructive">
                Unable to load alerts: {alertsError.message}
              </p>
            ) : filteredAlerts.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No alerts match this filter for the selected location.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {filteredAlerts.map((alert) => (
                  <article key={alert.id} className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 p-4">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-risk-critical-soft text-risk-critical">
                      <BellRing className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                        <RiskBadge
                          level={alert.severity === "CRITICAL" ? "critical" : "high"}
                        />
                        <StatusPill status={alert.status.toLowerCase()} />
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{alert.message}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {alert.location_name ?? "Location unavailable"} · {timeAgo(alert.created_at)} (
                        {formatDateTime(alert.created_at)})
                      </p>
                      {alert.risk_score !== null && alert.probability !== null ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Saved risk score {alert.risk_score.toFixed(1)}% · Model probability{" "}
                          {(alert.probability * 100).toFixed(1)}%
                          {alert.risk_timestamp
                            ? ` · Prediction ${formatDateTime(alert.risk_timestamp)}`
                            : ""}
                        </p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Prediction score and timestamp are unavailable for this alert.
                        </p>
                      )}
                      <p className="mt-2 text-sm text-foreground">
                        <span className="font-medium">Response recommendation:</span>{" "}
                        {alert.response_recommendation}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/risk/$id" params={{ id: String(alert.location_id) }}>
                            View Details
                          </Link>
                        </Button>
                        {alert.status === "ACTIVE" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={alertAction.isPending}
                            onClick={() =>
                              alertAction.mutate({
                                alertId: alert.id,
                                action: "acknowledge",
                              })
                            }
                          >
                            Acknowledge
                          </Button>
                        )}
                        {alert.status !== "RESOLVED" && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={alertAction.isPending}
                            onClick={() =>
                              alertAction.mutate({ alertId: alert.id, action: "resolve" })
                            }
                          >
                            Resolve
                          </Button>
                        )}
                        {alert.acknowledged_at && (
                          <span className="self-center text-xs text-muted-foreground">
                            Acknowledged {formatDateTime(alert.acknowledged_at)}
                          </span>
                        )}
                        {alert.resolved_at && (
                          <span className="self-center text-xs text-muted-foreground">
                            Resolved {formatDateTime(alert.resolved_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}

function ManagerMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-card p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

function EnvironmentalValue({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex justify-between gap-2 text-muted-foreground">
      <dt>{label}</dt>
      <dd className="font-medium text-foreground">{value}</dd>
    </div>
  );
}
