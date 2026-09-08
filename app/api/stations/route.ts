import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'
import { toStationsFeatureCollection, type StationRow } from '@/lib/station'

export async function GET() {
  // View `stasiun_kawasan`, BUKAN tabel `stasiun` langsung (supabase/views.sql).
  //
  // Tabel `stasiun` sendiri tidak butuh view — koordinatnya dua kolom angka biasa. Yang
  // memaksa view adalah kolom `isokron`: dia berasal dari `scored_areas.geom`, kolom geometry
  // PostGIS, dan PostgREST mengembalikan kolom geometry sebagai WKB hex kalau dibaca
  // langsung. Konversinya (`ST_AsGeoJSON`) wajib di sisi database.
  //
  // Satu endpoint ini melayani dua layer peta sekaligus:
  //   StationLayer   -> `geometry` (titik penanda stasiun)
  //   IsochroneLayer -> `properties.isokron` (poligon MAPID asli)
  // Digabung, bukan dipisah jadi /api/isochrones, karena datanya milik entitas yang sama dan
  // 43 poligon cuma menambah ~51 KB.
  const { data, error } = await supabaseServer
    .from('stasiun_kawasan')
    // Satu string literal, jangan dipecah dengan `+` — supabase-js membaca bentuk hasilnya
    // dari literal ini saat typecheck. Begitu digabung, tipenya jatuh ke GenericStringError[]
    // dan cast ke StationRow[] ditolak TypeScript.
    .select(
      'station_id, nama, tipe_3, kecamatan, kabkot, longitude, latitude, area_id, area_km2, is_rankable, isokron'
    )

  if (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil data stasiun' }, { status: 503 })
  }

  return NextResponse.json({ data: toStationsFeatureCollection((data ?? []) as StationRow[]) })
}
