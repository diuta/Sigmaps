"use client";

/**
 * hooks/useStations.tsx
 * Ambil semua stasiun (lokasi + metadata) dari /api/stations, sekali saat mount.
 * Tidak membawa skor — skor datang dari /api/score dan digabung terpisah (lihat
 * StationLayer.tsx untuk penggabungannya).
 */

import { useEffect, useState } from "react";
import type { StationFeatureCollection } from "@/lib/station";

interface UseStationsResult {
  stations: StationFeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export function useStations(): UseStationsResult {
  const [stations, setStations] = useState<StationFeatureCollection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/stations");
        const json = await res.json();

        if (cancelled) return;

        if (!res.ok || "error" in json) {
          setError(json.error ?? "Gagal mengambil data stasiun");
          setStations(null);
          return;
        }

        setStations(json.data as StationFeatureCollection);
      } catch {
        if (!cancelled) {
          setError("Gagal mengambil data stasiun");
          setStations(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  return { stations, loading, error };
}
