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
import { MapInstanceProvider } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { basemapStyleUrl, DEFAULT_BASEMAP_ID } from "@/lib/fixtures/layers";

interface BaseMapProps {
  children?: ReactNode;
}

export default function BaseMap({ children }: BaseMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Instance map disimpan di state (bukan hanya ref) supaya bisa dipakai langsung
  // saat render (mis. dioper ke MapInstanceProvider) tanpa membaca ref.current di
  // render — membaca ref value saat render tidak dijamin React, beda dari state.
  const [map, setMap] = useState<maplibregl.Map | null>(null);

  const { selectedStation } = useSelectedStation();
  const { selectedProperty } = useSelectedProperty();

  // 1. Inisialisasi MapLibre GL + jaga canvas tetap sama besar dengan kontainernya.
  //
  // Insiden nyata (ditemukan lewat pengecekan di browser, bukan cuma baca kode):
  // saat efek ini jalan, mapContainerRef.current masih berukuran 0x0 — flex layout
  // (`h-screen`/`w-full h-full`) belum "commit" ke ukuran final pas render pertama.
  // MapLibre yang dikonstruksi dari kontainer 0x0 TIDAK PERNAH memicu event 'load'
  // sama sekali, jadi resize yang cuma digantung di `.on('load', ...)` tidak pernah
  // jalan — canvas terkunci selamanya di ukuran fallback-nya (400x300), sementara
  // marker (StationLayer, dll) dihitung dari ukuran kontainer sungguhan yang jauh
  // lebih besar → marker "melayang" di luar area peta yang benar-benar tergambar.
  //
  // Perbaikan: ResizeObserver dipasang ke instance MENTAH begitu dibuat, TIDAK
  // digantung ke state `map` atau event 'load' — begitu kontainer dapat ukuran
  // sungguhannya (biasanya langsung di frame berikutnya), observer memanggil
  // `.resize()` dan itu yang akhirnya membuat MapLibre benar-benar merender & 'load'.
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainerRef.current,
      style: basemapStyleUrl(DEFAULT_BASEMAP_ID),
      center: [106.8271129, -6.1754398], // Jakarta default center
      zoom: 13,
      pitch: 0,
      bearing: 0,
    });

    const resizeObserver = new ResizeObserver(() => mapInstance.resize());
    resizeObserver.observe(mapContainerRef.current);

    // Tambahkan scale control metrik (misal 500m / 1km) untuk verifikasi akurasi skala
    const scaleControl = new maplibregl.ScaleControl({ maxWidth: 100, unit: "metric" });
    mapInstance.addControl(scaleControl, "bottom-left");

    mapInstance.on("load", () => {
      setMap(mapInstance);
    });

    return () => {
      resizeObserver.disconnect();
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // 2. Unidirectional Reaction: Fly to selectedStation
  // Berjalan saat stasiun berubah (Top 1-5 maupun stasiun non-rank/bebas)
  useEffect(() => {
    if (!map || !selectedStation) return;

    map.flyTo({
      center: [selectedStation.lng, selectedStation.lat],
      zoom: 15.5,
      speed: 1.2,
      curve: 1.4,
      essential: true, // Hormati user preference tapi prioritaskan kelancaran animasi navigasi
    });
  }, [map, selectedStation]);

  // 3. Unidirectional Reaction: Fly to selectedProperty (dari klik property card di sidebar)
  // Zoom lebih dekat (16.5) supaya pin properti jelas terlihat.
  useEffect(() => {
    if (!map || !selectedProperty) return;

    map.flyTo({
      center: [selectedProperty.lng, selectedProperty.lat],
      zoom: Math.max(map.getZoom(), 16.5),
      speed: 1.2,
      curve: 1.4,
      essential: true,
    });
  }, [map, selectedProperty]);

  return (
    <div className="relative w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />
      {map && <MapInstanceProvider map={map}>{children}</MapInstanceProvider>}
    </div>
  );
}
