import { createGoogleGenerativeAI } from '@ai-sdk/google'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY belum diset di environment variable')
}

const google = createGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
})

export const geminiFlashLite = google('gemini-3.5-flash-lite')
export const geminiFlash = google('gemini-3.5-flash')
