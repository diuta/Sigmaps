"use client";

/**
 * hooks/station/useStations.tsx
 * Ambil semua stasiun (lokasi + metadata) dari /api/stations.
 * Tidak membawa skor — skor datang dari /api/score dan digabung terpisah (lihat
 * StationLayer.tsx untuk penggabungannya).
 *
 * Dipanggil dari beberapa komponen sekaligus (StationLayer, IsochroneLayer, StationSearchBar,
 * ScoredPanel); semuanya berbagi SATU request dan satu objek hasil lewat cache per URL di
 * hooks/api/useApiJson — dulu tiap pemanggil menembak /api/stations sendiri.
 */

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
