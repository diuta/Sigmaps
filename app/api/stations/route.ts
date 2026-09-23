import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toStationsFeatureCollection, type StationRow } from '@/lib/station'

export async function GET() {
  // Dua query: stasiun_kawasan tidak mengekspos competitor_counts (view-nya ada
  // untuk ST_AsGeoJSON), dan scored_areas adalah tabel biasa yang memang sudah
  // dibaca langsung oleh app/api/score. Digabung di sini supaya AreaGapBlock
  // tidak perlu endpoint sendiri — /api/stations sudah di-cache 10 menit.
  const [stasiun, pesaing] = await Promise.all([
    supabaseServer
      .from('stasiun_kawasan')
      .select(
        'station_id, nama, tipe_3, kecamatan, kabkot, longitude, latitude, area_id, area_km2, is_rankable, isokron'
      ),
    supabaseServer.from('scored_areas').select('station_id, competitor_counts'),
  ])

  if (stasiun.error) {
    console.error(stasiun.error)
    return NextResponse.json({ error: 'Gagal mengambil data stasiun' }, { status: 503 })
  }

  // Sengaja TIDAK fatal: sensus pesaing hanya bahan AreaGapBlock. Gagal di sini
  // berarti blok itu tidak muncul, sementara peta dan isokron tetap jalan.
  if (pesaing.error) console.error(pesaing.error)

  const counts = new Map(
    (pesaing.data ?? []).map((r) => [
      r.station_id as string,
      r.competitor_counts as Record<string, number> | null,
    ])
  )

  const rows = (stasiun.data ?? []).map((row) => ({
    ...row,
    competitor_counts: counts.get((row as { station_id: string }).station_id) ?? null,
  })) as StationRow[]

  return NextResponse.json({ data: toStationsFeatureCollection(rows) })
}
