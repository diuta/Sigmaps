import type { StationLocation } from "@/types/station";

/**
 * 🟡 FASE DUMMY — titik stasiun yang digambar di peta.
 *
 * Dipakai sebagai ganti public/geojson/krl.geojson, yang hanya memuat empat titik
 * (manggarai, sudirman, bni-city, karet) dan tidak memuat Juanda maupun Tanah Abang.
 *
 * ❓ B-2: daftar stasiun Jakarta belum ditetapkan. Daftar ini sengaja ditaruh di satu
 * fixture supaya penggantinya cukup satu berkas, bukan tersebar di kode peta.
 */
export const STATIONS: readonly StationLocation[] = [
  { area_id: "st_juanda", station_name: "Stasiun Juanda", lng: 106.8306, lat: -6.1667, is_rankable: true },
  { area_id: "st_tanah_abang", station_name: "Stasiun Tanah Abang", lng: 106.8118, lat: -6.1857, is_rankable: true },
  { area_id: "st_sawah_besar", station_name: "Stasiun Sawah Besar", lng: 106.8283, lat: -6.1611, is_rankable: true },
  { area_id: "st_sudirman", station_name: "Stasiun Sudirman", lng: 106.8238, lat: -6.2023, is_rankable: true },
  { area_id: "st_manggarai", station_name: "Stasiun Manggarai", lng: 106.8502, lat: -6.2097, is_rankable: true },
  { area_id: "st_karet", station_name: "Stasiun Karet", lng: 106.8165, lat: -6.2003, is_rankable: false },
  { area_id: "st_cikini", station_name: "Stasiun Cikini", lng: 106.8412, lat: -6.1979, is_rankable: false },
];

/** Titik tengah dan zoom awal peta: koridor Sawah Besar–Juanda, Jakarta Pusat. */
export const MAP_INITIAL_VIEW = { center: [106.8285, -6.1835] as [number, number], zoom: 12.6 };
