import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toPropertiesFeatureCollection, type PropertyRow } from '@/lib/property'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const stationId = url.searchParams.get('station_id')
  const summary = url.searchParams.get('summary')

  if (summary === 'true' || stationId === 'all' || !stationId) {
    const { data, error } = await supabaseServer
      .from('properti_go_by_station')
      .select('id, station_id, kategori_properti, jenis_properti, alamat, foto_tampak_depan, foto_spanduk, jarak_jalan_m, waktu_jalan_s')

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 503 })
    }

    return NextResponse.json({ data: data ?? [] })
  }

  const { data, error } = await supabaseServer
    .from('properti_go_by_station')
    .select(
      'id, kategori_properti, jenis_properti, alamat, foto_tampak_depan, foto_spanduk, geom, jarak_jalan_m, waktu_jalan_s, rute'
    )
    .eq('station_id', stationId)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 503 })
  }

  return NextResponse.json({ data: toPropertiesFeatureCollection((data ?? []) as PropertyRow[]) })
}
