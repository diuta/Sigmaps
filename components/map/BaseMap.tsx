"use client";
import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function BaseMap() {
  useEffect(() => {
    const map = new maplibregl.Map({
      container: "map",
      style: `https://v2.basemap.mapid.io/styles/street-v2.0/style.json?key=${process.env.NEXT_PUBLIC_MAPID_MAPS_KEY}`,
      center: [106.8271129, -6.1754398],
      zoom: 15.5,
      pitch: 60,
      bearing: 0,
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: "100%" }} />;
}
