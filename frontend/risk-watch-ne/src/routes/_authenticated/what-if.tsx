import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Info, Loader2, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { AppShell, SectionCard } from "@/components/app-shell";
import { RiskBadge } from "@/components/risk-badge";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { getLocations, type BackendLocation } from "@/lib/api/locations";
import {
  getPredictionFeatures,
  predictRisk,
  searchHigherRiskScenarios,
  type HigherRiskScenarioSearchResponse,
  type PredictionFeatures,
  type SearchablePredictionFeature,
  type TargetRiskClass,
} from "@/lib/api/prediction";
import type { RiskLevel } from "@/lib/risk";

export const Route = createFileRoute("/_authenticated/what-if")({
  head: () => ({
    meta: [
      { title: "RiskPulse AI — BHUSANKET" },
      {
        name: "description",
        content: "Targeted Higher-Risk Scenario Discovery",
      },
    ],
  }),
  component: WhatIfPage,
});

const INPUTS: {
  key: keyof PredictionFeatures;
  label: string;
  unit: string;
  precision: number;
}[] = [
  {
    key: "rainfall_24h",
    label: "Rainfall — 24h",
    unit: "mm",
    precision: 1,
  },
  {
    key: "soil_moisture",
    label: "Soil Moisture",
    unit: "%",
    precision: 1,
  },
  { key: "slope", label: "Slope", unit: "°", precision: 1 },
  { key: "elevation", label: "Elevation", unit: "m", precision: 1 },
  { key: "ndvi", label: "NDVI", unit: "index", precision: 2 },
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

const SEARCHABLE_INPUTS: {
  key: SearchablePredictionFeature;
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
    step: 50,
    precision: 0,
  },
  {
    key: "soil_moisture",
    label: "Soil Moisture",
    unit: "%",
    min: 0,
    max: 100,
    step: 5,
    precision: 0,
  },
  { key: "slope", label: "Slope", unit: "°", min: 0, max: 90, step: 10, precision: 0 },
  { key: "elevation", label: "Elevation", unit: "m", min: 0, max: 9000, step: 500, precision: 0 },
  { key: "ndvi", label: "NDVI", unit: "index", min: -1, max: 1, step: 0.1, precision: 1 },
];

type ScenarioSearchVariables = {
  locationId: number;
  selectedFeatures: SearchablePredictionFeature[];
  targetClass: TargetRiskClass;
};

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
  const [selectedTargetClass, setSelectedTargetClass] = useState<TargetRiskClass>("moderate");
  const [selectedSearchFeatures, setSelectedSearchFeatures] = useState<
    SearchablePredictionFeature[]
  >(["rainfall_24h", "soil_moisture"]);
  const orderedSearchFeatures = SEARCHABLE_INPUTS.map((field) => field.key).filter((key) =>
    selectedSearchFeatures.includes(key),
  );
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
  const baselineModelFeatures = baselineFeatures ?? null;
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
  const baselineRiskLevel = baselinePredictionQuery.data?.risk_level;
  const searchMutation = useMutation<
    { locationId: number; result: HigherRiskScenarioSearchResponse },
    Error,
    ScenarioSearchVariables
  >({
    mutationFn: async ({ locationId, selectedFeatures, targetClass }) => ({
      locationId,
      result: await searchHigherRiskScenarios(locationId, selectedFeatures, targetClass),
    }),
  });

  function chooseLocation(value: string) {
    const locationId = value ? Number(value) : null;
    setSelectedLocationId(locationId);
    searchMutation.reset();
  }

  const currentSearch =
    searchMutation.data?.locationId === selectedLocationId ? searchMutation.data.result : null;

  const searchFeatureSelectionChanged = (feature: SearchablePredictionFeature) => {
    setSelectedSearchFeatures((selected) =>
      selected.includes(feature)
        ? selected.filter((item) => item !== feature)
        : [...selected, feature],
    );
    searchMutation.reset();
  };

  function findScenario() {
    if (
      selectedLocationId === null ||
      selectedSearchFeatures.length === 0 ||
      !baselinePredictionQuery.data ||
      baselineRiskLevel?.trim().toLowerCase() === "critical" ||
      searchMutation.isPending
    ) {
      return;
    }
    searchMutation.mutate({
      locationId: selectedLocationId,
      selectedFeatures: orderedSearchFeatures,
      targetClass: selectedTargetClass,
    });
  }

  return (
    <AppShell
      title="RiskPulse AI"
      subtitle="Targeted Higher-Risk Scenario Discovery"
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
                    {formatValue(baselineModelFeatures[field.key], field.precision)}{" "}
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
            {baselinePredictionQuery.data && (
              <div className="mt-4 flex flex-wrap items-center gap-3 rounded-md border border-border bg-card p-3">
                <span className="text-sm font-medium text-foreground">Baseline predicted risk</span>
                <RiskBadge level={asRiskLevel(baselinePredictionQuery.data.risk_level)} />
                <span className="text-sm text-muted-foreground">
                  Model probability: {(baselinePredictionQuery.data.probability * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {selectedLocationId !== null && baselineModelFeatures && (
        <div className="mt-4">
          <SectionCard
            title="RiskPulse AI"
            description="Search hypothetical changes from the prepared baseline. Each candidate changes one selected feature while all other features, including historical events, stay fixed."
          >
            <p className="mb-4 text-xs text-muted-foreground">
              These are model scenarios, not forecasts or confirmed future events. Search uses the
              configured feature ranges and steps shown with the results; it does not create alerts
              or change monitoring data.
            </p>
            <p className="mb-4 text-xs text-muted-foreground">
              Search grid:{" "}
              {SEARCHABLE_INPUTS.map(
                (field) =>
                  `${field.label} ${field.min}–${field.max} by ${field.step} ${field.unit}`,
              ).join("; ")}
              . At most 100 candidates are evaluated, changing one selected feature at a time.
            </p>
            <fieldset disabled={searchMutation.isPending}>
              <legend className="mb-2 text-sm font-medium text-foreground">
                Search these features
              </legend>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                {SEARCHABLE_INPUTS.map((field) => (
                  <label
                    key={field.key}
                    className="flex items-center gap-2 rounded-md border border-border bg-card p-2 text-sm text-foreground"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSearchFeatures.includes(field.key)}
                      onChange={() => searchFeatureSelectionChanged(field.key)}
                      className="accent-primary"
                    />
                    {field.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:max-w-xs">
                <label
                  htmlFor="what-if-target-risk"
                  className="mb-1.5 block text-xs font-medium text-muted-foreground"
                >
                  Target Risk Category
                </label>
                <select
                  id="what-if-target-risk"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={selectedTargetClass}
                  onChange={(event) => {
                    setSelectedTargetClass(event.target.value as TargetRiskClass);
                    searchMutation.reset();
                  }}
                  disabled={searchMutation.isPending}
                >
                  <option value="moderate">Moderate</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <Button
                type="button"
                onClick={findScenario}
                disabled={
                  searchMutation.isPending ||
                  selectedSearchFeatures.length === 0 ||
                  baselinePredictionQuery.isLoading ||
                  Boolean(baselinePredictionQuery.error) ||
                  baselineRiskLevel?.trim().toLowerCase() === "critical"
                }
                className="bg-green-600 text-white hover:bg-green-700"
              >
                {searchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Find Scenario
              </Button>
            </div>
            {baselinePredictionQuery.data &&
              baselineRiskLevel?.trim().toLowerCase() === "critical" && (
                <p className="mt-4 rounded-md border border-border bg-card p-3 text-sm text-muted-foreground">
                  The current risk class is Critical. No higher risk class exists.
                </p>
              )}
            {selectedSearchFeatures.length === 0 && (
              <p className="mt-3 text-sm text-muted-foreground">
                Select at least one feature to search for a scenario.
              </p>
            )}
            {searchMutation.isPending && (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching for the selected risk class…
              </p>
            )}
            {searchMutation.error && (
              <div className="mt-4 flex flex-col items-start gap-2">
                <p role="alert" className="text-sm text-risk-critical">
                  Scenario search failed: {errorMessage(searchMutation.error)}
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={findScenario}
                  disabled={searchMutation.isPending || baselinePredictionQuery.isError}
                >
                  Retry search
                </Button>
              </div>
            )}
            {currentSearch && (
              <div className="mt-5 border-t border-border pt-4">
                <div className="rounded-md border border-border bg-card p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {selectedTargetClass.charAt(0).toUpperCase() + selectedTargetClass.slice(1)}{" "}
                      scenario
                    </p>
                    {currentSearch.scenario && (
                      <RiskBadge
                        level={asRiskLevel(currentSearch.scenario.prediction.risk_level)}
                      />
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Baseline class: {currentSearch.baseline_prediction.risk_level}.{" "}
                    {currentSearch.evaluated_candidates} of at most {currentSearch.candidate_limit}{" "}
                    candidates evaluated.
                  </p>
                  {!currentSearch.target_is_higher ? (
                    <p className="mt-2 text-sm text-muted-foreground">
                      The selected target class is not higher than the current baseline class.
                    </p>
                  ) : currentSearch.scenario &&
                    currentSearch.scenario.prediction.risk_level.trim().toLowerCase() ===
                      selectedTargetClass ? (
                    <>
                      <p className="mt-2 text-sm text-foreground">
                        {SEARCHABLE_INPUTS.find(
                          (field) => field.key === currentSearch.scenario?.changed_feature,
                        )?.label ?? currentSearch.scenario.changed_feature}
                        :{" "}
                        {formatValue(
                          currentSearch.baseline[currentSearch.scenario.changed_feature],
                          SEARCHABLE_INPUTS.find(
                            (field) => field.key === currentSearch.scenario?.changed_feature,
                          )?.precision ?? 2,
                        )}{" "}
                        →{" "}
                        {formatValue(
                          currentSearch.scenario.features[currentSearch.scenario.changed_feature],
                          SEARCHABLE_INPUTS.find(
                            (field) => field.key === currentSearch.scenario?.changed_feature,
                          )?.precision ?? 2,
                        )}{" "}
                        {
                          SEARCHABLE_INPUTS.find(
                            (field) => field.key === currentSearch.scenario?.changed_feature,
                          )?.unit
                        }
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Predicted class: {currentSearch.scenario.prediction.risk_level}. Model
                        probability for that class:{" "}
                        {(currentSearch.scenario.prediction.probability * 100).toFixed(1)}%.
                      </p>
                    </>
                  ) : currentSearch.scenario ? (
                    <p role="alert" className="mt-2 text-sm text-risk-critical">
                      Scenario search returned a prediction that does not match the selected target
                      class.
                    </p>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      No scenario found within the tested range.
                    </p>
                  )}
                </div>
              </div>
            )}
          </SectionCard>
        </div>
      )}
    </AppShell>
  );
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unknown error";
}
