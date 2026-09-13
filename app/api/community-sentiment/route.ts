import { NextResponse } from 'next/server'
import { CommunitySentimentQuerySchema } from '@/lib/schemas/community-sentiment'
import { getCommunitySentiment, SentimentSourceError } from '@/lib/sentiment'
import {
  SentimentUnavailableError,
  SentimentValidationError,
} from '@/lib/ai/summarizeSentiment'

export async function GET(request: Request) {
  const stationId = new URL(request.url).searchParams.get('station_id')
  const parsed = CommunitySentimentQuerySchema.safeParse({ station_id: stationId })

  if (!parsed.success) {
    return NextResponse.json({ error: 'station_id wajib diisi' }, { status: 400 })
  }

  try {
    const summary = await getCommunitySentiment(parsed.data.station_id)
    return NextResponse.json({ data: summary })
  } catch (err) {
    console.error(err)

    if (err instanceof SentimentSourceError) {
      return NextResponse.json({ error: 'Gagal mengambil data community activity' }, { status: 503 })
    }
    if (err instanceof SentimentUnavailableError) {
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
