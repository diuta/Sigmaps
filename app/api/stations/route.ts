import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toStationsFeatureCollection, type StationRow } from '@/lib/station'

export async function GET() {
  const { data, error } = await supabaseServer
    .from('stasiun_kawasan')
    .select(
      'station_id, nama, tipe_3, kecamatan, kabkot, longitude, latitude, area_id, area_km2, is_rankable, isokron'
    )

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data stasiun' }, { status: 503 })
  }

  return NextResponse.json({ data: toStationsFeatureCollection((data ?? []) as StationRow[]) })
}
