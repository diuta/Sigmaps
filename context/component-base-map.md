# components/map/BaseMap.tsx

Client Component yang membuat **satu** instance `maplibregl.Map` (basemap MAPID MAPS) saat
komponen mount, membagikannya ke seluruh layer lewat `MapInstanceProvider`, dan
membersihkannya (`map.remove()`) saat unmount. Ini fondasi arsitektur peta di `CLAUDE.md`
bagian 11 ("Basemap ≠ Layer") — komponen ini **hanya** bertanggung jawab atas map instance dan
kamera, tidak tahu-menahu isi layer produk (stasiun, properti, isokron).

Dua tugasnya persis:

1. Membuat instance MapLibre sekali, menaruhnya di context (`hooks/map/useMapInstance.tsx`).
2. Menggeser kamera (`flyTo`) saat `selectedStation` berubah — reaksi satu arah, sidebar tidak
   pernah memanggil `flyTo()` sendiri.

## Cara pakai

Layer dirender sebagai **children**; mereka baru di-mount setelah map siap (`'load'`), jadi
tiap layer boleh langsung memakai `useMapInstance()` tanpa mengecek `map === null` untuk
keperluan mount:

```tsx
// app/page.tsx (potongan)
<BaseMap>
  <IsochroneLayer />
  <PropertyLayer />
  <StationLayer />
</BaseMap>
```

`children` adalah satu-satunya prop. Urutan children menentukan urutan pemasangan layer, bukan
urutan gambar di peta — untuk marker HTML (`StationLayer`, `PropertyLayer`) urutan gambar
ditentukan DOM/z-index, untuk layer MapLibre (`IsochroneLayer`) ditentukan urutan `addLayer`.

Gaya peta dasar diambil dari `basemapStyleUrl(DEFAULT_BASEMAP_ID)`
([lib/fixtures/layers.ts](lib-fixtures.md)) — bukan URL yang ditulis langsung di file ini.

## Dependency/prasyarat

- Env var `NEXT_PUBLIC_MAPID_MAPS_KEY` (wajib, public — **beda** dari `MAPID_API_KEY`
  server-only, lihat `CLAUDE.md` bagian 4). Dibaca di `lib/fixtures/layers.ts`, bukan di sini.
- Package `maplibre-gl` (CSS-nya di-import di file ini: `maplibre-gl/dist/maplibre-gl.css`).
- Provider `SelectedStationProvider` ([hooks](hooks.md)) wajib membungkus komponen ini —
  `BaseMap` memanggil `useSelectedStation()` dan hook itu `throw` di luar provider-nya.
- Kontainer induk wajib punya tinggi nyata; di `app/page.tsx` itu datang dari `h-screen` di
  `<main>` dan `flex-1` di pembungkus peta.

## Batasan/gotcha

- **Wajib `'use client'`** — MapLibre butuh `window`/DOM. Kalau nanti di-`dynamic()`-import,
  pastikan `{ ssr: false }` (`CLAUDE.md` bagian 3).
- **Dilarang menerima prop berisi daftar layer** (`CLAUDE.md` bagian 11). `children` bukan
  pelanggaran aturan itu: BaseMap tidak tahu apa isinya, tidak membacanya, dan tidak pernah
  memanggil `map.addLayer()` untuk mereka — tiap layer menambahkan dirinya sendiri.
- **Kontainer 0×0 saat efek pertama — insiden nyata.** Pada render pertama, flex layout belum
  memberi ukuran final ke kontainer, dan MapLibre yang dikonstruksi dari kontainer 0×0 **tidak
  pernah** memicu event `'load'`. Akibatnya canvas terkunci di ukuran fallback 400×300
  sementara marker dihitung dari ukuran kontainer sungguhan → marker "melayang" di luar peta.
  Perbaikannya: `ResizeObserver` dipasang ke instance **mentah** begitu dibuat, bukan digantung
  ke `map.on('load')` atau ke state `map`. Jangan pindahkan pemasangan observer itu ke dalam
  handler `'load'` — itu persis bug yang sudah diperbaiki.
- **Instance disimpan di `useState`, bukan hanya `useRef`.** Nilainya dipakai saat render
  (dioper ke `MapInstanceProvider`), dan membaca `ref.current` saat render tidak dijamin React.
- `setMap` baru dipanggil **setelah** `'load'`, jadi `children` tidak ter-mount sebelum peta
  siap. Kalau map gagal `load` (mis. key basemap salah → `?key=undefined`), seluruh layer diam
  tanpa galat yang kelihatan — cek tab Network untuk `style.json` yang gagal.
- ⚠️ **Penyimpangan dari `CLAUDE.md` bagian 11:** aturan menyebut context map hidup di
  `components/map/MapProvider.tsx`. Di kode sekarang context-nya ada di
  `hooks/map/useMapInstance.tsx` (`MapInstanceProvider` + `useMapInstance`), mengikuti
  `docs/fe/ARCHITECTURE.md` §4.2. Fungsinya sama persis; yang berbeda hanya lokasi filenya.
- `center`/`zoom`/`pitch`/`bearing` awal adalah nilai statis Jakarta
  (`[106.8271129, -6.1754398]`, zoom 13) — bukan diturunkan dari sebaran data `/api/stations`.
  Kamera baru menyesuaikan data setelah user memilih satu stasiun.
