import { z } from 'zod'

export const CommunitySentimentSchema = z.object({
  ringkasan: z.string(),
})

export type CommunitySentiment = z.infer<typeof CommunitySentimentSchema> & {
  jumlah_laporan: number
}

export const CommunitySentimentQuerySchema = z.object({
  station_id: z.string().min(1, 'station_id wajib diisi'),
})
