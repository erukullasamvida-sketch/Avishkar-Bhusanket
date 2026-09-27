import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Info, Loader2, Play, RotateCcw } from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useLocationSelection } from "@/hooks/use-location-selection";
import { getPrediction } from "@/lib/api/prediction";
import { useProfile } from "@/hooks/use-profile";
import { type RiskLevel } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/prediction")({
  head: () => ({
    meta: [
      { title: "AI Prediction — BHUSANKET" },
      {
        name: "description",
        content: "Run a Random Forest landslide risk prediction for the Sohra monitoring zone.",
      },
      { property: "og:title", content: "AI Prediction — BHUSANKET" },
      {
        property: "og:description",
        content: "Predictive landslide risk analysis for the North Eastern Region of India.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PredictionPage,
});

function toRiskLevel(value: string): RiskLevel {
  const normalized = value.toLowerCase();
  if (normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }
  return "low";
}

function PredictionPage() {
  const { data: profile } = useProfile();
  const { selectedLocationId, selectedLocation } = useLocationSelection();
  const {
    demoActive,
    demoLevel,
    demoAlertTriggered,
    startDemo: startDemoMode,
    stopDemo: stopDemoMode,
    resetDemo: resetDemoMode,
  } = useDemoMode();
  const { data: prediction, isFetching, error, refetch } = useQuery({
    queryKey: ["prediction", selectedLocationId],
    queryFn: () => {
      if (selectedLocationId === null) {
        throw new Error("Select a location before requesting a prediction.");
      }
      return getPrediction(selectedLocationId);
    },
    enabled: false,
  });

  function runAnalysis() {
    if (selectedLocationId === null) return;
    void refetch();
  }

  function startDemo() {
    if (selectedLocationId === null) return;
    startDemoMode(selectedLocation?.name);
  }

  function stopDemo() {
    stopDemoMode();
  }

  function resetDemo() {
    resetDemoMode();
  }

  return (
    <AppShell
      title="AI Prediction & Analytics"
      subtitle="Model-driven landslide risk forecasting for the North Eastern Region"
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-risk-moderate/40 bg-risk-moderate-soft p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-risk-moderate" />
        <p className="text-xs font-medium text-foreground">
          Random Forest predictions support decision-making and do not replace official authority
          assessment.
        </p>
      </div>

      <SectionCard
        title="Demo Mode — For Demonstration Only"
        description="Frontend-only risk progression for presenting the alert workflow"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">
              {selectedLocation ? selectedLocation.name : "Select a location first"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-wide">
              {(["moderate", "high", "critical"] as RiskLevel[]).map((level, index) => (
                <span key={level} className="flex items-center gap-2">
                  <span className={demoLevel === level ? "text-foreground" : "text-muted-foreground"}>{level.toUpperCase()}</span>
                  <RiskBadge level={level} className={demoLevel === level ? "ring-2 ring-primary/30" : "opacity-50"} />
                  {index < 2 && <span className="text-muted-foreground">→</span>}
                </span>
              ))}
              <span className="text-muted-foreground">→</span>
              <span className={demoAlertTriggered ? "text-risk-critical" : "text-muted-foreground"}>
                Alert Triggered
              </span>
            </div>
          </div>
          {demoActive ? (
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={stopDemo}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Stop Demo
              </Button>
              <Button variant="ghost" onClick={resetDemo}>
                Reset
              </Button>
            </div>
          ) : (
            <Button onClick={startDemo} disabled={selectedLocationId === null}>
              <Play className="mr-2 h-4 w-4" />
              Start Demo
            </Button>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Run Risk Prediction">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Backend location</p>
            {selectedLocation ? (
              <>
                <p className="font-medium text-foreground">{selectedLocation.name}</p>
                <p className="text-xs text-muted-foreground">{selectedLocation.district}</p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a location from the global search.
              </p>
            )}
          </div>
          <div className="flex items-end">
            <Button
              className="w-full lg:w-auto"
              onClick={runAnalysis}
              disabled={isFetching || selectedLocationId === null}
            >
              {isFetching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-2 h-4 w-4" />
              )}
              Run Analysis
            </Button>
          </div>
        </div>
      </SectionCard>

      <div className="mt-4">
        <SectionCard title="Prediction Results" description="Random Forest output from FastAPI">
          {isFetching && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Requesting the latest prediction from the backend…
            </p>
          )}
          {!isFetching && error && (
            <p className="py-10 text-center text-sm text-risk-critical">
              Prediction request failed: {error instanceof Error ? error.message : "Unknown error"}
            </p>
          )}
          {!isFetching && !error && !prediction && selectedLocationId === null && (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Select a location from the global search before running an analysis.
            </p>
          )}
          {!isFetching && prediction && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="pb-2 pr-3 font-medium">Location</th>
                    <th className="pb-2 pr-3 font-medium">Risk Level</th>
                    <th className="pb-2 font-medium">Model Probability</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-foreground">
                        {selectedLocation?.name}
                      </td>
                      <td className="py-2.5 pr-3">
                        <RiskBadge level={toRiskLevel(prediction.risk_level)} />
                      </td>
                      <td className="py-2.5 text-foreground">{(prediction.probability * 100).toFixed(1)}%</td>
                    </tr>
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <SectionCard title="Prediction Features" description="Values sent to the Random Forest model">
          {prediction ? (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {Object.entries(prediction.features).map(([name, value]) => (
                <div key={name}>
                  <dt className="text-xs text-muted-foreground">{name.replaceAll("_", " ")}</dt>
                  <dd className="font-medium capitalize text-foreground">{value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Feature values will appear after analysis.</p>
          )}
        </SectionCard>

        <SectionCard title="Model Explanation" description="Backend explanation for this prediction">
          {prediction ? (
            <ul className="space-y-2 text-sm text-muted-foreground">
              {prediction.explanation.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Explanation will appear after analysis.</p>
          )}
        </SectionCard>
      </div>
    </AppShell>
  );
}
