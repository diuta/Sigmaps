import { createGoogleGenerativeAI } from '@ai-sdk/google'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum diset di environment variable')
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Model wajib lewat env var, bukan hardcode — Google merotasi model cepat (lihat CLAUDE.md #4).
// Default di bawah sempat gemini-2.5-*, tapi per 3 Sept 2026 model itu sudah 404 untuk API
// key baru ("no longer available to new users") — diganti ke gemini-3.5-* setelah dites
// langsung ke API dan berhasil.
export const geminiFlashLite = google(process.env.GEMINI_MODEL_FLASH_LITE ?? 'gemini-3.5-flash-lite')
export const geminiFlash = google(process.env.GEMINI_MODEL_FLASH ?? 'gemini-3.5-flash')
