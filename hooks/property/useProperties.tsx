"use client";

import { useMemo } from "react";
import { useApiJson } from "@/hooks/api/useApiJson";
import type { PropertyUnit } from "@/types/property";
import type { UsePropertiesResult } from "./useProperties.types";

interface PropertyFeature {
  geometry: { type: string; coordinates: [number, number] };
  properties: Omit<PropertyUnit, "lat" | "lng">;
}

interface PropertyFeatureCollection {
  features: PropertyFeature[];
}

const KOSONG: PropertyUnit[] = [];

export function useProperties(stationId: string | null): UsePropertiesResult {
  const { data, loading, error } = useApiJson<PropertyFeatureCollection>(
    stationId ? `/api/properties?station_id=${encodeURIComponent(stationId)}` : null,
    "Gagal mengambil data properti",
  );

  const properties = useMemo<PropertyUnit[]>(
    () =>
      data
        ? data.features.map((feature) => ({
            ...feature.properties,
            station_id: feature.properties.station_id ?? null,
            lng: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          }))
        : KOSONG,
    [data],
  );

  return { properties, loading, error };
}
