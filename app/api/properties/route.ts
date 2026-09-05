import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toPropertiesFeatureCollection, type PropertyRow } from '@/lib/properties'

export async function GET(request: Request) {
  const stationId = new URL(request.url).searchParams.get('station_id')

  if (!stationId) {
    return NextResponse.json({ error: 'station_id wajib diisi' }, { status: 400 })
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
