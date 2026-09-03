"use client";

import { createContext, createElement, useContext, useMemo, useState, type ReactNode } from "react";
import type { StationRanking } from "@/types/station";

/**
 * Jembatan sidebar ↔ peta — ARCHITECTURE.md §4.1.
 * Sidebar membaca stasiun aktif; BaseMap yang menulis saat pin diklik.
 * ⛔ Sidebar tidak boleh memanggil map.flyTo() sendiri, cukup ubah state ini.
 */
export interface SelectedStationContextValue {
  selectedStation: StationRanking | null;
  setSelectedStation: (station: StationRanking | null) => void;
}

const SelectedStationContext = createContext<SelectedStationContextValue>({
  selectedStation: null,
  setSelectedStation: () => {},
});

/** createElement, bukan JSX, supaya nama file tetap .ts sesuai ARCHITECTURE.md §7. */
export function SelectedStationProvider({ children }: { children: ReactNode }) {
  const [selectedStation, setSelectedStation] = useState<StationRanking | null>(null);
  const value = useMemo(() => ({ selectedStation, setSelectedStation }), [selectedStation]);

  return createElement(SelectedStationContext.Provider, { value }, children);
}

export function useSelectedStation(): SelectedStationContextValue {
  return useContext(SelectedStationContext);
}
