"use client";

/**
 * hooks/useMapInstance.ts
 * Context internal untuk zona Map (ZONA CACA)
 *
 * Sesuai ARCHITECTURE.md §4.2:
 * ⛔ INTERNAL MAP ONLY: Hook ini hanya untuk dipakai oleh sub-komponen
 * di dalam components/map/ (seperti StationLayer, PropertyLayer, IsochroneLayer).
 * Komponen Sidebar TIDAK boleh mengimpor atau memakai hook ini!
 */

import React, { createContext, useContext, ReactNode } from "react";
import type maplibregl from "maplibre-gl";

interface MapInstanceContextValue {
  map: maplibregl.Map | null;
}

const MapInstanceContext = createContext<MapInstanceContextValue>({
  map: null,
});

export function MapInstanceProvider({
  map,
  children,
}: {
  map: maplibregl.Map | null;
  children: ReactNode;
}) {
  return (
    <MapInstanceContext.Provider value={{ map }}>
      {children}
    </MapInstanceContext.Provider>
  );
}

export function useMapInstance(): MapInstanceContextValue {
  const context = useContext(MapInstanceContext);
  return context;
}
