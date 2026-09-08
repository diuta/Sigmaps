# Isochrone GeoJSON Files

Taruh file GeoJSON isokron per stasiun di folder ini dengan nama sesuai `area_id` stasiun.

## Naming Convention

```
{area_id}.geojson
```

Contoh berdasarkan area_id di tabel `scored_areas` / `stasiun`:

```
st_manggarai.geojson
st_gondangdia.geojson
st_cikini.geojson
st_juanda.geojson
...
```

> **Cara cek `area_id` suatu stasiun:** lihat nilai kolom `area_id` di Supabase tabel
> `scored_areas`, atau cek respons dari `/api/score`.

## Format GeoJSON yang Didukung

File ini bisa berupa **output langsung dari MAPID Isochrone Tool** — tidak perlu modifikasi
properties apa pun. Format yang didukung:

- `FeatureCollection` berisi `Polygon` atau `MultiPolygon`
- Properties bebas (field `type` tidak wajib ada)
- CRS: WGS-84 (EPSG:4326) — **wajib**, ini yang dipakai MapLibre

## Behavior Fallback

Kalau file untuk suatu stasiun **belum ada** (404), `IsochroneLayer` otomatis pakai
generator parametrik (estimasi lingkaran/organik). Tidak akan terjadi error.

Ini artinya bisa upload GeoJSON bertahap per stasiun — yang sudah ada file pakai data
asli, yang belum tetap pakai estimasi.

## Contoh minimal file valid

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [106.850, -6.210],
            [106.855, -6.205],
            [106.860, -6.210],
            [106.855, -6.215],
            [106.850, -6.210]
          ]
        ]
      },
      "properties": {}
    }
  ]
}
```
