"use client";

/**
 * components/map/BaseMap.tsx
 * ZONA CACA — Map Canvas & Lifecycle Orchestrator
 *
 * Sesuai ARCHITECTURE.md §4 & §5:
 * - Menginisialisasi instance MapLibre GL JS dengan basemap MAPID.
 * - Menyediakan instance map untuk sublayer via MapInstanceProvider.
 * - Mendengarkan perubahan `selectedStation` dari `useSelectedStation()`
 *   dan mengeksekusi animasi kamera `flyTo()` secara otomatis (unidirectional).
 * - Mendukung children agar layer-layer (StationLayer, PropertyLayer, dll)
 *   dapat di-mount secara modular di dalamnya.
 */

import React, { useEffect, useRef, useState, ReactNode } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapInstanceProvider } from "@/hooks/useMapInstance";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import { basemapStyleUrl, DEFAULT_BASEMAP_ID } from "@/lib/fixtures/layers";

interface BaseMapProps {
  children?: ReactNode;
}

export default function BaseMap({ children }: BaseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const { selectedStation } = useSelectedStation();

  // 1. Inisialisasi MapLibre GL
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyleUrl(DEFAULT_BASEMAP_ID),
      center: [106.8271129, -6.1754398], // Jakarta default center
      zoom: 13,
      pitch: 0,
      bearing: 0,
    });

    map.on("load", () => {
      mapInstanceRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setMapLoaded(false);
    };
  }, []);

  // 2. Unidirectional Reaction: Fly to selectedStation
  // Berjalan saat stasiun berubah (Top 1-5 maupun stasiun non-rank/bebas)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedStation) return;

    map.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: 15.5,
      speed: 1.2,
      curve: 1.4,
      essential: true, // Hormati user preference tapi prioritaskan kelancaran animasi navigasi
    });
  }, [selectedStation]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      {mapLoaded && (
        <MapInstanceProvider map={mapInstanceRef.current}>
          {children}
        </MapInstanceProvider>
      )}
    </div>
  );
}
