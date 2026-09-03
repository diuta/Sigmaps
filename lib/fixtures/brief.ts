import type { IntentOutput } from "@/types/api";

export const BRIEF_PLACEHOLDER = "Kedai kopi kecil, harga sekitar Rp25.000";

/** 🟡 FASE DUMMY — saran kategori usaha, keluaran AI. */
export const SUGGESTION_CHIPS: readonly string[] = [
  "Kedai kopi kecil, harga sekitar Rp25.000",
  "Warung makan harian, sekitar Rp15.000",
  "Kaki lima minuman, sekitar Rp10.000",
];

/**
 * 🟡 FASE DUMMY — hasil /api/parse-intent untuk brief contoh.
 * harga_sumber = 'perkiraan' supaya perilaku wajib di §11 ikut terlihat.
 */
export const INTENT_OUTPUT: IntentOutput = {
  tipe_3: "KAFE DAN RESTO",
  harga_target: 25000,
  harga_sumber: "perkiraan",
  confidence: 0.72,
};
