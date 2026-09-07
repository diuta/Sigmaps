import type { ScoreComponentKey } from "@/types/scoring";

/**
 * Kalimat penjelasan komponen skor.
 *
 * ⚠️ Dibangkitkan dari ambang batas nilai komponen, DI DALAM KODE.
 * Jangan pernah mengambil kalimat ini dari LLM: komponen skor adalah keluaran
 * deterministik (context-mvp.md §6), jadi penjelasannya harus dapat direproduksi persis.
 *
 * Kalimat di bawah mengikuti bentuk rumus aslinya, bukan tebakan intuitif:
 *
 * - D (§6.2) berasal dari `kondisi_tempat` (Sepi/Sedang/Ramai) — tingkat KERAMAIAN,
 *   bukan nilai belanja. Tidak ada data nominal transaksi di sumber mana pun (§7).
 *   D juga ditarik ke nilai netral 0,5 dengan kekuatan K = 8, jadi kawasan dengan
 *   sedikit pengamatan otomatis mendekat ke tengah.
 *
 * - C (§6.3) adalah kurva punuk: `C = maks(0, 1 − |x − 0,4| ÷ 0,6)`. Puncaknya di
 *   kepadatan menengah, BUKAN di kepadatan nol — tabel §6.3 memberi C = 0,33 untuk
 *   "tanpa pesaing, pasar belum terbukti" dan C = 0,00 untuk "paling sesak". Karena
 *   `/api/score` (§6.8) hanya mengirim nilai C dan tidak pernah mengirim x, nilai C
 *   yang rendah TIDAK dapat dibedakan antara "terlalu sesak" dan "belum ada pesaing".
 *   Kalimatnya wajib mengakui kedua kemungkinan itu, bukan memilih salah satu.
 *
 * - S (§6.4) membandingkan harga target dengan median harga kawasan.
 */

interface Band {
  /** Batas atas eksklusif. */
  below: number;
  kalimat: string;
}

const BANDS: Record<ScoreComponentKey, readonly Band[]> = {
  demand: [
    {
      below: 0.35,
      kalimat:
        "Tempat makan yang tercatat di kawasan ini lebih sering terpantau sepi daripada ramai.",
    },
    {
      below: 0.65,
      kalimat:
        "Tingkat keramaian tempat makan di kawasan ini berada di sekitar tengah, setara kawasan lain.",
    },
    {
      below: Infinity,
      kalimat:
        "Tempat makan yang tercatat di kawasan ini lebih sering terpantau ramai daripada sepi.",
    },
  ],
  competitive_headroom: [
    {
      below: 0.35,
      kalimat:
        "Kepadatan pesaing jauh dari titik paling ideal. Dari angka ini saja belum bisa dibedakan apakah kawasannya sudah terlalu sesak atau justru belum punya pesaing sehingga pasarnya belum terbukti.",
    },
    {
      below: 0.65,
      kalimat:
        "Kepadatan pesaing sudah bergeser dari titik paling ideal, tapi masih menyisakan ruang untuk pemain baru.",
    },
    {
      below: Infinity,
      kalimat:
        "Kepadatan pesaing mendekati titik paling ideal: cukup ramai untuk menunjukkan pasarnya hidup, belum sesak sampai menutup pemain baru.",
    },
  ],
  segment_match: [
    {
      below: 0.35,
      kalimat: "Harga yang Anda rencanakan jauh dari harga yang biasa dibayar di kawasan ini.",
    },
    {
      below: 0.65,
      kalimat: "Harga yang Anda rencanakan agak berbeda dari harga yang biasa dibayar di kawasan ini.",
    },
    {
      below: Infinity,
      kalimat: "Harga yang Anda rencanakan dekat dengan harga yang biasa dibayar di kawasan ini.",
    },
  ],
};

export const COMPONENT_LABELS: Record<ScoreComponentKey, string> = {
  demand: "Permintaan",
  competitive_headroom: "Ruang kompetisi",
  segment_match: "Kecocokan segmen harga",
};

/** Kekuatan tarikan ke nilai netral pada rumus D — context-mvp.md §6.2. */
const NEUTRAL_PULL_K = 8;

export function explainComponent(key: ScoreComponentKey, value: number): string {
  const bands = BANDS[key];
  const band = bands.find((b) => value < b.below);
  return band ? band.kalimat : bands[bands.length - 1].kalimat;
}

/**
 * Klausa tambahan untuk D bila pengamatannya sedikit: rumusnya menarik nilai ke 0,5,
 * jadi angka yang tampil sebagian bukan berasal dari kawasan itu sendiri.
 * Mengembalikan null bila pengamatan sudah melebihi kekuatan tarikan.
 */
export function explainNeutralPull(nObservations: number): string | null {
  if (nObservations > NEUTRAL_PULL_K) return null;

  return `Angka ini ditarik ke nilai tengah karena baru ada ${nObservations} pengamatan, kurang dari ${NEUTRAL_PULL_K} yang dipakai rumus sebagai penyeimbang.`;
}

/** Rentang nilai komponen yang teramati di seluruh kawasan yang dapat diperingkat. */
export interface ObservedRange {
  min: number;
  max: number;
}

export function observedRange(values: readonly number[]): ObservedRange | null {
  if (values.length === 0) return null;
  return { min: Math.min(...values), max: Math.max(...values) };
}
