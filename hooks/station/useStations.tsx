"use client";

import { useApiJson } from "@/hooks/api/useApiJson";
import type { StationFeatureCollection } from "@/lib/station";
import type { UseStationsResult } from "./useStations.types";

export function useStations(): UseStationsResult {
  const { data, loading, error } = useApiJson<StationFeatureCollection>(
    "/api/stations",
    "Gagal mengambil data stasiun",
  );
  return { stations: data, loading, error };
}
