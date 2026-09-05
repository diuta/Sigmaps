"use client";

/**
 * components/map/layers/StationLayer.tsx
 * ZONA CACA — Stasiun Pins Layer
 *
 * Mengimplementasikan 3 State Marker Interaktif:
 * - State A: Idle (sedikit transparan, scale 0.92)
 * - State B: Hover (scale 1.08, translateY -4px, glow halus, label stasiun)
 * - State C: Active (scale 1.22, translateY -8px, multi-layer shadow + pulsing radar ring)
 *
 * Mendukung status `is_rankable = false` dengan marker abu-abu (marker-station-inactive.svg)
 * dan label "Data belum cukup".
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/useMapInstance";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import type { StationRanking } from "@/types/station";

// 🟡 FASE DUMMY: swap ke props/fetch saat API real Supabase siap
import { DUMMY_STATIONS } from "@/lib/dummy/stations";

export default function StationLayer() {
  const { map } = useMapInstance();
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(
    new Map()
  );

  // 1. Mount dan render markers satu kali ke peta
  useEffect(() => {
    if (!map) return;

    // Bersihkan marker lama jika ada
    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    DUMMY_STATIONS.forEach((station: StationRanking) => {
      const el = document.createElement("div");
      el.className = "station-marker-container state-idle";
      el.setAttribute("data-area-id", station.area_id);

      // Tentukan icon SVG berdasarkan is_rankable
      const svgSrc = station.is_rankable
        ? "/assets/map/marker-station-active.svg"
        : "/assets/map/marker-station-inactive.svg";

      if (!station.is_rankable) {
        el.classList.add("is-inactive");
      }

      el.innerHTML = `
        <div class="marker-active-pulse-container"></div>
        <div class="relative flex flex-col items-center select-none pointer-events-auto">
          <!-- Floating Name & Rank Header Pill (Bersih di atas pin, tidak menutupi icon kereta) -->
          <div class="station-label mb-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight whitespace-nowrap shadow-xl backdrop-blur-md transition-all duration-200 ${
            station.is_rankable
              ? "bg-slate-900/90 text-white border border-slate-700/70"
              : "bg-slate-800/85 text-slate-300 border border-slate-600/40 text-[10px]"
          }">
            ${
              station.rank !== null
                ? `<span class="px-1.5 py-0.2 bg-[var(--color-brand)] text-white text-[10px] font-extrabold rounded-full shadow-sm">
                    #${station.rank}
                  </span>`
                : ""
            }
            <span>${station.station_name}</span>
            ${!station.is_rankable ? ' <span class="text-[9px] text-amber-300 font-normal">· Data belum cukup</span>' : ""}
          </div>

          <!-- Marker Pin Wrapper (Icon kereta bebas & bersih tanpa tertimpa) -->
          <div class="relative flex items-center justify-center">
            <img 
              src="${svgSrc}" 
              alt="${station.station_name}" 
              class="w-[54px] h-[60px] object-contain drop-shadow-md transition-transform duration-200" 
              draggable="false"
            />
          </div>
        </div>
      `;

      // Hover Interaction (State B)
      el.addEventListener("mouseenter", () => {
        if (selectedStation?.area_id !== station.area_id) {
          el.classList.remove("state-idle");
          el.classList.add("state-hover");
        }
      });

      el.addEventListener("mouseleave", () => {
        if (selectedStation?.area_id !== station.area_id) {
          el.classList.remove("state-hover");
          el.classList.add("state-idle");
        }
      });

      // Click Interaction -> Set Selected Station (State C)
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedStation(station);
      });

      // Pasang ke MapLibre
      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([station.lng, station.lat])
        .addTo(map);

      markersRef.current.set(station.area_id, { marker, el });
    });

    return () => {
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
    };
  }, [map]);

  // 2. React to selectedStation changes (Update visual State A / State C)
  useEffect(() => {
    markersRef.current.forEach(({ el }, areaId) => {
      const isSelected = selectedStation?.area_id === areaId;
      const pulseContainer = el.querySelector(".marker-active-pulse-container");

      if (isSelected) {
        // State C: Active
        el.classList.remove("state-idle", "state-hover");
        el.classList.add("state-active");
        if (pulseContainer && !pulseContainer.querySelector(".marker-active-pulse")) {
          pulseContainer.innerHTML = '<div class="marker-active-pulse"></div>';
        }
      } else {
        // State A: Idle
        el.classList.remove("state-active", "state-hover");
        el.classList.add("state-idle");
        if (pulseContainer) {
          pulseContainer.innerHTML = "";
        }
      }
    });
  }, [selectedStation]);

  return null;
}
