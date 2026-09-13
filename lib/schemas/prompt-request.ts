import { z } from 'zod'

export const PromptRequestSchema = z.object({
  teks: z.string().min(1, 'teks tidak boleh kosong'),
})

function tipe3Enum(tipe3Values: string[]) {
  return z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]])
}

export function buildGeminiRawSchema(tipe3Values: string[]) {
  return z.object({
    is_kuliner: z.boolean(),
    tipe_3: tipe3Enum(tipe3Values),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    confidence: z.number().min(0).max(1),
  })
}

export type Intent = {
  tipe_3: string
  harga_target: number
  harga_sumber: 'pengguna' | 'perkiraan'
  confidence: number
}
