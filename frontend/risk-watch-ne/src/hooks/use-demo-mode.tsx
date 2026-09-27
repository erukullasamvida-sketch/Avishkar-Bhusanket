import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import type { RiskLevel } from "@/lib/risk";

type DemoModeContextValue = {
  demoActive: boolean;
  demoLevel: RiskLevel | null;
  demoAlertTriggered: boolean;
  startDemo: (locationName?: string) => void;
  stopDemo: () => void;
  resetDemo: () => void;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoActive, setDemoActive] = useState(false);
  const [demoLevel, setDemoLevel] = useState<RiskLevel | null>(null);
  const [demoAlertTriggered, setDemoAlertTriggered] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState<string | undefined>();

  useEffect(() => {
    if (!demoActive) return;

    setDemoLevel("moderate");
    setDemoAlertTriggered(false);

    const highTimer = window.setTimeout(() => setDemoLevel("high"), 2200);
    const criticalTimer = window.setTimeout(() => setDemoLevel("critical"), 4600);
    const alertTimer = window.setTimeout(() => {
      setDemoAlertTriggered(true);
      toast.error("Demo alert triggered", {
        description: `${selectedLocationName ?? "Selected location"} reached Critical risk.`,
      });
    }, 5200);

    return () => {
      window.clearTimeout(highTimer);
      window.clearTimeout(criticalTimer);
      window.clearTimeout(alertTimer);
    };
  }, [demoActive, selectedLocationName]);

  function startDemo(locationName?: string) {
    setSelectedLocationName(locationName);
    setDemoAlertTriggered(false);
    setDemoLevel("moderate");
    setDemoActive(true);
  }

  function stopDemo() {
    setDemoActive(false);
    setDemoLevel(null);
    setDemoAlertTriggered(false);
    setSelectedLocationName(undefined);
  }

  function resetDemo() {
    stopDemo();
  }

  return (
    <DemoModeContext.Provider
      value={{
        demoActive,
        demoLevel,
        demoAlertTriggered,
        startDemo,
        stopDemo,
        resetDemo,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const demoMode = useContext(DemoModeContext);

  if (!demoMode) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }

  return demoMode;
}
