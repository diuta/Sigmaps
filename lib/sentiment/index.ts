import { supabaseServer } from '@/lib/supabase/server'
import { summarizeSentiment, type SentimentReport } from '@/lib/ai/summarizeSentiment'
import type { CommunitySentiment } from '@/lib/schemas/community-sentiment'

// Titik sentuh AI #5, dibungkus cache per station_id. Dipanggil app/api/community-sentiment.
//
// Kenapa di-cache: satu panggilan = 1,3–2,5 detik Gemini + kuota project yang dipakai bersama
// semua pengunjung, sementara masukannya (laporan community_activity + prompt tetap) tidak
// berubah di antara dua muatan batch. Sebelum ada cache ini, sidebar sengaja menahan panelnya
// tetap ter-mount hanya supaya hook-nya tidak memanggil ulang — bentuk komponen ditentukan
// oleh cache yang tidak ada. Pola cachenya sama dengan lib/tipe3 (TTL di memori proses).
//
// Yang di-cache adalah PROMISE-nya, bukan hasilnya: dua permintaan yang datang bersamaan untuk
// stasiun yang sama (dua tab, React StrictMode di dev yang memanggil efek dua kali) berbagi
// satu panggilan Gemini, bukan dua. Promise yang gagal dibuang dari cache supaya permintaan
// berikutnya mencoba lagi — galat Gemini (429/503) bersifat sementara.
//
// Batasan: cache hidup per proses. Di Vercel tiap instance hangat punya cachenya sendiri dan
// hilang saat cold start — cukup untuk menghapus seluruh pengulangan dalam satu sesi, bukan
// cache lintas instance. Kalau community_activity dimuat ulang (etl/load_activity.py),
// ringkasan lama bisa bertahan paling lama CACHE_TTL_MS.

/** Gagal membaca view community_activity_by_station — dipetakan route ke 503. */
export class SentimentSourceError extends Error {}

type Entry = { promise: Promise<CommunitySentiment>; expiresAt: number }
const cache = new Map<string, Entry>()

const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export function getCommunitySentiment(stationId: string): Promise<CommunitySentiment> {
  const hit = cache.get(stationId)
  if (hit && hit.expiresAt > Date.now()) return hit.promise

  const promise = loadAndSummarize(stationId).catch((error) => {
    // Hanya hapus kalau entri di cache masih milik promise ini — jangan menimpa percobaan
    // ulang yang sudah dimulai pemanggil lain.
    if (cache.get(stationId)?.promise === promise) cache.delete(stationId)
    throw error
  })

  cache.set(stationId, { promise, expiresAt: Date.now() + CACHE_TTL_MS })
  return promise
}

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
