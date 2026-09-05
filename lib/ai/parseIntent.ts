import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { IntentSchema, TIPE_3_VALUES, type Intent } from '@/lib/schemas/prompt-request'

// generateObject sengaja tidak dipakai — instruksi tim, lihat riwayat diskusi.
// Struktur dipaksa lewat prompt, lalu divalidasi manual pakai IntentSchema (CLAUDE.md #6:
// output Gemini wajib divalidasi Zod sebelum dipakai).
const SYSTEM_PROMPT = `Kamu mengubah kalimat bebas rencana usaha kuliner jadi JSON.
Balas HANYA dengan JSON valid, tanpa markdown/backtick, persis mengikuti bentuk ini:
{
  "tipe_3": salah satu dari [${TIPE_3_VALUES.map((v) => `"${v}"`).join(', ')}, "SEMUA"],
  "harga_target": angka rupiah antara 1000 dan 1000000,
  "harga_sumber": "pengguna" kalau user menyebut harga eksplisit, atau "perkiraan" kalau kamu menebak dari jenis usaha,
  "confidence": angka 0-1 seberapa yakin kamu terhadap tipe_3
}
Kalau usaha yang disebut bukan kuliner atau tidak jelas jenisnya, tetap balas JSON dengan tipe_3 "SEMUA".`

export async function parseIntent(prompt: string): Promise<Intent> {
  const { text } = await generateText({
    model: geminiFlashLite,
    system: SYSTEM_PROMPT,
    prompt: prompt,
  })

  return IntentSchema.parse(JSON.parse(text))
}
