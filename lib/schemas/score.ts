import { z } from 'zod'
import type { ScoredArea, ScoringResult } from '@/lib/scoring'

// Body yang dikirim client ke POST /api/score (context/context-mvp.md §6.8).
// `harga_sumber` sengaja opsional — kontrak MVP di dokumen cuma menyebut { tipe_3,
// harga_target }, tapi respons wajib mengembalikan `catatan.harga_sumber` (lihat contoh
// respons §6.8). Server tidak bisa tahu sumber harga tanpa klien mengirimnya balik dari hasil
// /api/prompt-request, jadi field ini diteruskan apa adanya kalau ada, default 'pengguna'
// kalau tidak dikirim.
//
// `tipe_3` dibangun DINAMIS dari `getTipe3Values()` (lib/tipe3.ts) — sama seperti
// IntentSchema (lib/schemas/prompt-request.ts) — bukan enum statis, supaya nilai yang
// diterima selalu cocok persis dengan isi kolom `competitor_counts`/`katalog_restoran`
// (context-mvp.md §6.8: "kalau enumnya beda ejaan, pencarian selalu bernilai 0").
export function buildScoreRequestSchema(tipe3Values: string[]) {
  return z.object({
    tipe_3: z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]]),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']).optional(),
  })
}

export type ScoreRequest = {
  tipe_3: string
  harga_target: number
  harga_sumber?: 'pengguna' | 'perkiraan'
}

// ---------------------------------------------------------------------------------------
// Bentuk RESPONS /api/score — SATU-SATUNYA definisi. types/scoring/index.ts (yang dipakai
// klien) cuma mengalias tipe di bawah ini, jadi server dan klien tidak bisa saling geser.
// Dulu keduanya didefinisikan terpisah dan sudah sempat berbeda (`skor: number` di klien vs
// `number | null` di server; `catatan` klien cuma punya 1 dari 6 field).
// ---------------------------------------------------------------------------------------

/**
 * Kawasan yang boleh masuk Top 5: `is_rankable` DAN skornya benar-benar terhitung. Di
 * lib/scoring `skor`/`demand`/`segment_match` bertipe `number | null` karena baris yang
 * pipeline-nya belum jalan ikut dihitung (skala persentil C butuh semuanya); untuk yang
 * dikirim ke klien, null tidak boleh lolos — kalau lolos, `area.skor.toLocaleString()` di
 * sidebar melempar galat.
 */
export type RankedArea = Omit<ScoredArea, 'skor' | 'komponen'> & {
  skor: number
  komponen: { demand: number; competitive_headroom: number; segment_match: number }
}

export function isRankedArea(area: ScoredArea): area is RankedArea {
  return (
    area.is_rankable &&
    area.skor !== null &&
    area.komponen.demand !== null &&
    area.komponen.segment_match !== null
  )
}

export type ScoreResponse = {
  /** Top 5, terurut skor desc, semuanya lolos `isRankedArea`. */
  areas: RankedArea[]
  catatan: ScoringResult['catatan'] & { harga_sumber: 'pengguna' | 'perkiraan' }
}
