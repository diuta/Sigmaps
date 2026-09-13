import { supabaseServer } from '@/lib/supabase/server'
import { summarizeSentiment, type SentimentReport } from '@/lib/ai/summarizeSentiment'
import type { CommunitySentiment } from '@/lib/schemas/community-sentiment'
import { memoTtl } from '@/helper/memo-ttl'

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

  if (reports.length === 0) {
    return { ringkasan: '', jumlah_laporan: 0 }
  }

  return summarizeSentiment(reports)
}
