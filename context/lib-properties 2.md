# lib/properties.ts

Fungsi murni: ubah baris hasil query view `properti_go_by_station` jadi GeoJSON
FeatureCollection. Tidak menyentuh Supabase/HTTP — query dilakukan di
[app/api/properties/route.ts](api-properties.md).

## Cara pakai

```ts
import { toPropertiesFeatureCollection, type PropertyRow } from '@/lib/properties'

const rows: PropertyRow[] = [
  {
    id: 'p_1', kategori_properti: 'Ruko', jenis_properti: 'Sewa', alamat: 'Jl. Contoh 1',
    foto_tampak_depan: 'https://...', foto_spanduk: null,
    geom: { type: 'Point', coordinates: [106.81, -6.18] },
  },
]

const fc = toPropertiesFeatureCollection(rows)
```

## Dependency/prasyarat

Tidak ada — hanya transformasi data.

## Batasan/gotcha

- Sama seperti `lib/stations.ts`: `geom` diasumsikan sudah GeoJSON (hasil view), bukan raw
  PostGIS.
- Sengaja **tidak** memuat luas/harga/kontak pemilik — Properti Go tidak punya kolom itu.
