import { observedRange } from "@/lib/score-explanations";
import type { AreaScore, ScoreResponse } from "@/types/scoring";

/** 🟡 FASE DUMMY — bobot tunggal, ditetapkan di server (context/context-mvp.md §6.5). */
const BOBOT = { wD: 0.25, wC: 0.5, wS: 0.25 } as const;

/** 🟡 FASE DUMMY — hasil /api/score untuk brief "kedai kopi, sekitar Rp25.000". */
export const SCORE_RESPONSE: ScoreResponse = {
  catatan: { harga_sumber: "perkiraan" },
  areas: [
    {
      area_id: "st_tanah_abang",
      station_id: "st_tanah_abang",
      station_name: "Tanah Abang",
      skor: 78.3,
      komponen: { demand: 0.54, competitive_headroom: 0.92, segment_match: 0.75 },
      bobot: BOBOT,
      n_observations: 38,
      n_price: 31,
      is_rankable: true,
    },
    {
      area_id: "st_juanda",
      station_id: "st_juanda",
      station_name: "Juanda",
      skor: 71.6,
      komponen: { demand: 0.49, competitive_headroom: 0.83, segment_match: 0.68 },
      bobot: BOBOT,
      n_observations: 27,
      n_price: 22,
      is_rankable: true,
    },
    {
      area_id: "st_sawah_besar",
      station_id: "st_sawah_besar",
      station_name: "Sawah Besar",
      skor: 64.2,
      komponen: { demand: 0.47, competitive_headroom: 0.71, segment_match: 0.58 },
      bobot: BOBOT,
      n_observations: 24,
      n_price: 19,
      is_rankable: true,
    },
    {
      area_id: "st_sudirman",
      station_id: "st_sudirman",
      station_name: "Sudirman",
      skor: 55.9,
      komponen: { demand: 0.52, competitive_headroom: 0.48, segment_match: 0.66 },
      bobot: BOBOT,
      n_observations: 33,
      n_price: 29,
      is_rankable: true,
    },
    {
      area_id: "st_manggarai",
      station_id: "st_manggarai",
      station_name: "Manggarai",
      skor: 41.4,
      komponen: { demand: 0.45, competitive_headroom: 0.31, segment_match: 0.52 },
      bobot: BOBOT,
      n_observations: 21,
      n_price: 16,
      is_rankable: true,
    },
    {
      area_id: "st_karet",
      station_id: "st_karet",
      station_name: "Karet",
      skor: 0,
      komponen: { demand: 0, competitive_headroom: 0, segment_match: 0 },
      bobot: BOBOT,
      n_observations: 3,
      n_price: 1,
      is_rankable: false,
    },
    {
      area_id: "st_cikini",
      station_id: "st_cikini",
      station_name: "Cikini",
      skor: 0,
      komponen: { demand: 0, competitive_headroom: 0, segment_match: 0 },
      bobot: BOBOT,
      n_observations: 5,
      n_price: 2,
      is_rankable: false,
    },
  ],
};

export const RANKED_AREAS: readonly AreaScore[] = SCORE_RESPONSE.areas.filter(
  (area) => area.is_rankable,
);

export const UNRANKABLE_AREAS: readonly AreaScore[] = SCORE_RESPONSE.areas.filter(
  (area) => !area.is_rankable,
);

/**
 * Rentang permintaan yang teramati di kawasan yang dapat diperingkat.
 * Dipakai untuk menandai di bar bahwa D hampir tidak membedakan kawasan.
 */
export const DEMAND_OBSERVED_RANGE = observedRange(
  RANKED_AREAS.map((area) => area.komponen.demand),
);

/** 🟡 FASE DUMMY — keluaran AI, satu paragraf per kawasan. */
export const AREA_INSIGHTS: Record<string, string> = {
  st_tanah_abang:
    "Kawasan ini hidup dari arus grosir yang mulai ramai sebelum jam tujuh pagi dan menurun sore hari. Kedai dengan harga menengah masih jarang, sementara pembeli yang lewat sudah banyak.",
  st_juanda:
    "Kantor pemerintahan dan sekolah di sekitar stasiun membuat keramaian menumpuk pada jam makan siang. Pilihan tempat duduk yang nyaman masih terbatas.",
  st_sawah_besar:
    "Deretan pertokoan lama mendominasi kawasan, dengan pembeli yang datang berulang. Usaha baru biasanya bersandar pada pelanggan tetap, bukan pejalan yang lewat sekali.",
  st_sudirman:
    "Pekerja kantor menjadi pembeli utama dan padat hanya di hari kerja. Persaingan tempat kopi di kawasan ini sudah rapat.",
  st_manggarai:
    "Kawasan ini lebih banyak dipakai sebagai titik pindah kereta daripada tempat berhenti. Waktu tunggu penumpang pendek, jadi pembelian cenderung cepat dan kecil.",
};
