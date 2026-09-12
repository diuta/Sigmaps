# `components/map/layers/RouteLayer.tsx`

## Apa fungsinya

Menggambar garis rute jalan kaki dari properti ke stasiun aktif (garis biru dengan casing
putih). Rutenya muncul **begitu pin properti diklik** (popup terbuka), tanpa perlu membuka
halaman detail, dan tetap ada saat detailnya dibuka. Tidak menghitung apa pun — datanya
sudah ada di field `rute` properti (LineString GeoJSON) dari `/api/properties`, hasil batch
[etl/hitung_rute.py](etl-hitung-rute.md).

## Cara pakai

Sudah dipasang di `app/page.tsx` di antara `IsochroneLayer` dan `PropertyLayer`:

```tsx
<BaseMap>
  <IsochroneLayer />
  <RouteLayer />        {/* garis MapLibre: di atas isokron, di bawah marker DOM */}
  <PropertyLayer />
  <StationLayer />
</BaseMap>
```

Tidak ada props. Sumber datanya `previewProperty ?? selectedProperty` dari
`useSelectedProperty()`:

| Kejadian | State | Yang terjadi |
|---|---|---|
| klik pin properti → popup terbuka (`popup.on("open")`) | `previewProperty = prop` | `source.setData(prop.rute)` |
| popup ditutup: tombol ×, klik peta, atau popup lain dibuka | `previewProperty = null` | garis hilang (kecuali `selectedProperty` masih terisi) |
| "Lihat detail" / klik kartu di sidebar | `selectedProperty = prop` | garis tetap / muncul |
| `prop.rute` null (belum dihitung) | — | `setData(kosong)` — tidak ada garis, tidak ada galat |
| stasiun berganti / filter berubah (marker dibuat ulang) | `previewProperty = null` | `setData(kosong)` |

`previewProperty` ditulis hanya oleh `PropertyLayer` (pemilik popup); komponen sidebar
tidak perlu menyentuhnya.

Teks jarak/waktunya ("≈ 890 m · 12 mnt jalan kaki") **bukan** tanggung jawab layer ini —
dibuat `helper/format-jalan-kaki.ts` dan dipakai popup `PropertyLayer` serta
`sidebar/PropertyDetail`.

## Dependency / prasyarat

- `useMapInstance()`, `useSelectedProperty()`, `useSelectedStation()`.
- `PropertyUnit` punya field opsional `jarak_jalan_m`, `waktu_jalan_s`, `rute`
  (`types/property/index.ts`) — diisi `useProperties` dari feature properties.
- Data: kolom `rute` di view `properti_go_by_station` (`supabase/views.sql`).

## Batasan / gotcha

- Source dan dua layer dibuat **sekali** saat map siap, lalu hanya `setData` — jangan
  unmount/remount komponen ini untuk "menyembunyikan" rute (CLAUDE.md §11).
- Urutan `addLayer` menentukan tumpukan: layer ini ditambahkan setelah isokron sehingga
  garisnya di atas fill isokron. Marker properti/stasiun adalah elemen DOM (`maplibregl.Marker`),
  selalu di atas semua layer canvas, jadi tidak tertutup.
- Rute mengikuti peta OSM: untuk kios di dalam stasiun bisa 0 m (tidak ada garis) atau
  memutar mengikuti pagar — lihat gotcha #3 di [etl-hitung-rute.md](etl-hitung-rute.md).
