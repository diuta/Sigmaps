/**
 * types/station.ts
 * Kontrak data stasiun — jangan ubah tanpa diskusi bersama.
 * Sumber: context/context-mvp.md §2 Langkah 1 & §6.8
 */

import type { Feature, FeatureCollection, Point } from "geojson";

// ---------------------------------------------------------------------------
// Raw GeoJSON (dari public/geojson/krl.geojson)
// ---------------------------------------------------------------------------

export interface StationGeoJSONProperties {
  /** Nama stasiun lowercase-kebab, e.g. "manggarai" */
  name: string;
}

export type StationFeature = Feature<Point, StationGeoJSONProperties>;
export type StationFeatureCollection = FeatureCollection<
  Point,
  StationGeoJSONProperties
>;

// ---------------------------------------------------------------------------
// Enriched station — lokasi + skor dari /api/score
// Ini yang dipakai di seluruh UI (map layer + sidebar)
// ---------------------------------------------------------------------------

export interface StationRanking {
  /** Unique identifier, e.g. "st_manggarai". Match ke area_id di scored_areas. */
  area_id: string;
  /** Display name, e.g. "Manggarai" */
  station_name: string;
  /** WGS-84 coordinates — dibutuhkan map layer untuk render marker */
  lng: number;
  lat: number;
  /**
   * Peringkat 1–5, null jika is_rankable=false.
   * Dihitung di /api/score setelah sorting.
   */
  rank: number | null;
  /** Skor akhir 0–100 = 100 × (0.25·D + 0.50·C + 0.25·S) */
  skor: number;
  komponen: {
    /** D — permintaan, 0–1 (Bayesian mean dari kondisi_tempat Menu Go) */
    demand: number;
    /** C — ruang kompetisi, 0–1 (kurva punuk, puncak 0.4) */
    competitive_headroom: number;
    /** S — kecocokan segmen harga, 0–1 */
    segment_match: number;
  };
  bobot: {
    wD: 0.25;
    wC: 0.50;
    wS: 0.25;
  };
  /** Jumlah pengamatan Menu Go di kawasan ini */
  n_observations: number;
  /** Jumlah record yang punya data harga valid */
  n_price: number;
  /**
   * false jika n_observations < 10.
   * UI: tampilkan di peta dengan label "data belum cukup",
   * JANGAN masukkan ke peringkat.
   */
  is_rankable: boolean;
}

// ---------------------------------------------------------------------------
// Lokasi stasiun saja — tanpa skor
// Dipakai untuk sinkronisasi sidebar ↔ peta (useSelectedStation) dan lookup
// geografis (mis. klik ranking card di sidebar → tahu ke mana flyTo()).
// StationRanking di atas adalah superset ini, jadi selalu bisa dioper ke sini.
// ---------------------------------------------------------------------------

export interface StationLocation {
  area_id: string;
  station_name: string;
  lng: number;
  lat: number;
  is_rankable: boolean;
}
