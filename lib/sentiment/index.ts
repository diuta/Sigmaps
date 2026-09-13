import { supabaseServer } from '@/lib/supabase/server'
import { summarizeSentiment, type SentimentReport } from '@/lib/ai/summarizeSentiment'
import type { CommunitySentiment } from '@/lib/schemas/community-sentiment'
import { memoTtl } from '@/helper/memo-ttl'

// Titik sentuh AI #5, dibungkus cache per station_id. Dipanggil app/api/community-sentiment.
//
// Kenapa di-cache: satu panggilan = 1,3–2,5 detik Gemini + kuota project yang dipakai bersama
// semua pengunjung, sementara masukannya (laporan community_activity + prompt tetap) tidak
// berubah di antara dua muatan batch. Sebelum ada cache ini, sidebar sengaja menahan panelnya
// tetap ter-mount hanya supaya hook-nya tidak memanggil ulang — bentuk komponen ditentukan
// oleh cache yang tidak ada. Pola cachenya sama dengan lib/tipe3 (TTL di memori proses).
//
// Cache-nya helper/memo-ttl (promise per station_id): permintaan bersamaan berbagi satu
// panggilan Gemini; yang gagal dibuang supaya percobaan berikutnya mengulang (429/503 sementara).
//
// Batasan: cache hidup per proses. Di Vercel tiap instance hangat punya cachenya sendiri dan
// hilang saat cold start — cukup untuk menghapus seluruh pengulangan dalam satu sesi, bukan
// cache lintas instance. Kalau community_activity dimuat ulang (etl/load_activity.py),
// ringkasan lama bisa bertahan paling lama 6 jam.

/** Gagal membaca view community_activity_by_station — dipetakan route ke 503. */
export class SentimentSourceError extends Error {}

export const getCommunitySentiment = memoTtl(loadAndSummarize, 6 * 60 * 60 * 1000)

async function loadAndSummarize(stationId: string): Promise<CommunitySentiment> {
  const { data, error } = await supabaseServer
    .from('community_activity_by_station')
    .select('title, description, total_comment, likes')
    .eq('station_id', stationId)

  if (error) {
    throw new SentimentSourceError(`Gagal mengambil community activity: ${error.message}`, {
      cause: error,
    })
  }

  const reports = (data ?? []) as SentimentReport[]

  // Kawasan tanpa laporan = kondisi normal, bukan galat — dan jangan panggil Gemini kalau
  // tidak ada isi (context-mvp.md §6.8b). Ikut di-cache: jawabannya sama stabilnya.
  if (reports.length === 0) {
    return { ringkasan: '', jumlah_laporan: 0 }
  }

  return summarizeSentiment(reports)
}
