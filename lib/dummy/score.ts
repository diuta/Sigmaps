/**
 * lib/dummy/score.ts
 * 🟡 FASE DUMMY — hapus file ini saat /api/score siap.
 *
 * ScoreResponse yang akan dikembalikan oleh useScore.ts selama pure FE phase.
 * Shape identik dengan context-mvp.md §6.8 — swap ke real fetch tanpa refactor.
 *
 * Konteks simulasi: user ketik "buka kafe, target harga 35 ribu"
 * → harga disebutkan user → harga_sumber='pengguna'
 */

import type { ScoreResponse } from "@/types/scoring";
import type { IntentOutput } from "@/types/api";

/** Dummy intent yang "memicu" score response ini */
export const DUMMY_INTENT: IntentOutput = {
  tipe_3: "KAFE DAN RESTO",
  harga_target: 35_000,
  harga_sumber: "pengguna",
  confidence: 0.91,
};

export const DUMMY_SCORE_RESPONSE: ScoreResponse = {
  areas: [
    {
      // rank 1
      area_id: "st_bni_city",
      station_id: "st_bni_city",
      station_name: "BNI City",
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
      // rank 2
      area_id: "st_manggarai",
      station_id: "st_manggarai",
      station_name: "Manggarai",
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
      // rank 3
      area_id: "st_sudirman",
      station_id: "st_sudirman",
      station_name: "Sudirman",
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
      // not ranked — is_rankable=false, muncul di peta saja
      area_id: "st_karet",
      station_id: "st_karet",
      station_name: "Karet",
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
  ],
  catatan: {
    harga_sumber: "pengguna",
  },
};
