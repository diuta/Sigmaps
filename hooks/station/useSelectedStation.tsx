"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { StationLocation } from "@/types/station";
import type { SelectedStationContextValue } from "./useSelectedStation.types";

const SelectedStationContext = createContext<SelectedStationContextValue | undefined>(
  undefined
);

export function SelectedStationProvider({ children }: { children: ReactNode }) {
  const [selectedStation, setSelectedStation] = useState<StationLocation | null>(
    null
  );

  return (
    <SelectedStationContext.Provider
      value={{ selectedStation, setSelectedStation }}
    >
      {children}
    </SelectedStationContext.Provider>
  );
}

export function useSelectedStation(): SelectedStationContextValue {
  const context = useContext(SelectedStationContext);
  if (!context) {
    throw new Error(
      "useSelectedStation must be used within a SelectedStationProvider"
    );
  }
  return context;
}
