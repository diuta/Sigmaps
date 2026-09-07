"use client";

/**
 * hooks/property/useProperties.tsx
 * Ambil properti Properti Go di sekitar satu stasiun dari /api/properties.
 * /api/properties balas GeoJSON (geometry + properties terpisah) — di sini
 * diratakan jadi PropertyUnit[] (lat/lng jadi field biasa) supaya komponen
 * yang sudah ada (PropertyLayer, PropertyList) tidak perlu tahu bentuk GeoJSON.
 */

import { useEffect, useState } from "react";
import type { PropertyUnit } from "@/types/property";
import type { UsePropertiesResult } from "./useProperties.types";

interface PropertyFeature {
  geometry: { type: string; coordinates: [number, number] };
  properties: Omit<PropertyUnit, "lat" | "lng">;
}

export function useProperties(stationId: string | null): UsePropertiesResult {
  const [properties, setProperties] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!stationId) {
        setProperties([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/properties?station_id=${encodeURIComponent(stationId)}`);
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || "error" in json) {
          setError(json.error ?? "Gagal mengambil data properti");
          setProperties([]);
          return;
        }

        const features = json.data.features as PropertyFeature[];
        setProperties(
          features.map((feature) => ({
            ...feature.properties,
            lng: feature.geometry.coordinates[0],
            lat: feature.geometry.coordinates[1],
          }))
        );
      } catch {
        if (!cancelled) {
          setError("Gagal mengambil data properti");
          setProperties([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [stationId]);

  return { properties, loading, error };
}
