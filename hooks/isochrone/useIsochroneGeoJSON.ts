"use client";

/**
 * hooks/isochrone/useIsochroneGeoJSON.ts
 *
 * Memuat GeoJSON isokron per stasiun dari public/geojson/isochrone/{area_id}.geojson.
 * Kalau file tidak ditemukan (404) atau terjadi error, otomatis fallback ke generator
 * parametrik (lib/map/isochrone-generator.ts) supaya tampilan peta tetap berjalan.
 *
 * NAMING CONVENTION untuk file GeoJSON:
 *   public/geojson/isochrone/{area_id}.geojson
 *   Contoh: st_manggarai → public/geojson/isochrone/st_manggarai.geojson
 *
 * FORMAT GeoJSON yang didukung:
 *   - MAPID export (FeatureCollection, Polygon/MultiPolygon, properties bebas)
 *   - GeoJSON buatan sendiri (dengan/tanpa field "type" di properties)
 *
 * STATUS:
 *   🟡 FASE HYBRID: Stasiun yang sudah ada file GeoJSON → pakai file asli.
 *                   Stasiun yang belum → pakai generator dummy sebagai fallback.
 *   ✅ FASE FULL:   Semua stasiun sudah punya GeoJSON → generator tidak pernah dipakai.
 *                   Saat itu: hook ini bisa disederhanakan, generator bisa dihapus.
 */

import { useState, useEffect } from "react";
import type { FeatureCollection, Polygon, MultiPolygon } from "geojson";
import {
  generateIsochroneGeoJSON,
  type IsochroneOptions,
} from "@/lib/map/isochrone-generator";

export type IsochroneGeoJSON = FeatureCollection<Polygon | MultiPolygon>;

interface UseIsochroneGeoJSONResult {
  /**
   * GeoJSON siap pakai. `null` hanya saat stasiun belum dipilih.
   * Setelah stasiun dipilih, selalu ada nilai (file asli atau fallback generator).
   */
  geoJSON: IsochroneGeoJSON | null;
  /**
   * `true` = GeoJSON berasal dari file asli (public/geojson/isochrone/).
   * `false` = GeoJSON berasal dari generator parametrik (fallback).
   * Berguna untuk debugging / menampilkan indikator "data resmi" vs "estimasi".
   */
  isRealData: boolean;
  /** `true` saat sedang fetch file (sebelum hasil file/fallback tersedia) */
  isLoading: boolean;
}

/**
 * @param areaId - Nilai `selectedStation.area_id`, e.g. "st_manggarai".
 *                 Pass `null` jika belum ada stasiun yang dipilih.
 * @param fallbackOptions - Opsi untuk generator fallback (mode & radius). Opsional.
 */
export function useIsochroneGeoJSON(
  areaId: string | null,
  fallbackOptions: IsochroneOptions = { mode: "organic", radiusMeter: 800 },
  stationCoords?: { lng: number; lat: number }
): UseIsochroneGeoJSONResult {
  const [geoJSON, setGeoJSON] = useState<IsochroneGeoJSON | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!areaId) {
      setGeoJSON(null);
      setIsRealData(false);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const filePath = `/geojson/isochrone/${areaId}.geojson`;

    fetch(filePath)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<IsochroneGeoJSON>;
      })
      .then((data) => {
        if (cancelled) return;
        setGeoJSON(data);
        setIsRealData(true);
        setIsLoading(false);
      })
      .catch(() => {
        // File tidak ditemukan atau gagal — pakai generator parametrik
        if (cancelled) return;

        if (stationCoords) {
          const { geojson } = generateIsochroneGeoJSON(
            stationCoords.lng,
            stationCoords.lat,
            fallbackOptions
          );
          // Cast: generator menghasilkan Polygon, tapi tipe union Polygon|MultiPolygon
          setGeoJSON(geojson as IsochroneGeoJSON);
        } else {
          setGeoJSON(null);
        }
        setIsRealData(false);
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [areaId, stationCoords?.lng, stationCoords?.lat, fallbackOptions.mode, fallbackOptions.radiusMeter]);

  return { geoJSON, isRealData, isLoading };
}
