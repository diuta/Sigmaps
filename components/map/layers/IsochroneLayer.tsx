"use client";

import { useEffect } from "react";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import type { FeatureCollection, Polygon } from "geojson";

const KOSONG: FeatureCollection<Polygon> = { type: "FeatureCollection", features: [] };

export default function IsochroneLayer() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { stations } = useStations();

  const SOURCE_ID = "isochrone-source";
  const FILL_LAYER_ID = "isochrone-fill";
  const OUTLINE_LAYER_ID = "isochrone-outline";

  useEffect(() => {
    if (!map) return;

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });

      map.addLayer({
        id: FILL_LAYER_ID,
        type: "fill",
        source: SOURCE_ID,
        paint: {
          "fill-color": "#1E40AF",
          "fill-opacity": 0.12,
        },
      });

      map.addLayer({
        id: OUTLINE_LAYER_ID,
        type: "line",
        source: SOURCE_ID,
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

    const fitur = selectedStation
      ? stations?.features.find(
          (f) => f.properties.station_id === selectedStation.area_id
        )
      : undefined;

    const isokron = fitur?.properties.isokron;

    if (!isokron) {
      source.setData(KOSONG);
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
  }, [map, selectedStation, stations]);

  useEffect(() => {
    return () => {
      if (!map) return;
      if (map.getLayer(OUTLINE_LAYER_ID)) map.removeLayer(OUTLINE_LAYER_ID);
      if (map.getLayer(FILL_LAYER_ID)) map.removeLayer(FILL_LAYER_ID);
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, [map]);

  return null;
}
