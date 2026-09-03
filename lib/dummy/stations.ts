/**
 * lib/dummy/stations.ts
 * 🟡 FASE DUMMY — hapus file ini saat /api/score + Supabase siap.
 *
 * 4 stasiun dari public/geojson/krl.geojson dengan shape StationRanking lengkap.
 * Koordinat di-hardcode dari krl.geojson supaya dummy pins muncul di lokasi benar.
 * Skor dihitung manual: 100 × (0.25·D + 0.50·C + 0.25·S)
 *
 * Konteks simulasi: user ketik "buka kafe, target harga 35 ribu"
 * → tipe_3="KAFE DAN RESTO", harga_target=35000
 */

import type { StationRanking } from "@/types/station";

// Karet sengaja is_rankable=false (n_observations < 10)
// supaya UI dapat test path "data belum cukup" sejak awal.

export const DUMMY_STATIONS: StationRanking[] = [
  {
    // D=0.528, C=0.856, S=0.750 → skor=74.8 → rank 1
    area_id: "st_bni_city",
    station_name: "BNI City",
    lng: 106.82171821705732,
    lat: -6.201414636943112,
    rank: 1,
    skor: 74.8,
    komponen: {
      demand: 0.528,
      competitive_headroom: 0.856,
      segment_match: 0.75,
    },
    bobot: { wD: 0.25, wC: 0.50, wS: 0.25 },
    n_observations: 34,
    n_price: 34,
    is_rankable: true,
  },
  {
    // D=0.512, C=0.740, S=0.820 → skor=70.3 → rank 2
    area_id: "st_manggarai",
    station_name: "Manggarai",
    lng: 106.85024534381431,
    lat: -6.209729647966917,
    rank: 2,
    skor: 70.3,
    komponen: {
      demand: 0.512,
      competitive_headroom: 0.74,
      segment_match: 0.82,
    },
    bobot: { wD: 0.25, wC: 0.50, wS: 0.25 },
    n_observations: 28,
    n_price: 28,
    is_rankable: true,
  },
  {
    // D=0.480, C=0.540, S=0.690 → skor=56.3 → rank 3
    area_id: "st_sudirman",
    station_name: "Sudirman",
    lng: 106.82377780563885,
    lat: -6.202289889504992,
    rank: 3,
    skor: 56.3,
    komponen: {
      demand: 0.48,
      competitive_headroom: 0.54,
      segment_match: 0.69,
    },
    bobot: { wD: 0.25, wC: 0.50, wS: 0.25 },
    n_observations: 41,
    n_price: 38,
    is_rankable: true,
  },
  {
    // n_observations=6 → is_rankable=false
    // Skor dihitung tapi tidak ditampilkan di ranking.
    // Map tetap render marker dengan label "data belum cukup".
    area_id: "st_karet",
    station_name: "Karet",
    lng: 106.81654318748998,
    lat: -6.20028543846977,
    rank: null,
    skor: 48.0,
    komponen: {
      demand: 0.46,
      competitive_headroom: 0.33,
      segment_match: 0.8,
    },
    bobot: { wD: 0.25, wC: 0.50, wS: 0.25 },
    n_observations: 6,
    n_price: 4,
    is_rankable: false,
  },
];
