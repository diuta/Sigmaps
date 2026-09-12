# components/map/layers/*

Semua yang digambar **di atas** basemap. Tiap layer adalah komponen sendiri yang mengambil map
instance lewat `useMapInstance()` dan menambahkan dirinya sendiri — `BaseMap` tidak pernah tahu
isi layer (`CLAUDE.md` bagian 11, lihat [component-base-map.md](../context/component-base-map.md)).

| File | Isi | Teknik |
|---|---|---|
| `layers/StationLayer.tsx` | Pin stasiun + label + badge peringkat | `maplibregl.Marker` (elemen HTML) |
| `layers/PropertyLayer.tsx` | Titik properti + popup | `maplibregl.Marker` + `maplibregl.Popup` |
| `layers/IsochroneLayer.tsx` | Poligon isokron 10 menit | `map.addSource()` + `map.addLayer()` |
| `layers/RouteLayer.tsx` | Garis rute jalan kaki properti → stasiun | `map.addSource()` + `map.addLayer()`, lihat [component-route-layer.md](component-route-layer.md) |

## Cara pakai

Keempat layer dirender sebagai children `BaseMap`, tanpa props, dan semuanya `return null` —
mereka bekerja lewat efek samping ke map instance, tidak menghasilkan DOM React:

```tsx
<BaseMap>
  <IsochroneLayer />   {/* paling bawah: poligon */}
  <RouteLayer />       {/* garis rute */}
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

Satu source (`isochrone-source`) dengan dua layer: `isochrone-fill` (opacity 0,12) dan
`isochrone-outline` (garis putus-putus 2,4px `#1E40AF`). Poligonnya diambil dari
`/api/stations` → `properties.isokron` (keluaran MAPID Isochrone Tool, foot 600 detik) untuk
stasiun yang sedang aktif. Data diperbarui lewat `source.setData()`, source/layer tidak pernah
dibuat ulang. Tidak ada props: layer ini tidak bisa diberi poligon lain dari luar.

### PropertyLayer

Mengambil properti kawasan aktif lewat `useProperties(selectedStation.area_id)` dan menggambar
satu marker per unit; klik marker membuka popup (hanya satu popup terbuka pada satu waktu).
Templat popupnya satu (`renderPopupHTML`, kartu vertikal dengan foto full-bleed); klik kartu
atau klik pin saat popupnya terbuka memanggil `setSelectedProperty()` → sidebar membuka halaman
detail. Popup terbuka juga menulis `previewProperty` supaya `RouteLayer` langsung menggambar rute.

## Dependency/prasyarat

- Wajib berada di dalam `BaseMap` (untuk `useMapInstance`) dan di dalam
  `SelectedStationProvider`. `StationLayer` juga butuh `BriefResultProvider`; `PropertyLayer`
  dan `RouteLayer` butuh `SelectedPropertyProvider` (+ `PropertyFilterProvider` untuk
  `PropertyLayer`). Urutan provider ada di `app/page.tsx`, lihat [docs/hooks.md](hooks.md).
- Aset: `public/assets/map/marker-station-active.svg`,
  `public/assets/map/marker-station-inactive.svg`, `public/assets/map/maker-property-default.svg`
  (nama file ini memang salah eja "maker", biarkan sampai ada yang mengganti asetnya).
- Kelas animasi marker di `app/globals.css`.
- Endpoint `/api/stations`, `/api/score`, `/api/properties`.
- Poligon isokron sudah harus ada di `scored_areas.geom` (diisi `etl/load_isokron.py`); kalau
  belum, `properties.isokron` NULL dan layer isokron diam saja (kondisi normal, bukan galat).

## Batasan/gotcha

- **Belum ada panel toggle layer.** `LayerPanel` lama sudah dihapus (tidak pernah dirender, dan
  id layer yang dirujuknya tidak ada). Kalau nanti dibuat lagi: `StationLayer` dan
  `PropertyLayer` memakai `maplibregl.Marker` (elemen HTML), **bukan** layer MapLibre, jadi
  `map.setLayoutProperty('visibility')` hanya berlaku untuk `isochrone-*` dan `route-*`.
- **`StationLayer` membuat ulang seluruh marker** setiap `stations`/`scoreResult` berubah
  (bukan diff per marker). Aman di skala ~50–60 stasiun DKI; kalau daftar stasiun membesar,
  ini titik pertama yang akan terasa berat.
- **Popup properti memakai foto pengganti dari Unsplash** kalau `foto_tampak_depan` kosong —
  foto itu bukan properti sungguhan. Jangan biarkan lolos ke demo tanpa disadari.
- Popup dirakit sebagai string HTML lalu di-`setHTML()`; nilainya berasal dari database
  (kategori, alamat, URL foto) tanpa escaping. Data ini datang dari Properti Go, bukan input
  user, tapi kalau kelak ada teks bebas dari pengguna masuk ke popup, escape dulu.
