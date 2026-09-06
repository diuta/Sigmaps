import { z } from 'zod'

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
