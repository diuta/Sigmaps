import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toStationsFeatureCollection, type StationRow } from '@/lib/station'

export async function GET() {
  // Tabel langsung, BUKAN view — beda dari /api/properties dan /api/community-sentiment.
  // Tabel `stasiun` menyimpan koordinat sebagai dua kolom angka biasa (longitude, latitude),
  // bukan kolom geometry PostGIS, jadi tidak ada spatial join atau ST_AsGeoJSON yang perlu
  // dieksekusi di database — penyusunan GeoJSON-nya murni di lib/stations.ts (lihat
  // docs/lib-stations.md).
  const { data, error } = await supabaseServer
    .from('stasiun')
    .select('station_id, nama, tipe_3, kecamatan, kabkot, longitude, latitude')

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data stasiun' }, { status: 503 })
  }

  return NextResponse.json({ data: toStationsFeatureCollection((data ?? []) as StationRow[]) })
}
