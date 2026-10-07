import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useState, type FormEvent } from "react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProfile } from "@/hooks/use-profile";
import { getLocations, type BackendLocation } from "@/lib/api/locations";
import {
  getPredictionFeatures,
  predictRisk,
  type PredictionFeatures,
  type StatelessPredictionResponse,
} from "@/lib/api/prediction";
import type { RiskLevel } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/what-if")({
  head: () => ({
    meta: [
      { title: "What-If Risk Simulator — BHUSANKET" },
      {
        name: "description",
        content:
          "Explore how changing environmental conditions may affect predicted landslide risk.",
      },
    ],
  }),
  component: WhatIfPage,
});

const INPUTS: {
  key: keyof PredictionFeatures;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  precision: number;
}[] = [
  {
    key: "rainfall_24h",
    label: "Rainfall — 24h",
    unit: "mm",
    min: 0,
    max: 1000,
    step: 0.1,
    precision: 1,
  },
  {
    key: "soil_moisture",
    label: "Soil Moisture",
    unit: "%",
    min: 0,
    max: 100,
    step: 0.1,
    precision: 1,
  },
  { key: "slope", label: "Slope", unit: "°", min: 0, max: 90, step: 0.1, precision: 1 },
  { key: "elevation", label: "Elevation", unit: "m", min: 0, max: 9000, step: 0.1, precision: 1 },
  { key: "ndvi", label: "NDVI", unit: "index", min: -1, max: 1, step: 0.01, precision: 2 },
  {
    key: "historical_events",
    label: "Historical Landslide Events",
    unit: "events",
    min: 0,
    max: 100000,
    step: 1,
    precision: 0,
  },
];

type ScenarioDraft = {
  locationId: number;
  values: Record<keyof PredictionFeatures, string>;
};

type SimulationResult = {
  locationId: number;
  values: PredictionFeatures;
  prediction: StatelessPredictionResponse;
};

type SimulationVariables = {
  locationId: number;
  values: PredictionFeatures;
};

function modelFeatures(features: PredictionFeatures): PredictionFeatures {
  return {
    ...features,
    soil_moisture: features.soil_moisture * 100,
  };
}

function editableValues(features: PredictionFeatures): Record<keyof PredictionFeatures, string> {
  const modelValues = modelFeatures(features);
  return {
    rainfall_24h: String(modelValues.rainfall_24h),
    soil_moisture: String(modelValues.soil_moisture),
    slope: String(modelValues.slope),
    elevation: String(modelValues.elevation),
    ndvi: String(modelValues.ndvi),
    historical_events: String(modelValues.historical_events),
  };
}

function asRiskLevel(value: string): RiskLevel {
  const normalized = value.trim().toLowerCase();
  if (normalized === "moderate" || normalized === "high" || normalized === "critical") {
    return normalized;
  }
  return "low";
}

function formatValue(value: number, precision: number): string {
  return value.toFixed(precision);
}

function WhatIfPage() {
  const { data: profile } = useProfile();
  const {
    data: locations = [],
    isLoading: locationsLoading,
    error: locationsError,
  } = useQuery({
    queryKey: ["what-if-locations"],
    queryFn: () => getLocations(),
  });
  const [selectedLocationId, setSelectedLocationId] = useState<number | null>(null);
  const [draft, setDraft] = useState<ScenarioDraft | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedLocation = locations.find((location) => location.id === selectedLocationId) ?? null;
  const baselineFeaturesQuery = useQuery({
    queryKey: ["what-if-features", selectedLocationId],
    queryFn: () => {
      if (selectedLocationId === null) {
        throw new Error("Select a location to load baseline conditions.");
      }
      return getPredictionFeatures(selectedLocationId);
    },
    enabled: selectedLocationId !== null,
    retry: false,
  });
  const baselineFeatures = baselineFeaturesQuery.data?.features;
  const baselineModelFeatures = baselineFeatures ? modelFeatures(baselineFeatures) : null;
  const baselinePredictionQuery = useQuery({
    queryKey: ["what-if-baseline-prediction", selectedLocationId, baselineFeatures],
    queryFn: () => {
      if (!baselineModelFeatures) {
        throw new Error("Baseline conditions are not available.");
      }
      return predictRisk(baselineModelFeatures);
    },
    enabled: baselineModelFeatures !== null,
    retry: false,
  });
  const scenarioValues =
    baselineModelFeatures && selectedLocationId !== null
      ? draft?.locationId === selectedLocationId
        ? draft.values
        : editableValues(baselineFeatures)
      : null;

  const simulation = useMutation<SimulationResult, Error, SimulationVariables>({
    mutationFn: async ({ locationId, values }) => ({
      locationId,
      values,
      prediction: await predictRisk(values),
    }),
    onSuccess: (simulationResult) => {
      setResult(simulationResult);
      setValidationError(null);
    },
  });

  function chooseLocation(value: string) {
    const locationId = value ? Number(value) : null;
    setSelectedLocationId(locationId);
    setDraft(null);
    setResult(null);
    setValidationError(null);
    simulation.reset();
  }

  function updateScenario(key: keyof PredictionFeatures, value: string) {
    if (selectedLocationId === null || !scenarioValues) return;
    setDraft({
      locationId: selectedLocationId,
      values: { ...scenarioValues, [key]: value },
    });
    setResult(null);
    setValidationError(null);
  }

  function resetScenario() {
    setDraft(null);
    setResult(null);
    setValidationError(null);
    simulation.reset();
  }

  function runSimulation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedLocationId === null || !scenarioValues || simulation.isPending) return;

    const parsed: PredictionFeatures = {
      rainfall_24h: 0,
      soil_moisture: 0,
      slope: 0,
      elevation: 0,
      ndvi: 0,
      historical_events: 0,
    };
    for (const field of INPUTS) {
      const rawValue = scenarioValues[field.key].trim();
      const value = Number(rawValue);
      if (rawValue === "" || !Number.isFinite(value)) {
        setValidationError(`${field.label} must be a valid number.`);
        return;
      }
      if (value < field.min || value > field.max) {
        setValidationError(
          `${field.label} must be between ${field.min} and ${field.max} ${field.unit}.`,
        );
        return;
      }
      if (field.key === "historical_events" && !Number.isInteger(value)) {
        setValidationError("Historical Landslide Events must be a whole number.");
        return;
      }
      parsed[field.key] = value;
    }

    simulation.mutate({ locationId: selectedLocationId, values: parsed });
  }

  const currentResult = result?.locationId === selectedLocationId ? result : null;
  const changedInputs =
    currentResult && baselineModelFeatures
      ? INPUTS.flatMap((field) => {
          const baseline = baselineModelFeatures[field.key];
          const scenario = currentResult.values[field.key];
          return baseline === scenario
            ? []
            : [{ field, baseline, scenario, difference: scenario - baseline }];
        })
      : [];

  return (
    <AppShell
      title="What-If Risk Simulator"
      subtitle="Explore how changing environmental conditions may affect the model's predicted landslide risk."
      user={profile ? { name: profile.name, role: profile.roleLabel } : null}
    >
      <div className="mb-4 flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <div className="space-y-1 text-xs text-foreground">
          <p>
            This simulator is for scenario exploration. It does not create alerts or change stored
            monitoring data.
          </p>
          <p>Model probability is not a calibrated probability of landslide occurrence.</p>
        </div>
      </div>

      <SectionCard
        title="Location and Baseline"
        description="Choose a monitored location with an existing environmental observation."
      >
        <label
          htmlFor="what-if-location"
          className="mb-1.5 block text-xs font-medium text-muted-foreground"
        >
          Monitoring location
        </label>
        <select
          id="what-if-location"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:max-w-xl"
          value={selectedLocationId ?? ""}
          onChange={(event) => chooseLocation(event.target.value)}
          disabled={locationsLoading}
        >
          <option value="">{locationsLoading ? "Loading locations…" : "Select a location"}</option>
          {locations.map((location: BackendLocation) => (
            <option key={location.id} value={location.id}>
              {location.name} — {location.district}
            </option>
          ))}
        </select>
        {locationsError && (
          <p className="mt-2 text-sm text-risk-critical">
            Could not load locations: {errorMessage(locationsError)}
          </p>
        )}

        {selectedLocation && (
          <p className="mt-2 text-sm font-medium text-foreground">
            {selectedLocation.name}{" "}
            <span className="font-normal text-muted-foreground">· {selectedLocation.district}</span>
          </p>
        )}

        {selectedLocationId !== null && baselineFeaturesQuery.isLoading && (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading baseline conditions…
          </p>
        )}
        {baselineFeaturesQuery.error && (
          <p className="mt-4 text-sm text-risk-critical">
            Baseline conditions unavailable: {errorMessage(baselineFeaturesQuery.error)}
          </p>
        )}
        {baselineFeatures && baselineModelFeatures && (
          <>
            <h3 className="mb-2 mt-5 text-sm font-semibold text-foreground">Baseline Conditions</h3>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {INPUTS.map((field) => (
                <div key={field.key} className="rounded-md border border-border bg-card p-3">
                  <p className="text-xs text-muted-foreground">{field.label}</p>
                  <p className="mt-1 font-semibold text-foreground">
                    {formatValue(
                      field.key === "soil_moisture" && baselineFeatures
                        ? baselineFeatures[field.key]
                        : baselineModelFeatures[field.key],
                      field.precision,
                    )}{" "}
                    <span className="text-xs font-normal text-muted-foreground">{field.unit}</span>
                  </p>
                </div>
              ))}
            </div>
            {baselinePredictionQuery.isLoading && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Calculating baseline model output…
              </p>
            )}
            {baselinePredictionQuery.error && (
              <p className="mt-4 text-sm text-risk-critical">
                Baseline prediction failed: {errorMessage(baselinePredictionQuery.error)}
              </p>
            )}
          </>
        )}
      </SectionCard>

      {scenarioValues && baselineModelFeatures && (
        <form onSubmit={runSimulation} className="mt-4">
          <SectionCard
            title="Scenario Conditions"
            description="Edit the inputs to explore a different set of conditions. The baseline remains unchanged."
            actions={
              <Button
                type="button"
                variant="outline"
                onClick={resetScenario}
                disabled={simulation.isPending}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Scenario
              </Button>
            }
          >
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {INPUTS.map((field) => (
                <div key={field.key} className="space-y-1.5">
                  <label
                    htmlFor={`scenario-${field.key}`}
                    className="block text-sm font-medium text-foreground"
                  >
                    {field.label}{" "}
                    <span className="font-normal text-muted-foreground">({field.unit})</span>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Baseline:{" "}
                    {formatValue(
                      field.key === "soil_moisture" && baselineFeatures
                        ? baselineFeatures[field.key]
                        : baselineModelFeatures[field.key],
                      field.precision,
                    )}{" "}
                    {field.unit}
                  </p>
                  <Input
                    id={`scenario-${field.key}`}
                    type="number"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    required
                    value={scenarioValues[field.key]}
                    onChange={(event) => updateScenario(field.key, event.target.value)}
                    disabled={simulation.isPending}
                    aria-label={`Scenario ${field.label}`}
                  />
                </div>
              ))}
            </div>
            {validationError && (
              <p className="mt-3 text-sm text-risk-critical">{validationError}</p>
            )}
            <div className="mt-5">
              <Button
                type="submit"
                disabled={
                  simulation.isPending ||
                  baselinePredictionQuery.isLoading ||
                  Boolean(baselinePredictionQuery.error)
                }
              >
                {simulation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                )}
                Run What-If Simulation
              </Button>
            </div>
            {simulation.error && (
              <p role="alert" className="mt-3 text-sm text-risk-critical">
                Scenario prediction failed: {errorMessage(simulation.error)}
              </p>
            )}
          </SectionCard>
        </form>
      )}

      {baselinePredictionQuery.data && (
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <PredictionCard title="Baseline" prediction={baselinePredictionQuery.data} />
          {currentResult ? (
            <PredictionCard title="What-If Scenario" prediction={currentResult.prediction} />
          ) : (
            <SectionCard title="What-If Scenario">
              <p className="py-4 text-sm text-muted-foreground">
                Adjust scenario inputs and run a simulation to see the model output.
              </p>
            </SectionCard>
          )}
        </div>
      )}

      {currentResult && baselinePredictionQuery.data && (
        <>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <SectionCard title="Risk Change">
              <p className="text-sm text-foreground">
                {baselinePredictionQuery.data.risk_level === currentResult.prediction.risk_level
                  ? `Risk level remains ${baselinePredictionQuery.data.risk_level}.`
                  : `Risk level changed from ${baselinePredictionQuery.data.risk_level} → ${currentResult.prediction.risk_level}.`}
              </p>
              <p className="mt-2 text-sm text-foreground">
                {describeProbabilityChange(
                  (currentResult.prediction.probability -
                    baselinePredictionQuery.data.probability) *
                    100,
                )}
              </p>
            </SectionCard>
            <SectionCard title="Changed Inputs">
              {changedInputs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No inputs differ from baseline.</p>
              ) : (
                <ul className="space-y-3">
                  {changedInputs.map(({ field, baseline, scenario, difference }) => (
                    <li
                      key={field.key}
                      className="border-b border-border/60 pb-3 last:border-0 last:pb-0"
                    >
                      <p className="text-sm font-semibold text-foreground">{field.label}</p>
                      <p className="mt-1 text-sm text-foreground">
                        {formatValue(baseline, field.precision)} {field.unit} →{" "}
                        {formatValue(scenario, field.precision)} {field.unit}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Change: {difference > 0 ? "+" : ""}
                        {formatValue(difference, field.precision)} {field.unit}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          </div>
          <SectionCard title="Model Explanation">
            <p className="mb-2 text-xs font-medium text-foreground">
              Feature importance from the trained Random Forest model
            </p>
            <p className="text-sm text-muted-foreground">
              Feature importance from the trained Random Forest model is not exposed by the current
              prediction API. The{" "}
              <Link
                to="/prediction"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Prediction page
              </Link>{" "}
              shows its existing model explanation. The What-If result reflects the model&apos;s
              prediction for the selected scenario; it is not a causal explanation.
            </p>
          </SectionCard>
        </>
      )}
    </AppShell>
  );
}

function PredictionCard({
  title,
  prediction,
}: {
  title: string;
  prediction: StatelessPredictionResponse;
}) {
  return (
    <SectionCard title={title}>
      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Risk Level</dt>
          <dd className="mt-2">
            <RiskBadge level={asRiskLevel(prediction.risk_level)} />
          </dd>
        </div>
        <div>
          <dt className="text-xs font-medium text-muted-foreground">Model Probability</dt>
          <dd className="mt-2 text-2xl font-semibold text-foreground">
            {(prediction.probability * 100).toFixed(1)}%
          </dd>
        </div>
      </dl>
    </SectionCard>
  );
}

function describeProbabilityChange(value: number): string {
  if (value === 0) return "Model probability is unchanged.";
  return `Model probability ${value > 0 ? "increased" : "decreased"} by ${Math.abs(value).toFixed(1)} percentage points.`;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
