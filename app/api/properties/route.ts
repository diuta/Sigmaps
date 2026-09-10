import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toPropertiesFeatureCollection, type PropertyRow } from '@/lib/property'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const stationId = url.searchParams.get('station_id')
  const summary = url.searchParams.get('summary')

  // Mode ringkasan untuk filter lintas stasiun (e.g. cari stasiun yang punya Kos / Rumah / Ruko)
  if (summary === 'true' || stationId === 'all' || !stationId) {
    const { data, error } = await supabaseServer
      .from('properti_go_by_station')
      .select('id, station_id, kategori_properti, jenis_properti, foto_tampak_depan, foto_spanduk')

    if (error) {
      console.error(error)
      return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 503 })
    }

    return NextResponse.json({ data: data ?? [] })
  }

  const { data, error } = await supabaseServer
    .from('properti_go_by_station')
    .select('id, kategori_properti, jenis_properti, alamat, foto_tampak_depan, foto_spanduk, geom')
    .eq('station_id', stationId)

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data properti' }, { status: 503 })
  }

  return NextResponse.json({ data: toPropertiesFeatureCollection((data ?? []) as PropertyRow[]) })
}
