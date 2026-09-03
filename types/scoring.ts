/** Kontrak /api/score — ARCHITECTURE.md §4.3, context-mvp.md §6.8. */

export type ScoreComponentKey = "demand" | "competitive_headroom" | "segment_match";

export interface AreaScore {
  area_id: string;
  station_name: string;
  /** 0–100. Deterministik, dihitung di lib/scoring.ts — bukan keluaran AI. */
  skor: number;
  komponen: Record<ScoreComponentKey, number>;
  bobot: { wD: number; wC: number; wS: number };
  n_observations: number;
  n_price: number;
  is_rankable: boolean;
}

export interface ScoreResponse {
  areas: AreaScore[];
  catatan: { harga_sumber: "pengguna" | "perkiraan" };
}
