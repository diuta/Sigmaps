"use client";

/**
 * components/map/layers/RouteLayer.tsx
 * Garis rute jalan kaki dari properti ke stasiun aktif. Muncul begitu pin properti
 * diklik (popup terbuka = previewProperty), dan tetap ada saat halaman detailnya dibuka
 * (selectedProperty). Popup ditutup tanpa buka detail = rute hilang.
 *
 * Datanya BUKAN dihitung di sini: `selectedProperty.rute` sudah datang dari
 * /api/properties (kolom `rute` view properti_go_by_station, diisi batch
 * etl/hitung_rute.py). Layer ini cuma menggambar. Kalau `rute` null (belum dihitung),
 * tidak menggambar apa-apa — kondisi normal.
 *
 * Source + layer dibuat sekali; ganti properti = setData (CLAUDE.md §11).
 * Dua layer garis: casing putih lebar di bawah, garis biru di atas, supaya
 * tetap terbaca di atas jalan/bangunan basemap.
 */

import { useEffect } from "react";
import type maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import type { FeatureCollection, LineString } from "geojson";

const SOURCE_ID = "route-source";
const CASING_ID = "route-casing";
const LINE_ID = "route-line";
const KOSONG: FeatureCollection<LineString> = { type: "FeatureCollection", features: [] };

export default function RouteLayer() {
  const { map } = useMapInstance();
  const { selectedProperty, previewProperty } = useSelectedProperty();
  const { selectedStation } = useSelectedStation();

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, { type: "geojson", data: KOSONG });
      map.addLayer({
        id: CASING_ID,
        type: "line",
        source: SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#ffffff", "line-width": 7, "line-opacity": 0.9 },
      });
      map.addLayer({
        id: LINE_ID,
        type: "line",
        source: SOURCE_ID,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": "#2563eb", "line-width": 3.5, "line-opacity": 0.95 },
      });
    }

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    // Popup yang sedang terbuka menang; kalau tidak ada, pakai properti yang detailnya
    // dibuka. Rute hanya relevan untuk pasangan (properti, stasiun aktif).
    const aktif = previewProperty ?? selectedProperty;
    const rute = selectedStation && aktif?.rute;
    if (!aktif || !rute || rute.coordinates.length < 2) {
      source.setData(KOSONG);
      return;
    }

    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: rute,
          properties: {
            property_id: aktif.id,
            jarak_jalan_m: aktif.jarak_jalan_m ?? null,
            waktu_jalan_s: aktif.waktu_jalan_s ?? null,
          },
        },
      ],
    });
  }, [map, selectedProperty, previewProperty, selectedStation]);

  useEffect(() => {
    return () => {
      if (!map) return;
      if (map.getLayer(LINE_ID)) map.removeLayer(LINE_ID);
      if (map.getLayer(CASING_ID)) map.removeLayer(CASING_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  return null;
}
