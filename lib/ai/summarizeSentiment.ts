import { generateText } from 'ai'
import { geminiFlash } from '@/lib/ai/gemini'
import { CommunitySentimentSchema } from '@/lib/schemas/community-sentiment'

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

  const { text } = await generateText({
    model: geminiFlash,
    system: SYSTEM_PROMPT,
    prompt: payload,
  })

  const parsed = CommunitySentimentSchema.parse(JSON.parse(text))
  return { ...parsed, jumlah_laporan: reports.length }
}
