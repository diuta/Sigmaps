"use client";

import { createContext, useContext } from "react";
import type maplibregl from "maplibre-gl";

/**
 * Instance maplibre — ARCHITECTURE.md §4.2.
 * ⛔ Hanya untuk dipakai di dalam components/map/. Sidebar tidak boleh import ini.
 */
export interface MapInstanceContextValue {
  map: maplibregl.Map | null;
}

export const MapInstanceContext = createContext<MapInstanceContextValue>({ map: null });

export function useMapInstance(): MapInstanceContextValue {
  return useContext(MapInstanceContext);
}
