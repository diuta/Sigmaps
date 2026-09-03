"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { basemapStyleUrl } from "@/lib/fixtures/layers";
import { MAP_INITIAL_VIEW, STATIONS } from "@/lib/fixtures/stations";
import { STATION_PIN_SIZE, stationPinDataUri } from "@/lib/map/station-pin";
import { findStation, stationsGeoJson } from "@/lib/map/stations-geojson";

interface Props {
  /** Gaya peta dasar yang aktif, dari panel layer. */
  styleId: string;
  /** Dipanggil sekali setelah map siap, supaya panel layer bisa mengaturnya. */
  onMapReady: (map: maplibregl.Map) => void;
}

export const STATION_SOURCE_ID = "stasiun";
export const STATION_PINS_LAYER_ID = "station-pins";
export const STATION_LABELS_LAYER_ID = "station-labels";

const PIN_IMAGES = {
  idle: "station-pin-idle",
  active: "station-pin-active",
  muted: "station-pin-muted",
} as const;

/** Ambil warna dari CSS variable supaya tidak ada hex yang ditulis di kode peta. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * createImageBitmap() menolak Blob SVG di browser berbasis Chromium maupun WebKit
 * ("Cannot decode the data in the argument"), jadi pin dimuat lewat HTMLImageElement
 * dengan data URI — jalur yang memang mendukung SVG.
 */
async function decodePin(dataUri: string): Promise<HTMLImageElement> {
  const img = new Image(STATION_PIN_SIZE.width, STATION_PIN_SIZE.height);
  img.src = dataUri;
  await img.decode();
  return img;
}

async function loadPinImages(map: maplibregl.Map) {
  const surface = token("--color-surface");
  const brand = token("--color-brand");
  const muted = token("--color-muted");
  const text = token("--color-text");

  const variants: Record<string, string> = {
    [PIN_IMAGES.idle]: stationPinDataUri({ fill: brand, icon: surface, border: surface }),
    [PIN_IMAGES.active]: stationPinDataUri({
      fill: brand,
      icon: surface,
      border: surface,
      glow: brand,
    }),
    // is_rankable = false → Cool Slate, tanpa glow (DESIGN.md §5A)
    [PIN_IMAGES.muted]: stationPinDataUri({ fill: muted, icon: text, border: surface }),
  };

  await Promise.all(
    Object.entries(variants).map(async ([id, dataUri]) => {
      if (map.hasImage(id)) return;
      try {
        const img = await decodePin(dataUri);
        if (!map.hasImage(id)) map.addImage(id, img);
      } catch (error) {
        console.error(`Gagal memuat pin stasiun "${id}"`, error);
      }
    }),
  );
}

function addStationLayers(map: maplibregl.Map, activeAreaId: string | null) {
  if (!map.getSource(STATION_SOURCE_ID)) {
    map.addSource(STATION_SOURCE_ID, {
      type: "geojson",
      data: stationsGeoJson(STATIONS),
    });
  }

  if (!map.getLayer(STATION_PINS_LAYER_ID)) {
    map.addLayer({
      id: STATION_PINS_LAYER_ID,
      type: "symbol",
      source: STATION_SOURCE_ID,
      layout: {
        "icon-image": [
          "case",
          ["!", ["get", "is_rankable"]],
          PIN_IMAGES.muted,
          ["==", ["get", "area_id"], activeAreaId ?? ""],
          PIN_IMAGES.active,
          PIN_IMAGES.idle,
        ],
        "icon-anchor": "bottom",
        "icon-allow-overlap": true,
        // Ikon digambar 48px, pin di dalamnya 36×44 sesuai DESIGN.md §5A.
        "icon-size": 1,
      },
    });
  }

  if (!map.getLayer(STATION_LABELS_LAYER_ID)) {
    map.addLayer({
      id: STATION_LABELS_LAYER_ID,
      type: "symbol",
      source: STATION_SOURCE_ID,
      layout: {
        "text-field": ["get", "station_name"],
        "text-size": 11,
        "text-offset": [0, 0.6],
        "text-anchor": "top",
        "text-allow-overlap": false,
      },
      paint: {
        "text-color": token("--color-text"),
        // Pendekatan pill putih di DESIGN.md §5A: maplibre tidak bisa menggambar
        // latar membulat tanpa sprite kedua, jadi dipakai halo tebal.
        "text-halo-color": token("--color-surface"),
        "text-halo-width": 2,
      },
    });
  }
}

export default function BaseMap({ styleId, onMapReady }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const activeAreaIdRef = useRef<string | null>(null);

  // Dibaca oleh handler styledata saat layer dipasang ulang setelah ganti peta dasar.
  useEffect(() => {
    activeAreaIdRef.current = selectedStation?.area_id ?? null;
  }, [selectedStation]);

  // Mount sekali. styleId dan stasiun aktif ditangani effect terpisah di bawah.
  useEffect(() => {
    if (!container.current) return;

    const map = new maplibregl.Map({
      container: container.current,
      style: basemapStyleUrl(styleId),
      center: MAP_INITIAL_VIEW.center,
      zoom: MAP_INITIAL_VIEW.zoom,
      attributionControl: { compact: true },
    });
    mapRef.current = map;

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

    // ponytail: setStyle membuang source & layer custom, jadi keduanya dipasang ulang
    // pada tiap styledata. Bila nanti ada banyak layer, pindahkan ke satu daftar deklaratif.
    async function attachStationLayers() {
      await loadPinImages(map);
      addStationLayers(map, activeAreaIdRef.current);
    }

    map.on("load", () => {
      void attachStationLayers().then(() => onMapReady(map));
    });
    map.on("styledata", () => {
      if (map.isStyleLoaded()) void attachStationLayers();
    });

    map.on("click", STATION_PINS_LAYER_ID, (e) => {
      const areaId = e.features?.[0]?.properties?.area_id;
      if (typeof areaId === "string") setSelectedStation(findStation(STATIONS, areaId));
    });

    map.on("mouseenter", STATION_PINS_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer";
    });
    map.on("mouseleave", STATION_PINS_LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Ganti peta dasar. Dilewati pada render pertama: gaya awal sudah dipasang lewat
  // constructor di atas, dan setStyle lagi di sini membuat style.json diambil dua kali.
  const styleMounted = useRef(false);
  useEffect(() => {
    if (!styleMounted.current) {
      styleMounted.current = true;
      return;
    }
    mapRef.current?.setStyle(basemapStyleUrl(styleId));
  }, [styleId]);

  // Stasiun aktif berubah — dari klik pin atau dari strip peringkat di sidebar.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.getLayer(STATION_PINS_LAYER_ID)) return;

    map.setLayoutProperty(STATION_PINS_LAYER_ID, "icon-image", [
      "case",
      ["!", ["get", "is_rankable"]],
      PIN_IMAGES.muted,
      ["==", ["get", "area_id"], selectedStation?.area_id ?? ""],
      PIN_IMAGES.active,
      PIN_IMAGES.idle,
    ]);

    if (selectedStation) {
      map.flyTo({
        center: [selectedStation.lng, selectedStation.lat],
        zoom: Math.max(map.getZoom(), 14),
        duration: 900,
      });
    }
  }, [selectedStation]);

  return <div ref={container} className="h-full w-full" />;
}
