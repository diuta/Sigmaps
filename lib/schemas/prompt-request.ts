import { z } from 'zod'

// Nama field `teks` mengikuti context-mvp.md §2, bukan `text` atau `prompt`.
export const PromptRequestSchema = z.object({
  teks: z.string().min(1, 'teks tidak boleh kosong'),
})

// TIDAK ADA TIPE_3_VALUES hardcoded di sini, dan jangan ditambahkan. Daftar sah
// selalu dari getTipe3Values() (view tipe3_values) — versi lama berkas ini memuat
// empat nilai karangan berkapitalisasi judul yang tidak cocok dengan sensus.
//
// 'SEMUA' wajib ikut: penanda "jangan saring kategori", tidak ada di sensus.
// Tanpa pengecualian ini jalur fallback ditolak validasinya sendiri.
function tipe3Enum(tipe3Values: string[]) {
  return z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]])
}

/** Bentuk mentah dari Gemini. `is_kuliner` dipakai untuk menolak, lalu dibuang. */
export function buildGeminiRawSchema(tipe3Values: string[]) {
  return z.object({
    is_kuliner: z.boolean(),
    tipe_3: tipe3Enum(tipe3Values),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    confidence: z.number().min(0).max(1),
  })
}

/** §6.6. Tidak ada field null — alur one-shot tidak boleh berhenti di tengah. */
export function buildIntentSchema(tipe3Values: string[]) {
  return z.object({
    tipe_3: tipe3Enum(tipe3Values),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    /** Tidak masuk rumus. Jangan dipakai memblokir apa pun. */
    confidence: z.number().min(0).max(1),
  })
}

export type Intent = {
  tipe_3: string
  harga_target: number
  harga_sumber: 'pengguna' | 'perkiraan'
  confidence: number
}
