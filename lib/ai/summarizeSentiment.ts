import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { CommunitySentimentSchema } from '@/lib/schemas/community-sentiment'

// Dua kelas galat ini dipetakan ke kode HTTP berbeda oleh
// app/api/community-sentiment/route.ts — jangan tangkap sebagai Error generik,
// harus `instanceof`. Polanya sama dengan lib/ai/parseIntent.ts.
//
// Bedanya penting bagi pengguna: "AI sedang penuh" itu sementara dan bisa
// dicoba lagi, sedangkan keluaran yang tidak bisa ditafsirkan tidak akan
// membaik dengan menunggu.
export class SentimentUnavailableError extends Error {}
export class SentimentValidationError extends Error {}

// Titik sentuh AI #5 (context/context-final.md §7.2, context/context-mvp.md §2 Langkah 3a).
// Sama seperti parseIntent.ts: generateText + JSON.parse manual + validasi Zod, bukan
// generateObject (keputusan tim, lihat lib/ai/parseIntent.ts).
const SYSTEM_PROMPT = `Kamu meringkas laporan warga (Community Activity) di kawasan sebuah stasiun transit jadi satu ringkasan singkat.
Balas HANYA dengan JSON valid, tanpa markdown/backtick, persis mengikuti bentuk ini:
{ "ringkasan": "ringkasan 2-4 kalimat tentang kondisi kawasan berdasarkan laporan yang diberikan" }
Jangan mengarang informasi di luar laporan yang diberikan (strict data grounding). Gunakan bahasa Indonesia.`

export type SentimentReport = {
  title: string
  description: string
  total_comment: number
  likes: number
}

export async function summarizeSentiment(reports: SentimentReport[]) {
  const payload = reports
    .map((r) => `- ${r.title}: ${r.description} (komentar: ${r.total_comment}, suka: ${r.likes})`)
    .join('\n')

  // geminiFlashLite, BUKAN geminiFlash. Meringkas selusin laporan pendek tidak
  // butuh model berat, dan kuota flash-lite jauh lebih longgar. Terukur
  // 7 September 2026: gemini-3.5-flash mengembalikan HTTP 429 pada seluruh
  // stasiun yang diuji — termasuk yang cuma punya 2 laporan — sementara
  // flash-lite jalan normal. lib/ai/parseIntent.ts memakai model yang sama.
  let text: string
  try {
    ;({ text } = await generateText({
      model: geminiFlashLite,
      system: SYSTEM_PROMPT,
      prompt: payload,
    }))
  } catch (error) {
    throw new SentimentUnavailableError('Gagal memanggil Gemini', { cause: error })
  }

  try {
    const parsed = CommunitySentimentSchema.parse(JSON.parse(text))
    return { ...parsed, jumlah_laporan: reports.length }
  } catch (error) {
    throw new SentimentValidationError('Keluaran Gemini tidak sesuai skema', { cause: error })
  }
}
