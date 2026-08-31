# components/map/BaseMap.tsx

Client Component yang membuat **satu** instance `maplibregl.Map` (basemap MAPID MAPS) saat
komponen mount, sekali, dan membersihkannya (`map.remove()`) saat unmount. Ini fondasi
arsitektur peta di `CLAUDE.md` bagian 11 ("Basemap ≠ Layer") — komponen ini **hanya**
bertanggung jawab membuat map instance, tidak tahu-menahu soal layer produk (stasiun,
properti, isokron, dll).

## Cara pakai

```tsx
// app/page.tsx
import BaseMap from "@/components/map/BaseMap";

export default function Home() {
  return <BaseMap />;
}
```

Tidak menerima props sama sekali (disengaja — lihat Batasan/gotcha).

## Dependency/prasyarat

- Env var `NEXT_PUBLIC_MAPID_MAPS_KEY` (wajib, public — **beda** dari `MAPID_API_KEY`
  server-only, lihat `CLAUDE.md` bagian 4).
- Package `maplibre-gl`.
- Elemen DOM dengan `id="map"` harus punya tinggi eksplisit (di sini lewat inline style
  `height: '100%'`) — MapLibre GL tidak render apa pun kalau kontainernya tinggi 0.

## Batasan/gotcha

- **Wajib `'use client'`** — MapLibre GL butuh `window`/DOM, tidak bisa jalan di Server
  Component. Kalau nanti di-`dynamic()`-import, pastikan `{ ssr: false }` (lihat
  `CLAUDE.md` bagian 3).
- **Dilarang menerima prop berisi daftar layer** (`CLAUDE.md` bagian 11) — layer produk
  (stasiun, properti, isokron) wajib jadi komponen terpisah di `components/map/layers/*.tsx`
  yang mengambil map instance lewat `useMap()` dari `MapProvider`, **bukan** ditambahkan
  langsung di sini.
- **Status saat ini (belum ideal, tapi disengaja untuk tahap foundation):**
  `components/map/MapProvider.tsx` dan `components/map/layers/*` **belum dibuat**, jadi
  `BaseMap` masih berdiri sendiri, dipanggil langsung dari `app/page.tsx` tanpa Provider.
  Map instance yang dibuat `useEffect` ini **tidak dibagikan** ke komponen lain — begitu
  layer pertama (misal `StationLayer`) mulai dikerjakan, pola Provider/Context di
  `CLAUDE.md` bagian 11 **wajib** diikuti dari awal, jangan tambahkan `map.addLayer()`
  langsung di file ini "sementara".
- `center`/`zoom`/`pitch`/`bearing` di kode saat ini adalah **nilai statis untuk
  pengembangan** (bukan diturunkan dari data stasiun nyata) — belum ada mekanisme
  menyesuaikan viewport ke data yang di-fetch dari `/api/stations`.
- Style URL dibangun sebagai template string berisi `NEXT_PUBLIC_MAPID_MAPS_KEY` — kalau env
  var ini belum diset saat build/dev, hasilnya `?key=undefined` dan basemap gagal total
  (`AJAXError: Failed to fetch`, insiden nyata yang pernah terjadi — lihat riwayat `CLAUDE.md`
  bagian 4 soal regresi `MAPID_API_KEY` vs `NEXT_PUBLIC_MAPID_MAPS_KEY`).
