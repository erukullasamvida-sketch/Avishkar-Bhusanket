import { ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

import type { RiskLocation } from "@/lib/api/risk";
import type { RiskLevel } from "@/lib/risk";
import type { MapLayers } from "./risk-leaflet-map";

const RiskLeafletMap = lazy(() => import("./risk-leaflet-map"));

function MapSkeleton({ height }: { height: number }) {
  return (
    <div
      className="grid animate-pulse place-items-center rounded-lg bg-muted text-sm text-muted-foreground"
      style={{ height }}
    >
      Loading map…
    </div>
  );
}

export function MapPanel({
  locations,
  layers,
  height = 420,
  compact = false,
  demoActive = false,
  selectedLocationId = null,
  demoLevel = null,
  demoAlertTriggered = false,
}: {
  locations: RiskLocation[];
  layers?: Partial<MapLayers> | undefined;
  height?: number;
  compact?: boolean;
  demoActive?: boolean;
  selectedLocationId?: number | null;
  demoLevel?: RiskLevel | null;
  demoAlertTriggered?: boolean;
}) {

  return (
    <ClientOnly fallback={<MapSkeleton height={height} />}>
      <Suspense fallback={<MapSkeleton height={height} />}>
        <RiskLeafletMap
          locations={locations}
          layers={layers}
          height={height}
          compact={compact}
          demoActive={demoActive}
          selectedLocationId={selectedLocationId}
          demoLevel={demoLevel}
          demoAlertTriggered={demoAlertTriggered}
        />
      </Suspense>
    </ClientOnly>
  );
}
