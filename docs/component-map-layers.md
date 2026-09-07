# components/map/layers/*, LayerPanel, dev/DevToolsOverlay

Semua yang digambar **di atas** basemap. Tiap layer adalah komponen sendiri yang mengambil map
instance lewat `useMapInstance()` dan menambahkan dirinya sendiri — `BaseMap` tidak pernah tahu
isi layer (`CLAUDE.md` bagian 11, lihat [component-base-map.md](component-base-map.md)).

| File | Isi | Teknik |
|---|---|---|
| `layers/StationLayer.tsx` | Pin stasiun + label + badge peringkat | `maplibregl.Marker` (elemen HTML) |
| `layers/PropertyLayer.tsx` | Titik properti + popup | `maplibregl.Marker` + `maplibregl.Popup` |
| `layers/IsochroneLayer.tsx` | Poligon isokron 10 menit | `map.addSource()` + `map.addLayer()` |
| `LayerPanel.tsx` | Panel tampilan peta (visibilitas, opasitas, peta dasar) | UI biasa |
| `dev/DevToolsOverlay.tsx` | 🟡 Panel dev: parameter isokron + varian popup | UI biasa |

## Cara pakai

Ketiga layer dirender sebagai children `BaseMap`, tanpa props (kecuali seam di
`IsochroneLayer`), dan semuanya `return null` — mereka bekerja lewat efek samping ke map
instance, tidak menghasilkan DOM React:

```tsx
<BaseMap>
  <IsochroneLayer />   {/* paling bawah: poligon */}
  <PropertyLayer />    {/* titik properti */}
  <StationLayer />     {/* pin stasiun, paling atas */}
</BaseMap>
```

### StationLayer

Menggabungkan dua sumber yang **tidak** saling superset:

- `useStations()` → `/api/stations`: **semua** stasiun, termasuk yang belum berskor.
- `useBriefResult()` → `/api/score`: **hanya** kawasan `is_rankable = true`.

Hasil gabungannya menentukan tampilan tiap pin:

| Keadaan | Pin |
|---|---|
| Brief belum dikirim | pin polos, tanpa badge, tanpa label "data belum cukup" |
| Stasiun ada di `scoreResult.areas` | ikon aktif + badge `#peringkat` |
| Brief sudah dikirim tapi stasiun tidak ada di hasil | ikon inactive + label "· Data belum cukup" |

Tiga state visual dikendalikan lewat kelas CSS di elemen marker (`state-idle`, `state-hover`,
`state-active` + `marker-active-pulse`), definisinya di `app/globals.css`. Klik pin memanggil
`setSelectedStation(...)` — dari situ `BaseMap` yang menggeser kamera dan sidebar yang berganti
panel.

### IsochroneLayer

Satu source (`isochrone-source`) dengan tiga layer: `isochrone-fill` (isi luar, opacity 0,12),
`isochrone-inner-fill` (inti, 0,08), `isochrone-outline` (garis putus-putus 2,4px `#1E40AF`).
Filter layer sengaja menerima **dua bentuk data**: feature dengan `properties.type`
(`outer-isochrone` / `inner-core`, keluaran generator) maupun feature tanpa properti `type`
sama sekali (poligon MAPID apa adanya).

Data diperbarui lewat `source.setData()`, source/layer tidak pernah dibuat ulang:

```tsx
// 🔌 Seam untuk poligon resmi MAPID Isochrone Tool — begitu GeoJSON-nya ada:
<IsochroneLayer customGeoJSON={isokronMapid} />
```

### PropertyLayer

Mengambil properti kawasan aktif lewat `useProperties(selectedStation.area_id)` dan menggambar
satu marker per unit; klik marker membuka popup (hanya satu popup terbuka pada satu waktu).
Ada tiga varian tampilan popup — `sleek`, `slender-detail`, `vertical-card` — dipilih lewat
`usePropertyPopupConfig()` yang dikendalikan `DevToolsOverlay`.

### LayerPanel

Panel di pojok kanan bawah untuk mengatur **tampilan peta saja**: menyalakan/mematikan layer,
opasitas, dan memilih peta dasar dari `BASEMAPS` ([lib/fixtures/layers.ts](lib-fixtures.md)).

```tsx
const [styleId, setStyleId] = useState(DEFAULT_BASEMAP_ID);
<LayerPanel styleId={styleId} onStyleChange={setStyleId} />
```

Toggle memakai `map.setLayoutProperty(id, 'visibility', ...)` — operasi murah, tidak me-remount
apa pun, sesuai `CLAUDE.md` bagian 11.

### DevToolsOverlay

🟡 Alat pengembangan, bukan fitur produk: mengatur parameter isokron sintetis (mode
`organic`/`radius`, radius meter, luas km² terhitung) dan varian/tema popup properti. Muncul
sebagai pil melayang di bawah-tengah layar.

## Dependency/prasyarat

- Wajib berada di dalam `BaseMap` (untuk `useMapInstance`) dan di dalam
  `SelectedStationProvider`. `StationLayer` juga butuh `BriefResultProvider`;
  `IsochroneLayer` butuh `IsochroneConfigProvider`; `PropertyLayer` butuh
  `PropertyPopupConfigProvider`. Urutan provider ada di `app/page.tsx`, lihat
  [docs/hooks.md](hooks.md).
- Aset: `public/assets/map/marker-station-active.svg`,
  `public/assets/map/marker-station-inactive.svg`, `public/assets/map/maker-property-default.svg`
  (nama file ini memang salah eja "maker", biarkan sampai ada yang mengganti asetnya).
- Kelas animasi marker di `app/globals.css`.
- Endpoint `/api/stations`, `/api/score`, `/api/properties`.

## Batasan/gotcha

- **`LayerPanel` belum dirender di mana pun.** `app/page.tsx` tidak memuatnya, jadi panel
  tampilan peta tidak bisa dibuka user saat ini.
- **Toggle layer di `LayerPanel` tidak berefek untuk stasiun.** `MAP_LAYERS` menyebut id
  `station-pins` dan `station-labels`, tapi `StationLayer` menggambar pakai `maplibregl.Marker`
  (elemen HTML), **bukan** layer MapLibre — jadi `map.getLayer('station-pins')` selalu
  `undefined` dan checkbox-nya diam-diam tidak melakukan apa-apa. Perbaikannya nanti: pilih
  salah satu — daftar id diganti ke layer yang benar-benar ada (`isochrone-fill`,
  `isochrone-outline`), atau `StationLayer` dipindah ke symbol layer MapLibre. Jangan
  menambah id baru ke `MAP_LAYERS` tanpa memastikan layer-nya benar-benar terdaftar di map.
- **Isokron di peta masih sintetis**, dihitung `lib/map/isochrone-generator.ts` dari titik
  stasiun + radius (default 800 m ≈ 10 menit) — **bukan** isokron jaringan jalan dari MAPID
  Isochrone Tool. Bentuknya tidak boleh dipakai sebagai bukti analisis, dan `calculatedAreaKm2`
  darinya **tidak** dipakai rumus C (penyebut C memakai `area_km2` di `scored_areas`, dihitung
  pipeline batch). Saat GeoJSON MAPID siap: oper lewat `customGeoJSON`, lalu hapus
  `lib/map/isochrone-generator.ts`, `hooks/isochrone/*`, dan bagian isokron di `DevToolsOverlay`.
- **`StationLayer` membuat ulang seluruh marker** setiap `stations`/`scoreResult` berubah
  (bukan diff per marker). Aman di skala ~50–60 stasiun DKI; kalau daftar stasiun membesar,
  ini titik pertama yang akan terasa berat.
- **Popup properti memakai foto pengganti dari Unsplash** kalau `foto_tampak_depan` kosong —
  foto itu bukan properti sungguhan. Jangan biarkan lolos ke demo tanpa disadari.
- Popup dirakit sebagai string HTML lalu di-`setHTML()`; nilainya berasal dari database
  (kategori, alamat, URL foto) tanpa escaping. Data ini datang dari Properti Go, bukan input
  user, tapi kalau kelak ada teks bebas dari pengguna masuk ke popup, escape dulu.
- `DevToolsOverlay` dan seluruh isi `components/map/dev/` **tidak boleh** ikut ke build demo
  final — hapus komponennya dari `app/page.tsx` bersama folder `dev/`.
