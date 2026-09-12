# lib/tipe3.ts

Sumber tunggal daftar `TIPE_3` (kategori restoran), dibaca langsung dari Supabase — bukan
diketik manual di kode. Dipakai untuk membangun enum Zod dinamis di
[api-prompt-request.md](api-prompt-request.md) (`buildIntentSchema`) dan
[api-score.md](api-score.md) (`buildScoreRequestSchema`), serta daftar pilihan yang dikirim
ke Gemini di prompt `lib/ai/parseIntent.ts`.

## Cara pakai

```ts
import { getTipe3Values } from '@/lib/tipe3'

const tipe3Values = await getTipe3Values()
// ['CEPAT SAJI', 'KAFE DAN RESTO', 'SEAFOOD', ...] — TANPA 'SEMUA', tambahkan sendiri di
// pemanggil kalau perlu (mis. z.enum([...tipe3Values, 'SEMUA']))
```

## Dependency/prasyarat

- [lib/supabase/server.ts](lib-supabase-server.md).
- View `tipe3_values` di `supabase/views.sql` (`select distinct tipe_3 from
  katalog_restoran order by tipe_3`) — wajib sudah dijalankan di project Supabase.
- Tabel `katalog_restoran` sudah terisi.

## Batasan/gotcha

- **Di-cache in-memory 10 menit** per instance server — `katalog_restoran` adalah sensus
  statis (Q4 2023, tidak bertambah lagi, lihat `context/dokumentasi-erd-mvp.md` bagian 4),
  jadi cache ini murni menghindari query berulang, bukan trade-off kesegaran data yang
  berarti. Cache **tidak** dibagi antar instance serverless (tiap cold start mulai kosong
  lagi) — ini normal, bukan bug.
- **Tidak menyertakan `'SEMUA'`** — nilai itu bukan isi tabel asli, jadi ditambahkan manual
  oleh pemanggil (`buildIntentSchema`, `buildScoreRequestSchema`).
- Kalau Supabase/view belum ada, fungsi ini **throw** (bukan balik array kosong) — caller
  (`route.ts`) wajib menangkapnya dan balas `503`, bukan `400`, karena ini kegagalan
  infrastruktur, bukan input pengguna yang salah.
- **Ganti fungsi ini kalau butuh query beda** (mis. filter per kota) — jangan tulis
  `select distinct tipe_3 ...` versi kedua di file lain, supaya tidak ada dua sumber
  kebenaran untuk enum yang sama.
