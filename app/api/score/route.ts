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

  // Tanpa join, tanpa filter kategori, tanpa agregasi, dan SENGAJA TANPA
  // .eq('is_rankable', true) — normalisasi min-max C butuh kepadatan terkecil &
  // terbesar di antara SELURUH kawasan (context-mvp.md §6.8).
  //
  // Menyaring is_rankable di sini pernah ada dan menghasilkan angka yang salah:
  // is_rankable mengukur ketebalan pengamatan Menu Go, yang urusan D dan S.
  // Data pesaing datang dari sensus yang lengkap tanpa peduli ada pengamatan
  // atau tidak, jadi menyaringnya membuang data pesaing yang valid dan
  // menggeser lo/hi. Pemotongan ke Top 5 dilakukan setelah perhitungan.
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

  // Hanya Top 5 yang keluar dari server. Pembatasan di frontend bukan batas
  // keamanan — apa pun yang dikirim backend terlihat di DevTools, berapa pun
  // yang dirender. Kawasan berperingkat di luar Top 5 tidak pernah dikirim.
  //
  // Konsekuensinya kawasan `is_rankable = false` juga tidak ikut terkirim,
  // sehingga peta belum dapat memberi label "data belum cukup" seperti diminta
  // §6.8. Penandanya diambil dari /api/stations (permintaan terbuka ke Jalur 1),
  // BUKAN dengan melonggarkan respons ini.
  const top5 = hasil.areas.filter((a) => a.is_rankable).slice(0, 5)

  return NextResponse.json({
    data: {
      areas: top5,
      catatan: { harga_sumber: harga_sumber ?? 'pengguna', ...hasil.catatan },
    },
  })
}
