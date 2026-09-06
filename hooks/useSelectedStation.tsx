"use client";

/**
 * hooks/useSelectedStation.tsx
 * Jembatan Komunikasi Utama Map <-> Sidebar
 *
 * Sesuai ARCHITECTURE.md §4.1:
 * - Clement (Sidebar) menulis: setSelectedStation(station) saat user klik ranking card.
 * - Caca (Map) membaca: selectedStation di BaseMap.tsx untuk trigger map.flyTo() internal.
 * - Caca (Map) juga menulis: setSelectedStation(station) saat user klik pin stasiun di peta.
 *
 * ⛔ PENTING: Jangan ubah interface tanpa diskusi bersama Caca & Clement.
 */

import React, { createContext, useContext, useState, ReactNode } from "react";
import type { StationLocation } from "@/types/station";

interface SelectedStationContextValue {
  selectedStation: StationLocation | null;
  setSelectedStation: (station: StationLocation | null) => void;
}

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
