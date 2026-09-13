import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { CommunitySentimentSchema } from '@/lib/schemas/community-sentiment'

export class SentimentUnavailableError extends Error {}
export class SentimentValidationError extends Error {}

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
