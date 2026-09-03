/**
 * Cerminan Zod schema di server — ARCHITECTURE.md §4.5, context-mvp.md §6.6.
 * ⛔ NAMA LAMA DILARANG: kategori_usaha, target_jam, segmen, skala, weights.
 */
export interface IntentOutput {
  /** Nilai dari TIPE_3_VALUES atau 'SEMUA'. */
  tipe_3: string;
  harga_target: number;
  harga_sumber: "pengguna" | "perkiraan";
  /** 0–1. Hanya petunjuk UI, tidak memblokir apa pun dan tidak masuk rumus. */
  confidence: number;
}
