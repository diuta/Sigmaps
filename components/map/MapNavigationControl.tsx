"use client";

/**
 * components/map/MapNavigationControl.tsx
 *
 * Kontrol navigasi peta minimalis & rapi:
 * - Zoom In (+)
 * - Zoom Out (−)
 * - Recenter (Pusatkan kembali saat pengguna tersesat)
 *
 * Prinsip Desain GIS:
 * - Penempatan di sudut kanan atas (Top-Right): standar industri GIS (Google Maps, Mapbox, ArcGIS)
 *   menyeimbangkan visual dengan sidebar di sisi kiri dan legenda di kiri-bawah.
 * - Glassmorphism, border halus, bayangan float, dan token tema (--radius-card, --color-surface).
 */

import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";

const DEFAULT_CENTER: [number, number] = [106.8271129, -6.1754398]; // Monas / Jakarta Pusat
const DEFAULT_ZOOM = 13;

export default function MapNavigationControl() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();

  function handleZoomIn() {
    if (!map) return;
    map.zoomIn({ duration: 240 });
  }

  function handleZoomOut() {
    if (!map) return;
    map.zoomOut({ duration: 240 });
  }

  function handleRecenter() {
    if (!map) return;

    if (selectedStation) {
      map.flyTo({
        center: [selectedStation.lng, selectedStation.lat],
        zoom: 15.5,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    } else {
      map.flyTo({
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        pitch: 0,
        bearing: 0,
        speed: 1.2,
        curve: 1.4,
        essential: true,
      });
    }
  }

  return (
    <div
      className="absolute top-[var(--space-md)] right-[var(--space-md)] z-30 flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-float)] backdrop-blur-sm select-none"
      role="group"
      aria-label="Kontrol navigasi peta"
    >
      {/* Zoom In */}
      <button
        type="button"
        onClick={handleZoomIn}
        aria-label="Perbesar peta"
        title="Perbesar (Zoom In)"
        className="flex h-9 w-9 items-center justify-center text-[var(--color-text-sub)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand)] active:scale-95 active:bg-[var(--color-border)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="8" y1="3" x2="8" y2="13" />
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-[1px] w-full bg-[var(--color-border)]" />

      {/* Zoom Out */}
      <button
        type="button"
        onClick={handleZoomOut}
        aria-label="Perkecil peta"
        title="Perkecil (Zoom Out)"
        className="flex h-9 w-9 items-center justify-center text-[var(--color-text-sub)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand)] active:scale-95 active:bg-[var(--color-border)]"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <line x1="3" y1="8" x2="13" y2="8" />
        </svg>
      </button>

      {/* Divider */}
      <div className="h-[1px] w-full bg-[var(--color-border)]" />

      {/* Recenter */}
      <button
        type="button"
        onClick={handleRecenter}
        aria-label="Pusatkan peta"
        title={
          selectedStation
            ? `Pusatkan ke ${selectedStation.station_name}`
            : "Pusatkan peta (Reset view)"
        }
        className="flex h-9 w-9 items-center justify-center text-[var(--color-text-sub)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-brand)] active:scale-95 active:bg-[var(--color-border)]"
      >
        {/* Reticle / Crosshair Icon */}
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
          <circle cx="8" cy="8" r="4.5" />
          <line x1="8" y1="1" x2="8" y2="3" />
          <line x1="8" y1="13" x2="8" y2="15" />
          <line x1="1" y1="8" x2="3" y2="8" />
          <line x1="13" y1="8" x2="15" y2="8" />
          <circle cx="8" cy="8" r="1.2" fill="currentColor" />
        </svg>
      </button>
    </div>
  );
}
