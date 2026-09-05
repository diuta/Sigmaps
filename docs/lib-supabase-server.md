# lib/supabase/server.ts

Satu-satunya titik pembuatan Supabase client sisi server (CLAUDE.md #5), pakai service role
key (melewati RLS). Semua `route.ts` yang butuh baca/tulis Supabase wajib import dari sini,
jangan bikin `createClient()` baru di file lain.

## Cara pakai

```ts
import { supabaseServer } from '@/lib/supabase/server'

const { data, error } = await supabaseServer.from('scored_areas').select('*').eq('is_rankable', true)
```

Untuk query yang butuh spatial join (`ST_Within`) atau konversi geometry PostGIS ke GeoJSON,
tetap pakai `.from().select()` biasa, tapi menunjuk ke **SQL view** (bukan tabel mentah) yang
sudah membungkus join/konversinya (lihat `supabase/views.sql` dan
[api-properties.md](api-properties.md)):

```ts
const { data, error } = await supabaseServer
  .from('properti_go_by_station')
  .select('id, kategori_properti, jenis_properti, alamat, foto_tampak_depan, foto_spanduk, geom')
  .eq('station_id', stationId)
```

⚠️ Bukan semua tabel butuh view — kalau kolomnya sudah angka biasa (bukan geometry PostGIS)
dan tidak ada join, query tabel langsung dan susun bentuknya di TypeScript (lihat
`app/api/stations/route.ts` + [lib-stations.md](lib-stations.md), yang sengaja **tidak**
lewat view).

## Dependency/prasyarat

- Env var `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (wajib, server-only).
- Package `@supabase/supabase-js`.
- Keenam tabel MVP (lihat `context/dokumentasi-erd-mvp.md`) dan view-view di
  `supabase/views.sql` sudah dibuat di project Supabase, plus GRANT `service_role` di file
  yang sama — endpoint yang memanggilnya akan balas `503` kalau belum.

## Batasan/gotcha

- **Server-only.** Jangan pernah import dari Client Component — key ini melewati RLS
  sepenuhnya, akses penuh ke seluruh tabel.
- Modul ini `throw` saat di-import kalau env var belum diset (fail-fast, sama seperti pola
  `lib/ai/gemini.ts`) — ini yang menyebabkan `next build`/`next dev` gagal total kalau
  `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` belum ada di `.env.local`, bukan cuma endpoint
  yang memakainya.
- RLS aktif tanpa policy mengembalikan nol baris **tanpa** pesan galat — kalau
  `supabaseServer.from(...)` selalu balik array kosong padahal tabel ada isinya, cek policy
  `SELECT` publiknya dulu (`context/dokumentasi-erd-mvp.md` bagian "Keamanan").
