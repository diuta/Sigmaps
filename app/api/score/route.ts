import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { buildScoreRequestSchema, isRankedArea, type ScoreResponse } from '@/lib/schemas/score'
import { scoreAreas, type ScoredAreaRow } from '@/lib/scoring'
import { getTipe3Values } from '@/lib/tipe3'

export async function POST(request: Request) {
  const body = await request.json()

  let tipe3Values: string[]
  try {
    tipe3Values = await getTipe3Values()
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil daftar kategori usaha' }, { status: 503 })
  }

  const parsed = buildScoreRequestSchema(tipe3Values).safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
  }

  const { tipe_3, harga_target, harga_sumber } = parsed.data

  const { data, error } = await supabaseServer
    .from('scored_areas')
    .select(
      'area_id, station_id, station_name, area_km2, demand, price_median, competitor_counts, total_restaurants, n_observations, n_price, is_rankable'
    )

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data skor' }, { status: 503 })
  }

  let hasil: ReturnType<typeof scoreAreas>
  try {
    hasil = scoreAreas((data ?? []) as ScoredAreaRow[], tipe_3, harga_target)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Kategori usaha tidak dikenali' }, { status: 400 })
  }

  const top5 = hasil.areas.filter(isRankedArea).slice(0, 5)

  const respons: ScoreResponse = {
    areas: top5,
    catatan: { harga_sumber: harga_sumber ?? 'pengguna', ...hasil.catatan },
  }
  return NextResponse.json({ data: respons })
}
