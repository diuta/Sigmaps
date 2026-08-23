"use client";
import { useEffect } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import hexArea from "@/helper/hex-area";

export default function BaseMap() {
  useEffect(() => {
    const map = new maplibregl.Map({
      container: "map",
      style:
        "https://v2.basemap.mapid.io/styles/street-v2.0/style.json?key=6a3255374eed59093aba9c32",
      center: [106.8271129, -6.1754398],
      zoom: 15.5,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      map.addSource("stasiun-krl", {
        type: "geojson",
        data: "/geojson/krl.geojson",
      });

      map.addLayer({
        id: "krl-layer",
        type: "circle",
        source: "stasiun-krl",
        paint: {
          "circle-radius": 5,
          "circle-color": "#FF0000",
        },
      });

      map.on("click", "krl-layer", (e) => {
        if (map.getSource("hexagon")) {
          map.getSource("hexagon").setData(hexArea(e.lngLat.lng, e.lngLat.lat));
        } else {
          map.addSource("hexagon", {
            type: "geojson",
            data: hexArea(e.lngLat.lng, e.lngLat.lat),
          });

          map.addLayer({
            id: "hexagon-layer",
            type: "fill",
            source: "hexagon",
            paint: {
              "fill-color": "#00FF00",
              "fill-opacity": 0.5,
            },
          });
        }
      });

      map.on("mouseenter", "krl-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", "krl-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });

    return () => map.remove();
  }, []);

  return <div id="map" style={{ height: "100%" }} />;
}
