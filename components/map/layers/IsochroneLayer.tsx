"use client";

/**
 * components/map/layers/IsochroneLayer.tsx
 * Poligon isokron pejalan kaki 10 menit di sekitar stasiun yang sedang aktif.
 *
 * Gaya visual (ARCHITECTURE.md §9):
 * - Border: dashed #1E40AF, tebal 2.4px
 * - Fill: rgba(30, 64, 175, 0.12)
 *
 * SUMBER POLIGON: /api/stations -> properties.isokron (lihat docs/api-stations.md).
 * Itu keluaran MAPID Isochrone Tool apa adanya — `isochrone_profile: "foot"`,
 * `time_limit: 600` — disimpan di `scored_areas.geom` dan disajikan sebagai GeoJSON
 * lewat view `stasiun_kawasan`.
 *
 * Sebelumnya komponen ini menggambar lingkaran sintetis dari
 * `lib/map/isochrone-generator.ts`, helper sementara dari masa poligon MAPID belum
 * tersedia (B-1). Akibatnya peta menampilkan bentuk yang BUKAN kawasan yang dipakai
 * menghitung skor: lingkaran berjari-jari 800 m, sementara isokron aslinya tidak
 * beraturan dan luasnya 0,493–1,580 km². Angka di panel dan bentuk di peta merujuk
 * dua wilayah berbeda. Sudah diperbaiki — helper itu kini tidak dipakai siapa pun.
 */

import { useEffect } from "react";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useIsochroneConfig } from "@/hooks/isochrone/useIsochroneConfig";
import type { FeatureCollection, Polygon } from "geojson";

const KOSONG: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };

interface IsochroneLayerProps {
  /** Override manual, mis. untuk pengujian. Kalau diisi, dipakai apa adanya. */
  customGeoJSON?: FeatureCollection<Polygon>;
}

export default function IsochroneLayer({ customGeoJSON }: IsochroneLayerProps) {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { stations } = useStations();
  const { setCalculatedAreaKm2 } = useIsochroneConfig();

  const SOURCE_ID = "isochrone-source";
  const FILL_LAYER_ID = "isochrone-fill";
  const INNER_FILL_ID = "isochrone-inner-fill";
  const OUTLINE_LAYER_ID = "isochrone-outline";

  useEffect(() => {
    if (!map) return;

    // Inisialisasi Source & Layers jika belum terdaftar
    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      // 1. Outer Isochrone Fill
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: [
          "any",
          ["==", ["get", "type"], "outer-isochrone"],
          ["!", ["has", "type"]], // poligon MAPID tidak punya properti 'type'
        ],
        paint: {
          "fill-color": "#1E40AF",
          "fill-opacity": 0.12,
        },
      });

      // 2. Inner Core Fill (hanya aktif kalau data menyediakan feature inner-core)
      map.addLayer({
        id: INNER_FILL_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: ["==", ["get", "type"], "inner-core"],
        paint: {
          "fill-color": "#1E40AF",
          "fill-opacity": 0.08,
        },
      });

      // 3. Dashed Outline
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        filter: [
          "any",
          ["==", ["get", "type"], "outer-isochrone"],
          ["!", ["has", "type"]],
        ],
        paint: {
          "line-color": "#1E40AF",
          "line-width": 2.4,
          "line-dasharray": [3, 2],
          "line-opacity": 0.9,
        },
      });
    }

    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (!source) return;

    if (customGeoJSON) {
      source.setData(customGeoJSON);
      return;
    }

    // Cari poligon stasiun yang sedang aktif. StationLocation.area_id sama dengan
    // properties.station_id (keduanya 'R-1'…'R-43'), jadi cocokkan langsung.
    const fitur = selectedStation
      ? stations?.features.find(
          (f) => f.properties.station_id === selectedStation.area_id
        )
      : undefined;

    const isokron = fitur?.properties.isokron;

    if (!isokron) {
      // Tiga sebab, semuanya kondisi normal: belum ada stasiun dipilih, /api/stations
      // belum selesai dimuat, atau pipeline batch belum jalan sehingga isokronnya NULL.
      source.setData(KOSONG);
      setCalculatedAreaKm2(0);
      return;
    }

    source.setData({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: isokron,
          properties: {
            station_id: fitur.properties.station_id,
            is_rankable: fitur.properties.is_rankable,
          },
        },
      ],
    });

    // Luas SEBENARNYA dari database — ST_Area(geom::geography), geodesik di atas
    // elipsoid. Sebelumnya angka ini hasil hitungan kasar generator, jadi yang tampil
    // di DevToolsOverlay tidak pernah sama dengan penyebut yang dipakai rumus C.
    setCalculatedAreaKm2(fitur.properties.area_km2 ?? 0);
  }, [map, selectedStation, stations, customGeoJSON, setCalculatedAreaKm2]);

  // Cleanup layer & source saat unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      if (map.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID);
      if (map.getLayer(INNER_FILL_ID)) map.removeLayer(INNER_FILL_ID);
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  return null;
}
