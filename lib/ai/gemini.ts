import { createGoogleGenerativeAI } from '@ai-sdk/google'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum diset di environment variable')
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

// Nama model wajib bisa di-override lewat env var, bukan hardcode (context/context-final.md
// §7.2: "Nama model wajib di environment variable, Google merotasi model cepat") — default di
// bawah cuma dipakai kalau env var tidak diset, bukan berarti override-nya opsional dilewati.
export const geminiFlashLite = google(process.env.GEMINI_MODEL_FLASH_LITE || 'gemini-3.5-flash-lite')
export const geminiFlash = google(process.env.GEMINI_MODEL_FLASH || 'gemini-3.5-flash')
