"use client";

/**
 * components/map/layers/IsochroneLayer.tsx
 * ZONA CACA — 10-Minute Walking Isochrone Contour Layer
 *
 * Sesuai spesifikasi visual & ARCHITECTURE.md §9:
 * - Border: Dashed line #1E40AF (Cobalt Metro) dengan tebal ~2.4px.
 * - Fill: rgba(30, 64, 175, 0.12).
 * - Inner Core: Konsentris halus di sekitar stasiun.
 * - Muncul dan mengikuti stasiun yang sedang aktif (`selectedStation`).
 *
 * 🔌 MAPID INJECTION READY:
 * Komponen ini dapat menerima prop `customGeoJSON` (output resmi MAPID Isochrone Tool).
 * Jika tidak ada prop, komponen otomatis menggunakan simulator parametrik dari IsochroneDevTool.
 */

import { useEffect } from "react";
import { useMapInstance } from "@/hooks/useMapInstance";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { useIsochroneConfig } from "@/hooks/useIsochroneConfig";
import { generateIsochroneGeoJSON } from "@/lib/map/isochrone-generator";
import type { FeatureCollection, Polygon } from "geojson";

interface IsochroneLayerProps {
  /**
   * 🔌 Injection Seam untuk GeoJSON resmi dari MAPID Isochrone Tool (Jalur 2).
   * Ketika tim GIS sudah memberikan file GeoJSON isokron, cukup pass ke prop ini.
   */
  customGeoJSON?: FeatureCollection<Polygon>;
}

export default function IsochroneLayer({ customGeoJSON }: IsochroneLayerProps) {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { options, setCalculatedAreaKm2 } = useIsochroneConfig();

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

      // 1. Outer Isochrone Fill (Kompatibel dengan poligon MAPID standar maupun generator)
      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        filter: [
          "any",
          ["==", ["get", "type"], "outer-isochrone"],
          ["!", ["has", "type"]], // Jika GeoJSON MAPID tidak punya properti 'type'
        ],
        paint: {
          "fill-color": "#1E40AF",
          "fill-opacity": 0.12, // Sesuai spek: rgba(30, 64, 175, 0.12)
        },
      });

      // 2. Inner Core Fill (Hanya aktif jika data menyediakan feature inner-core)
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
          ["!", ["has", "type"]], // Tetap memberi dashed border pada poligon MAPID
        ],
        paint: {
          "line-color": "#1E40AF",
          "line-width": 2.4, // Sesuai spek: border: 2.4px dashed #1E40AF
          "line-dasharray": [3, 2], // Dashed pattern Figma
          "line-opacity": 0.9,
        },
      });
    }

    // Update GeoJSON ketika selectedStation, customGeoJSON, atau parameter dev berubah
    const source = map.getSource(SOURCE_ID) as maplibregl.GeoJSONSource | undefined;
    if (source) {
      if (customGeoJSON) {
        // ✅ FASE REAL MAPID: Gunakan GeoJSON resmi dari MAPID Isochrone Tool
        source.setData(customGeoJSON);
      } else if (selectedStation) {
        // 🟡 FASE DUMMY / DEV: Gunakan generator parametrik
        const { geojson, areaKm2 } = generateIsochroneGeoJSON(
          selectedStation.lng,
          selectedStation.lat,
          options
        );
        source.setData(geojson);
        setCalculatedAreaKm2(areaKm2);
      } else {
        // Kosongkan poligon jika tidak ada stasiun aktif
        source.setData({
          type: "FeatureCollection",
          features: [],
        });
        setCalculatedAreaKm2(0);
      }
    }
  }, [map, selectedStation, customGeoJSON, options, setCalculatedAreaKm2]);

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
