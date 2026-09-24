import { createContext, useContext, useState, type ReactNode } from "react";

import type { BackendLocation } from "@/lib/api/locations";

type LocationSelection = {
  selectedLocationId: number | null;
  selectedLocation: BackendLocation | null;
  selectLocation: (location: BackendLocation) => void;
};

const LocationSelectionContext = createContext<LocationSelection | null>(null);

export function LocationSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedLocation, setSelectedLocation] = useState<BackendLocation | null>(null);

  function selectLocation(location: BackendLocation) {
    setSelectedLocation(location);
  }

  return (
    <LocationSelectionContext.Provider
      value={{
        selectedLocationId: selectedLocation?.id ?? null,
        selectedLocation,
        selectLocation,
      }}
    >
      {children}
    </LocationSelectionContext.Provider>
  );
}

export function useLocationSelection() {
  const selection = useContext(LocationSelectionContext);
  if (!selection) {
    throw new Error("useLocationSelection must be used within LocationSelectionProvider");
  }
  return selection;
}