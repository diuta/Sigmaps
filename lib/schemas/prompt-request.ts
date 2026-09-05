import { z } from 'zod'

// Body yang dikirim client ke POST /api/prompt-request.
export const PromptRequestSchema = z.object({
  prompt: z.string().min(1, 'prompt tidak boleh kosong'),
})

// PLACEHOLDER — wajib diganti hasil query nyata begitu tabel `katalog_restoran` ada di
// Supabase: `select distinct tipe_3 from katalog_restoran order by tipe_3` (lihat
// context/context-mvp.md §6.6 & §6.8). Jangan diketik manual permanen.
export const TIPE_3_VALUES = [
  'Restoran Padang',
  'Warung Nasi',
  'Kedai Kopi',
  'Restoran Cepat Saji',
] as const

// Skema final MVP (context/context-final.md §7.2 titik #3, context/context-mvp.md §6.6).
// Mengganti total skema v1 (`kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`) —
// nama-nama itu sudah dilarang dipakai.
export const IntentSchema = z.object({
  tipe_3: z.enum([...TIPE_3_VALUES, 'SEMUA']),
  harga_target: z.number().int().min(1000).max(1_000_000),
  harga_sumber: z.enum(['pengguna', 'perkiraan']),
  confidence: z.number().min(0).max(1),
})

export type Intent = z.infer<typeof IntentSchema>
