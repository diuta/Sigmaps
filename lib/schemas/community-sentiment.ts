import { z } from 'zod'

// Skema baru untuk titik sentuh AI #5 (context/context-final.md §7.2 titik #5) — dokumen
// menandai skema ini ❓ belum diputuskan (schema baru vs generalisasi dari InsightSchema).
// InsightSchema (titik #4) di luar scope MVP, jadi dibuat skema terpisah, minimal:
// satu ringkasan teks dari Gemini + jumlah laporan yang dipakai (metadata, bukan dari AI).
export const CommunitySentimentSchema = z.object({
  ringkasan: z.string(),
})

export type CommunitySentiment = z.infer<typeof CommunitySentimentSchema> & {
  jumlah_laporan: number
}

export const CommunitySentimentQuerySchema = z.object({
  station_id: z.string().min(1, 'station_id wajib diisi'),
})
