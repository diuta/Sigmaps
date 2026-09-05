import { z } from 'zod'

// Body yang dikirim client ke POST /api/prompt-request.
export const PromptRequestSchema = z.object({
  prompt: z.string().min(1, 'prompt tidak boleh kosong'),
})

// Skema final MVP (context/context-final.md §7.2 titik #3, context/context-mvp.md §6.6).
// Mengganti total skema v1 (`kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`) —
// nama-nama itu sudah dilarang dipakai.
//
// `tipe_3` dibangun DINAMIS dari `getTipe3Values()` (lib/tipe3.ts), bukan enum statis —
// context-mvp.md §6.8b: "TIPE_3_VALUES wajib dihasilkan dari query
// (select distinct tipe_3 from katalog_restoran order by tipe_3), bukan diketik manual".
// Konsekuensinya skema ini tidak bisa jadi konstanta top-level lagi (nilai enum baru
// diketahui setelah query Supabase selesai), jadi dibungkus fungsi `buildIntentSchema`.
export function buildIntentSchema(tipe3Values: string[]) {
  return z.object({
    tipe_3: z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]]),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    confidence: z.number().min(0).max(1),
  })
}

// Tipe manual, bukan z.infer — enum tipe_3 dinamis jadi hasil infer-nya cuma `string`.
export type Intent = {
  tipe_3: string
  harga_target: number
  harga_sumber: 'pengguna' | 'perkiraan'
  confidence: number
}
