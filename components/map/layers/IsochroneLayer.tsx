"use client";

/**
 * components/map/layers/IsochroneLayer.tsx
 * ZONA CACA — 10-Minute Walking Isochrone Contour Layer
 *
 * Sesuai spesifikasi visual & ARCHITECTURE.md §9:
 * - Border: Dashed line #1E40AF (Cobalt Metro) dengan tebal ~2.4px.
 * - Fill: rgba(30, 64, 175, 0.12).
 * - Inner Core: Konsentris halus di sekitar stasiun (hanya jika data generator parametrik).
 * - Muncul dan mengikuti stasiun yang sedang aktif (`selectedStation`).
 *
 * DATA SOURCE — dua jalur (otomatis dipilih):
 *   1. ✅ REAL: `public/geojson/isochrone/{area_id}.geojson` — file GeoJSON dari MAPID/GIS
 *   2. 🟡 FALLBACK: `lib/map/isochrone-generator.ts` — generator parametrik, aktif jika
 *      file belum tersedia untuk stasiun tersebut (404).
 *
 * Untuk menambahkan GeoJSON asli: taruh file di `public/geojson/isochrone/`
 * dengan nama `{area_id}.geojson`. Lihat README.md di folder tersebut.
 */

import { useEffect } from "react";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useIsochroneConfig } from "@/hooks/isochrone/useIsochroneConfig";
import { useIsochroneGeoJSON } from "@/hooks/isochrone/useIsochroneGeoJSON";
import { calculateAreaKm2 } from "@/lib/map/isochrone-generator";
import type { Polygon } from "geojson";

export default function IsochroneLayer() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { options, setCalculatedAreaKm2 } = useIsochroneConfig();

  // ── Muat GeoJSON: file asli kalau ada, fallback ke generator parametrik ──
  const { geoJSON } = useIsochroneGeoJSON(
    selectedStation?.area_id ?? null,
    options,
    selectedStation
      ? { lng: selectedStation.lng, lat: selectedStation.lat }
      : undefined
  );

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
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // 1. Outer Isochrone Fill
      //    Filter: feature dengan type=outer-isochrone (generator) ATAU tanpa field 'type'
      //    (GeoJSON dari MAPID yang tidak menyertakan properti 'type' tetap dapat fill).
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: [
          "any",
          ["==", ["get", "type"], "outer-isochrone"],
          ["!", ["has", "type"]], // GeoJSON MAPID: tidak punya field 'type'
        ],
        paint: {
          "fill-color": "#1E40AF",
          "fill-opacity": 0.12, // Sesuai spek: rgba(30, 64, 175, 0.12)
        },
      });

      // 2. Inner Core Fill (hanya aktif pada data generator yang punya feature inner-core)
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

      // 3. Dashed Outline (Border 2.4px dashed #1E40AF)
      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
        filter: [
          "any",
          ["==", ["get", "type"], "outer-isochrone"],
          ["!", ["has", "type"]], // GeoJSON MAPID: tetap mendapat dashed border
        ],
        paint: {
          "line-color": "#1E40AF",
          "line-width": 2.4, // Sesuai spek
          "line-dasharray": [3, 2], // Dashed pattern Figma
          "line-opacity": 0.9,
        },
      });
    }

    // Update GeoJSON source
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      if (geoJSON) {
        source.setData(geoJSON);

        // Hitung & update area (km²) dari outer polygon untuk DevTools readout
        const outerFeature = geoJSON.features.find(
          (f) =>
            (f.properties as Record<string, unknown>)?.type === "outer-isochrone" ||
            !(f.properties as Record<string, unknown>)?.type
        );
        if (outerFeature?.geometry.type === "Polygon") {
          const coords = (outerFeature.geometry as Polygon).coordinates[0] as [
            number,
            number
          ][];
          setCalculatedAreaKm2(calculateAreaKm2(coords));
        }
      } else {
        // Tidak ada stasiun aktif — kosongkan
        source.setData({ type: "FeatureCollection", features: [] });
        setCalculatedAreaKm2(0);
      }
    }
  }, [map, geoJSON, setCalculatedAreaKm2]);

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
