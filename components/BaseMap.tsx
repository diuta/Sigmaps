"use client";
import { useEffect } from "react";
import { Map } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

export default function BaseMap() {
  useEffect(() => {
    const map = new Map({
      container: "map",
      style:
        "https://v2.basemap.mapid.io/styles/street-v2.0/style.json?key=6a3255374eed59093aba9c32",
      center: [106.8271129, -6.1754398],
      zoom: 15.5,
      pitch: 60,
      bearing: 0,
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: "100%" }} />;
}
