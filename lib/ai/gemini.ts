import { createGoogleGenerativeAI } from '@ai-sdk/google'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum diset di environment variable')
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Hanya flash-lite: kuota flash habis (429 di semua stasiun, 7 Sep 2026) — lihat
// lib/ai/summarizeSentiment.ts. Tambahkan model lain di sini kalau memang dipakai.
export const geminiFlashLite = google('gemini-3.5-flash-lite')
