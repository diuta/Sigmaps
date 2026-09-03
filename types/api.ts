/**
 * types/api.ts
 * Kontrak request/response semua API route — cerminan Zod schema di server.
 * Sumber: docs/fe/context-mvp.md §6.6
 *
 * ⚠️ NAMA LAMA DILARANG: kategori_usaha, target_jam, segmen, skala, weights
 * Semua sudah dicabut di context-mvp §8.
 */

// ---------------------------------------------------------------------------
// TIPE_3 — kategori usaha kuliner dari sensus restoran
// ⚠️ Daftar ini BELUM FINAL — menunggu konfirmasi dari Jalur 2.
//    Update saat dataset sensus restoran dikonfirmasi.
// ---------------------------------------------------------------------------

export const TIPE_3_VALUES = [
  "KAFE DAN RESTO",
  "CEPAT SAJI",
  "WARUNG MAKAN",
  "BAKERY DAN KUE",
  "MINUMAN DAN DESSERT",
  "KATERING",
] as const;

export type Tipe3 = (typeof TIPE_3_VALUES)[number] | "SEMUA";

// ---------------------------------------------------------------------------
// /api/parse-intent
// ---------------------------------------------------------------------------

export interface ParseIntentRequest {
  teks: string; // Business Brief mentah dari user input
}

/**
 * Output dari /api/parse-intent — cerminan IntentSchema Zod di server.
 * Semua field SELALU terisi (tidak ada null) supaya alur one-shot terjaga.
 */
export interface IntentOutput {
  /**
   * Kategori kuliner dari TIPE_3_VALUES, atau 'SEMUA' jika tidak disebutkan.
   * 'SEMUA' → C dihitung dari total_restaurants (bukan per-tipe).
   * ⛔ Usaha non-kuliner → TOLAK, jangan isi SEMUA.
   */
  tipe_3: Tipe3;
  /**
   * Harga target per porsi dalam rupiah. Integer, 1000–1_000_000.
   * Jika user tidak menyebut harga → AI perkirakan dari tipe_3,
   * dan harga_sumber diset 'perkiraan'.
   */
  harga_target: number;
  /** 'perkiraan' → UI wajib tampilkan warning konfirmasi harga */
  harga_sumber: "pengguna" | "perkiraan";
  /**
   * 0–1. Penilaian model tentang keyakinannya sendiri.
   * ⚠️ TIDAK MEMBLOKIR apapun. Jangan pakai untuk gating.
   * Hanya untuk tampilkan hint konfirmasi di UI.
   */
  confidence: number;
}

// ---------------------------------------------------------------------------
// /api/score
// ---------------------------------------------------------------------------

export interface ScoreRequest {
  tipe_3: Tipe3;
  harga_target: number;
}

// ScoreResponse ada di types/scoring.ts

// ---------------------------------------------------------------------------
// /api/properties
// ---------------------------------------------------------------------------

export interface PropertiesRequest {
  station_id: string; // match ke area_id di StationRanking
}

// Response: PropertyUnit[] — ada di types/property.ts

// ---------------------------------------------------------------------------
// /api/community-sentiment
// ---------------------------------------------------------------------------

export interface CommunitySentimentRequest {
  station_id: string;
}

export interface CommunitySentimentResponse {
  /**
   * Ringkasan Gemini dari Community Activity kawasan ini.
   * ⚠️ Personal info sudah dibuang sebelum dikirim ke AI:
   *    user_name, user_full_name, user_profile_picture, community_picture.
   */
  ringkasan: string;
  /** Jumlah laporan Activity yang jadi input ringkasan */
  n_laporan: number;
}
