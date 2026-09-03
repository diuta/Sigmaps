import { z } from 'zod'

// Body yang dikirim client ke POST /api/prompt-request.
export const PromptRequestSchema = z.object({
  teks: z.string().min(1, 'teks tidak boleh kosong'),
})

// PLACEHOLDER — skema hasil parse Gemini (arketipe+bobot) masih didiskusikan tim,
// lihat context/context-final.md §7.2 titik #3 (IntentSchema: kategori_usaha, target_jam,
// segmen, skala, weights, confidence). Field di bawah cuma supaya route bisa dites
// end-to-end; wajib diganti begitu skema final disepakati — jangan dianggap final.
export const IntentSchema = z.object({
  kategori_usaha: z.string(),
})
