/**
 * types/scoring.ts
 * Shape output dari /api/score — cerminan context-mvp.md §6.8 persis.
 * Jangan ubah tanpa diskusi bersama.
 */

// ---------------------------------------------------------------------------
// /api/score response (context-mvp §6.8)
// ---------------------------------------------------------------------------

export type ScoreComponentKey = "demand" | "competitive_headroom" | "segment_match";

export interface AreaScore {
  /** Match ke area_id di scored_areas & StationRanking */
  area_id: string;
  station_name: string;
  /** 0–100 = 100 × (0.25·D + 0.50·C + 0.25·S) */
  skor: number;
  komponen: {
    demand: number;               // D, 0–1
    competitive_headroom: number; // C, 0–1
    segment_match: number;        // S, 0–1
  };
  /** Bobot fixed di server — tidak dikirim dari klien */
  bobot: {
    wD: 0.25;
    wC: 0.50;
    wS: 0.25;
  };
  n_observations: number;
  n_price: number;
  /**
   * Kawasan dengan is_rankable=false TETAP dikirim supaya bisa
   * digambar di peta dengan label "data belum cukup".
   * Jangan tampilkan di ranking list.
   */
  is_rankable: boolean;
}

export interface ScoreResponse {
  /**
   * Semua kawasan — termasuk is_rankable=false.
   * Sudah diurutkan: rankable areas (by skor desc) → non-rankable areas.
   */
  areas: AreaScore[];
  catatan: {
    /** 'perkiraan' → tampilkan warning "harga tidak disebutkan, kami perkirakan..." */
    harga_sumber: "pengguna" | "perkiraan";
  };
}
