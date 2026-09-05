import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { buildScoreRequestSchema } from '@/lib/schemas/score'
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

  // Tanpa join, tanpa filter kategori, tanpa agregasi — normalisasi min-max C butuh nilai
  // terkecil & terbesar di antara SEMUA kawasan (context-mvp.md §6.8).
  const { data, error } = await supabaseServer
    .from('scored_areas')
    .select(
      'area_id, station_id, station_name, area_km2, demand, price_median, competitor_counts, total_restaurants, n_observations, n_price'
    )
    .eq('is_rankable', true)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data skor' }, { status: 503 })
  }

  const areas = scoreAreas((data ?? []) as ScoredAreaRow[], tipe_3, harga_target)

  return NextResponse.json({
    data: {
      areas,
      catatan: { harga_sumber: harga_sumber ?? 'pengguna' },
    },
  })
}
