import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { buildGeminiRawSchema, type Intent } from '@/lib/schemas/prompt-request'
import { daftarUntukPrompt, HARGA_DEFAULT } from '@/lib/tipe3/padanan'

export class NonCulinaryError extends Error {}
export class IntentValidationError extends Error {}
export class GeminiUnavailableError extends Error {}

function buildSystemPrompt(tipe3Values: string[]): string {
  return `Kamu mengubah kalimat bebas rencana usaha jadi JSON.
Balas HANYA dengan JSON valid, tanpa markdown/backtick, persis mengikuti bentuk ini:
{
  "is_kuliner": true kalau usaha yang disebut usaha makanan/minuman, false kalau bukan sama sekali (misal laundry, bengkel, salon, toko baju),
  "tipe_3": salah satu nama kategori pada daftar di bawah, atau "SEMUA" — isi "SEMUA" kalau is_kuliner true tapi jenis kulinernya tidak disebut jelas; kalau is_kuliner false, isi "SEMUA" juga (tidak dipakai kalau ditolak),
  "harga_target": angka rupiah antara 1000 dan 1000000,
  "harga_sumber": "pengguna" kalau user menyebut harga eksplisit, atau "perkiraan" kalau kamu memakai perkiraan harga dari daftar,
  "confidence": angka 0-1 seberapa yakin kamu terhadap tipe_3
}

Daftar kategori yang sah, beserta contoh sebutannya dan perkiraan harga per porsi:
${daftarUntukPrompt(tipe3Values)}

Aturan pengisian:
- "tipe_3" WAJIB ditulis persis seperti nama kategori di daftar, huruf kapital semua. Jangan mengarang nama lain.
- Kalau pengguna MENYEBUT harga, pakai angka pengguna dan isi "harga_sumber": "pengguna".
- Kalau pengguna TIDAK menyebut harga, pakai perkiraan harga kategori yang kamu pilih dari daftar di atas APA ADANYA, dan isi "harga_sumber": "perkiraan". Jangan menebak angka sendiri.
- Kalau "tipe_3" bernilai "SEMUA" dan harga tidak disebut, pakai ${HARGA_DEFAULT}.`
}

export async function parseIntent(prompt: string, tipe3Values: string[]): Promise<Intent> {
  let text: string
  try {
    ;({ text } = await generateText({
      model: geminiFlashLite,
      system: buildSystemPrompt(tipe3Values),
      prompt: prompt,
    }))
  } catch (error) {
    throw new GeminiUnavailableError('Gagal memanggil Gemini', { cause: error })
  }

  let raw: { tipe_3: string; harga_target: number; harga_sumber: 'pengguna' | 'perkiraan'; confidence: number; is_kuliner: boolean }
  try {
    raw = buildGeminiRawSchema(tipe3Values).parse(JSON.parse(text))
  } catch (error) {
    throw new IntentValidationError('Hasil Gemini tidak sesuai skema yang diharapkan', { cause: error })
  }

  if (!raw.is_kuliner) {
    throw new NonCulinaryError('Usaha yang disebut bukan usaha kuliner')
  }

  return {
    tipe_3: raw.tipe_3,
    harga_target: raw.harga_target,
    harga_sumber: raw.harga_sumber,
    confidence: raw.confidence,
  }
}
