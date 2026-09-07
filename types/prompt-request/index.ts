/**
 * types/prompt-request/index.ts
 * Kontrak request/response /api/prompt-request.
 * Sumber: context/context-mvp.md §2 Langkah 2 & §6.6
 */

import type { Tipe3 } from "@/types/tipe3";

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface PromptRequestBody {
  prompt: string; // Business Brief mentah dari user input
}

// ---------------------------------------------------------------------------
// Response — cerminan IntentSchema Zod di server.
// Semua field SELALU terisi (tidak ada null) supaya alur one-shot terjaga.
// ---------------------------------------------------------------------------

export interface IntentOutput {
  /**
   * Kategori kuliner dari daftar dinamis (lihat types/tipe3.ts), atau 'SEMUA'
   * jika tidak disebutkan.
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
