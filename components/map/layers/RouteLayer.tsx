"use client";

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
