"use client";

/**
 * hooks/property/useAllPropertiesSummary.ts
 *
 * Mengambil ringkasan properti seluruh stasiun dari /api/properties?summary=true
 * Digunakan oleh StationSearchBar untuk memfilter stasiun berdasarkan ketersediaan unit properti:
 * - Tipe properti: Rumah, Kos, Ruko, Kantor, Tanah, Retail
 * - Transaksi: Disewa, Dijual
 * - Karakteristik: Ada foto fisik
 */

import { useMemo } from "react";
import { useApiJson } from "@/hooks/api/useApiJson";

export interface PropertySummaryItem {
  id: string;
  station_id: string;
  kategori_properti: string;
  jenis_properti: string;
  alamat?: string;
  foto_tampak_depan: string | null;
  foto_spanduk: string | null;
  jarak_jalan_m?: number | null;
  waktu_jalan_s?: number | null;
}

export interface StationPropertyMeta {
  count: number;
  categories: string[];
  types: string[];
  hasPhoto: boolean;
  units: PropertySummaryItem[];
}

const KOSONG: PropertySummaryItem[] = [];

export function useAllPropertiesSummary() {
  const { data: raw, loading } = useApiJson<PropertySummaryItem[]>(
    "/api/properties?summary=true",
    "Gagal memuat ringkasan properti",
  );
  const data = Array.isArray(raw) ? raw : KOSONG;

  const stationPropertyMap = useMemo(() => {
    const map = new Map<string, StationPropertyMeta>();

    for (const item of data) {
      const existing = map.get(item.station_id) || {
        count: 0,
        categories: [],
        types: [],
        hasPhoto: false,
        units: [],
      };

      existing.count += 1;
      existing.units.push(item);

      if (item.kategori_properti && !existing.categories.includes(item.kategori_properti)) {
        existing.categories.push(item.kategori_properti);
      }

      if (item.jenis_properti && !existing.types.includes(item.jenis_properti)) {
        existing.types.push(item.jenis_properti);
      }

      if (item.foto_tampak_depan || item.foto_spanduk) {
        existing.hasPhoto = true;
      }

      map.set(item.station_id, existing);
    }

    return map;
  }, [data]);

  return { data, stationPropertyMap, loading };
}
