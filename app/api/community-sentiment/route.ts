import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { CommunitySentimentQuerySchema } from '@/lib/schemas/community-sentiment'
import {
  summarizeSentiment,
  SentimentUnavailableError,
  SentimentValidationError,
  type SentimentReport,
} from '@/lib/ai/summarizeSentiment'

export async function GET(request: Request) {
  const stationId = new URL(request.url).searchParams.get('station_id')
  const parsed = CommunitySentimentQuerySchema.safeParse({ station_id: stationId })

  if (!parsed.success) {
    return NextResponse.json({ error: 'station_id wajib diisi' }, { status: 400 })
  }

  const { data, error } = await supabaseServer
    .from('community_activity_by_station')
    .select('title, description, total_comment, likes')
    .eq('station_id', parsed.data.station_id)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data community activity' }, { status: 503 })
  }

  const reports = (data ?? []) as SentimentReport[]

  // Kawasan tanpa laporan = kondisi normal (200), bukan galat — dan jangan panggil Gemini
  // kalau tidak ada isi (context-mvp.md §6.8b).
  if (reports.length === 0) {
    return NextResponse.json({ data: { ringkasan: '', jumlah_laporan: 0 } })
  }

  try {
    const summary = await summarizeSentiment(reports)
    return NextResponse.json({ data: summary })
  } catch (err) {
    console.error(err)

    // Dibedakan dengan `instanceof` supaya pesannya benar-benar memberi tahu
    // pengguna apa yang terjadi (context-mvp.md §6.8b). "Gagal memproses
    // ringkasan" menyembunyikan bahwa masalahnya sementara dan bisa dicoba lagi.
    if (err instanceof SentimentUnavailableError) {
      // Kuota Gemini berlaku per project, bukan per kunci — seluruh pengunjung
      // berbagi satu kuota. Peta, /api/stations, dan /api/score tetap jalan
      // tanpa endpoint ini (degradasi anggun).
      return NextResponse.json(
        { error: 'Layanan AI sedang penuh, gunakan filter manual' },
        { status: 503 }
      )
    }
    if (err instanceof SentimentValidationError) {
      return NextResponse.json(
        { error: 'Ringkasan tidak dapat ditafsirkan' },
        { status: 422 }
      )
    }

    return NextResponse.json({ error: 'Gagal memproses ringkasan' }, { status: 503 })
  }
}
