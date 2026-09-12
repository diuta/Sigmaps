/**
 * types/scoring/index.ts
 * Kontrak request/response /api/score untuk sisi klien — cerminan context/context-mvp.md §6.8.
 *
 * SEMUA tipe di sini hanya ALIAS dari lib/schemas/score.ts (yang diturunkan dari lib/scoring),
 * jadi bentuk yang dilihat klien selalu persis bentuk yang dikirim server. Jangan definisikan
 * ulang field di sini — versi lama berkas ini menyalin bentuknya dan sempat berbeda dari server
 * (`skor: number` vs `number | null`; `catatan` cuma punya `harga_sumber`, padahal server
 * mengirim `kelompok_dinilai`, `fallback_ke_semua`, `kawasan_berisi`, `kawasan_diperingkat`,
 * `total_kawasan` juga).
 *
 * Impor di sini `import type` semua, jadi tidak ada kode server (zod, lib/scoring) yang ikut
 * ke bundle klien.
 */

import type {
  RankedArea,
  ScoreRequest as ScoreRequestContract,
  ScoreResponse as ScoreResponseContract,
} from "@/lib/schemas/score";

export type ScoreRequest = ScoreRequestContract;

/**
 * Satu kawasan di Top 5. `skor` 0–100 = 100 × (0.25·D + 0.50·C + 0.25·S); `komponen` masing-
 * masing 0–1; `bobot` tetap dari server (`lib/scoring` WEIGHTS), tidak dikirim klien.
 * Selalu `is_rankable: true` dan tidak ada nilai null — route menyaringnya (`isRankedArea`).
 */
export type AreaScore = RankedArea;

export type ScoreComponentKey = keyof AreaScore["komponen"];

/**
 * `areas`: Top 5 kawasan is_rankable, terurut skor desc (dipotong di server).
 * `catatan.harga_sumber` 'perkiraan' → tampilkan peringatan "harga tidak disebutkan, kami
 * perkirakan..."; field `catatan` lainnya menjelaskan kelompok kategori yang dinilai dan
 * apakah terjadi fallback ke 'SEMUA' (lihat docs/api-score.md).
 */
export type ScoreResponse = ScoreResponseContract;
