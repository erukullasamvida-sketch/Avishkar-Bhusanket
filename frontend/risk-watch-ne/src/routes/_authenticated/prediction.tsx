import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Info, Loader2, Play, RotateCcw } from "lucide-react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDemoMode } from "@/hooks/use-demo-mode";
import { useLocationSelection } from "@/hooks/use-location-selection";
import {
  getFeatureImportance,
  getPreparedPredictionFeatures,
  predictScenario,
  runActualPrediction,
  type FeatureImportance,
  type ModelPrediction,
  type PredictionFeatures,
} from "@/lib/api/prediction";
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

const FEATURE_LABELS: Record<keyof PredictionFeatures, string> = {
  rainfall_24h: "Rainfall (24h)",
  soil_moisture: "Soil moisture (%)",
  slope: "Slope",
  elevation: "Elevation",
  ndvi: "NDVI",
  historical_events: "Historical events",
};

type ScenarioInputs = {
  rainfall_24h: string;
  soil_moisture: string;
};

type SimulationResult = {
  baseline: ModelPrediction;
  scenario: ModelPrediction;
  baselineFeatures: PredictionFeatures;
  scenarioFeatures: PredictionFeatures;
  changedInputs: (keyof ScenarioInputs)[];
};

function compareRisk(baseline: string, scenario: string): string {
  const levels = ["low", "moderate", "high", "critical"];
  const baselineLevel = baseline.toLowerCase();
  const scenarioLevel = scenario.toLowerCase();
  const baselineRank = levels.indexOf(baselineLevel);
  const scenarioRank = levels.indexOf(scenarioLevel);

  if (baselineRank === -1 || scenarioRank === -1) {
    return baselineLevel === scenarioLevel ? "Unchanged" : "Unable to compare";
  }
  if (scenarioRank > baselineRank) return "Increased";
  if (scenarioRank < baselineRank) return "Decreased";
  return "Unchanged";
}

function PredictionPage() {
  const { data: profile } = useProfile();
  const { selectedLocationId, selectedLocation } = useLocationSelection();
  const [scenarioInputs, setScenarioInputs] = useState<ScenarioInputs>({
    rainfall_24h: "",
    soil_moisture: "",
  });
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
      return runActualPrediction(selectedLocationId);
    },
    enabled: false,
  });
  const {
    data: baseline,
    isLoading: baselineLoading,
    error: baselineError,
  } = useQuery({
    queryKey: ["prediction-features", selectedLocationId],
    queryFn: () => {
      if (selectedLocationId === null) {
        throw new Error("Select a location before loading baseline environmental inputs.");
      }
      return getPreparedPredictionFeatures(selectedLocationId);
    },
    enabled: selectedLocationId !== null,
  });
  const featureImportanceQuery = useQuery({
    queryKey: ["prediction-feature-importance"],
    queryFn: getFeatureImportance,
    enabled: Boolean(prediction),
  });
  const simulation = useMutation({
    mutationFn: async ({
      baselineFeatures,
      inputs,
    }: {
      baselineFeatures: PredictionFeatures;
      inputs: ScenarioInputs;
    }): Promise<SimulationResult> => {
      const scenarioFeatures: PredictionFeatures = { ...baselineFeatures };
      for (const name of Object.keys(inputs) as (keyof ScenarioInputs)[]) {
        const rawValue = inputs[name].trim();
        if (!rawValue) continue;
        const value = Number(rawValue);
        if (!Number.isFinite(value)) {
          throw new Error(`${FEATURE_LABELS[name]} must be a valid number.`);
        }
        if (name === "rainfall_24h" && value < 0) {
          throw new Error("Rainfall must be zero or greater.");
        }
        if (name === "soil_moisture" && (value < 0 || value > 100)) {
          throw new Error("Soil moisture must be between 0 and 100%.");
        }
        scenarioFeatures[name] = value;
      }

      const changedInputs = (Object.keys(inputs) as (keyof ScenarioInputs)[]).filter(
        (name) => scenarioFeatures[name] !== baselineFeatures[name],
      );
      const [baselinePrediction, scenarioPrediction] = await Promise.all([
        predictScenario(baselineFeatures),
        predictScenario(scenarioFeatures),
      ]);

      return {
        baseline: baselinePrediction,
        scenario: scenarioPrediction,
        baselineFeatures,
        scenarioFeatures,
        changedInputs,
      };
    },
  });
  const resetSimulation = simulation.reset;

  useEffect(() => {
    setScenarioInputs({ rainfall_24h: "", soil_moisture: "" });
    resetSimulation();
  }, [resetSimulation, selectedLocationId]);

  function runAnalysis() {
    if (selectedLocationId === null) return;
    void refetch();
  }

  function runSimulation() {
    if (!baseline) return;
    simulation.mutate({
      baselineFeatures: baseline.features,
      inputs: scenarioInputs,
    });
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
        <SectionCard
          title="ExplainAI"
          description="Evidence for the actual location prediction"
        >
          {prediction ? (
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Prediction
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <RiskBadge level={toRiskLevel(prediction.risk_level)} />
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Model probability
                  </span>
                  <span className="font-medium text-foreground">
                    {(prediction.probability * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Model evidence — input evidence supplied to the model
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {(Object.keys(FEATURE_LABELS) as (keyof PredictionFeatures)[]).map((name) => (
                    <div key={name}>
                      <dt className="text-xs text-muted-foreground">{FEATURE_LABELS[name]}</dt>
                      <dd className="font-medium text-foreground">{prediction.features[name]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Global model feature importance
                </p>
                {featureImportanceQuery.isLoading ? (
                  <p className="text-muted-foreground">Loading model evidence…</p>
                ) : featureImportanceQuery.error ? (
                  <p className="text-risk-critical">
                    Feature importance unavailable:{" "}
                    {featureImportanceQuery.error instanceof Error
                      ? featureImportanceQuery.error.message
                      : "Unknown error"}
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {featureImportanceQuery.data?.map((item: FeatureImportance) => (
                      <li key={item.name} className="flex justify-between gap-3">
                        <span>{item.name}</span>
                        <span className="font-medium text-foreground">{item.importance}%</span>
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Global model feature importance — not a location-specific causal explanation.
                  It describes overall learned model usage and does not prove a feature caused this
                  prediction.
                </p>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Explanation / limitations
                </p>
                <p className="text-muted-foreground">
                  The model classified this scenario as {prediction.risk_level} based on the
                  supplied environmental and terrain inputs. Model probability is model output, not
                  calibrated confidence. Causal explanation: this model output does not establish
                  that any input caused the predicted risk.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Run an actual location analysis to show its prediction and input evidence.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="What-If Risk Simulator"
          description="Explore assumed changes without recording them as observations"
        >
          <p className="mb-3 rounded-md border border-risk-moderate/40 bg-risk-moderate-soft p-2 text-xs font-semibold uppercase tracking-wide text-risk-moderate">
            Simulated — not an actual alert
          </p>
          {selectedLocationId === null ? (
            <p className="text-sm text-muted-foreground">Select a location to load its baseline.</p>
          ) : baselineLoading ? (
            <p className="text-sm text-muted-foreground">Loading latest baseline inputs…</p>
          ) : baselineError ? (
            <p className="text-sm text-risk-critical">
              Baseline unavailable:{" "}
              {baselineError instanceof Error ? baselineError.message : "Unknown error"}
            </p>
          ) : baseline ? (
            <div className="space-y-4">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Baseline — latest prepared inputs
                </p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  {(Object.keys(FEATURE_LABELS) as (keyof PredictionFeatures)[]).map((name) => (
                    <div key={name}>
                      <dt className="text-xs text-muted-foreground">{FEATURE_LABELS[name]}</dt>
                      <dd className="font-medium text-foreground">{baseline.features[name]}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Scenario inputs — blank keeps baseline; entered values are assumed / simulated
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Rainfall (24h), assumed
                    <Input
                      type="number"
                      min="0"
                      step="any"
                      value={scenarioInputs.rainfall_24h}
                      placeholder={String(baseline.features.rainfall_24h)}
                      onChange={(event) =>
                        setScenarioInputs((current) => ({
                          ...current,
                          rainfall_24h: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <label className="space-y-1 text-xs text-muted-foreground">
                    Soil moisture (% model input), assumed
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="any"
                      value={scenarioInputs.soil_moisture}
                      placeholder={String(baseline.features.soil_moisture)}
                      onChange={(event) =>
                        setScenarioInputs((current) => ({
                          ...current,
                          soil_moisture: event.target.value,
                        }))
                      }
                    />
                  </label>
                </div>
              </div>
              <Button
                onClick={runSimulation}
                disabled={simulation.isPending || baselineLoading}
              >
                {simulation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run simulation
              </Button>
              {simulation.error && (
                <p className="text-sm text-risk-critical">
                  Simulation failed:{" "}
                  {simulation.error instanceof Error
                    ? simulation.error.message
                    : "Unknown error"}
                </p>
              )}
              {simulation.data && (
                <div className="space-y-3 border-t border-border pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Result comparison — simulated only
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {(
                      [
                        ["Baseline", simulation.data.baseline],
                        ["Scenario", simulation.data.scenario],
                      ] as const
                    ).map(([label, result]) => (
                      <div key={label} className="rounded-md border border-border p-3">
                        <p className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
                          {label}
                        </p>
                        <RiskBadge level={toRiskLevel(result.risk_level)} />
                        <p className="mt-2 text-xs text-muted-foreground">
                          Model probability:{" "}
                          <span className="font-medium text-foreground">
                            {(result.probability * 100).toFixed(1)}%
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-foreground">
                    Risk {compareRisk(
                      simulation.data.baseline.risk_level,
                      simulation.data.scenario.risk_level,
                    ).toLowerCase()} by class.
                  </p>
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Changed inputs
                    </p>
                    {simulation.data.changedInputs.length ? (
                      <ul className="space-y-1 text-sm text-foreground">
                        {simulation.data.changedInputs.map((name) => (
                          <li key={name}>
                            {FEATURE_LABELS[name]}: {simulation.data?.baselineFeatures[name]} →{" "}
                            {simulation.data?.scenarioFeatures[name]} (assumed / simulated)
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No inputs changed; baseline and scenario use the same values.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Model probability is not calibrated confidence. This scenario is not sensor
                    data, is not saved as a risk record, and cannot create an alert.
                  </p>
                </div>
              )}
            </div>
          ) : null}
        </SectionCard>
      </div>
    </AppShell>
  );
}
