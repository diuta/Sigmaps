"use client";

/**
 * components/map/layers/PropertyLayer.tsx
 * ZONA CACA — Property Units Pin Layer
 *
 * Mendukung template popup yang dapat diganti via `usePropertyPopupConfig()`:
 * - 'sleek': Compact horizontal pill (sesuai referensi Figma 200x72)
 * - 'slender-detail': Horizontal sleek + baris alamat ringkas
 * - 'vertical-card': Format kartu vertikal awal
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { usePropertyPopupConfig } from "@/hooks/property/usePropertyPopupConfig";
import type { PropertyPopupStyle } from "@/hooks/property/usePropertyPopupConfig.types";
import type { PropertyUnit } from "@/types/property";
import { useProperties } from "@/hooks/property/useProperties";

function renderPopupHTML(
  prop: PropertyUnit,
  stationName: string,
  style: PropertyPopupStyle,
  theme: "light" | "dark"
): string {
  const isDark = theme === "dark";
  const photoSrc =
    prop.foto_tampak_depan ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80";

  const badgeText = prop.jenis_properti === "Sewa" ? "Siap Sewa" : "Siap Jual";

  // 1. SLEEK HORIZONTAL (Sesuai Referensi Figma ~210x72)
  if (style === "sleek") {
    return `
      <div class="flex items-center gap-3 p-2.5 rounded-2xl shadow-2xl border transition-all select-none ${
        isDark
          ? "bg-slate-900/95 border-slate-700/80 text-white backdrop-blur-md"
          : "bg-white/95 border-slate-200/90 text-slate-900 backdrop-blur-md"
      }" style="min-width: 215px; max-width: 250px;">
        <!-- Left Squircle Image -->
        <div class="w-[52px] h-[52px] rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm">
          <img src="${photoSrc}" alt="${prop.kategori_properti}" class="w-full h-full object-cover" />
        </div>

        <!-- Right Content -->
        <div class="flex flex-col justify-center min-w-0 pr-1">
          <h4 class="text-[13px] font-bold tracking-tight truncate leading-tight ${
            isDark ? "text-white" : "text-slate-900"
          }">
            ${prop.kategori_properti} ${stationName}
          </h4>

          <div class="mt-1.5 flex items-center gap-1.5">
            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-tight ${
              prop.jenis_properti === "Sewa"
                ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80"
                : "bg-blue-50 text-blue-800 border border-blue-200/80"
            }">
              ${badgeText}
            </span>
          </div>
        </div>
      </div>
    `;
  }

  // 2. SLENDER DETAIL (Horizontal Sleek + Baris Alamat Ringkas ~250x84)
  if (style === "slender-detail") {
    return `
      <div class="flex items-center gap-3 p-3 rounded-2xl shadow-2xl border transition-all select-none ${
        isDark
          ? "bg-slate-900/95 border-slate-700/80 text-white backdrop-blur-md"
          : "bg-white/95 border-slate-200/90 text-slate-900 backdrop-blur-md"
      }" style="min-width: 245px; max-width: 280px;">
        <!-- Left Thumbnail -->
        <div class="w-[58px] h-[58px] rounded-xl overflow-hidden flex-shrink-0 bg-slate-100 shadow-sm relative">
          <img src="${photoSrc}" alt="${prop.kategori_properti}" class="w-full h-full object-cover" />
        </div>

        <!-- Right Info -->
        <div class="flex flex-col justify-center min-w-0 pr-1 flex-1">
          <div class="flex items-center justify-between gap-1">
            <h4 class="text-[12px] font-bold tracking-tight truncate leading-tight ${
              isDark ? "text-white" : "text-slate-900"
            }">
              ${prop.kategori_properti}
            </h4>
            <span class="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-semibold flex-shrink-0 ${
              prop.jenis_properti === "Sewa"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200/80"
                : "bg-blue-50 text-blue-700 border border-blue-200/80"
            }">
              ${badgeText}
            </span>
          </div>

          <p class="mt-1 text-[11px] leading-snug line-clamp-2 ${
            isDark ? "text-slate-300" : "text-slate-500"
          }">
            ${prop.alamat}
          </p>
        </div>
      </div>
    `;
  }

  // 3. VERTICAL CARD (Format Awal)
  return `
    <div class="w-[260px] bg-slate-900/95 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 font-sans backdrop-blur-md">
      <div class="relative w-full h-[120px] bg-slate-800 flex items-center justify-center overflow-hidden">
        <img src="${photoSrc}" alt="${prop.alamat}" class="w-full h-full object-cover" />
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
          prop.jenis_properti === "Sewa"
            ? "bg-amber-500/90 text-slate-950"
            : "bg-emerald-500/90 text-slate-950"
        }">
          ${prop.jenis_properti}
        </span>
      </div>
      <div class="p-3">
        <h4 class="text-xs font-semibold text-white line-clamp-2 leading-snug">${prop.alamat}</h4>
      </div>
    </div>
  `;
}

export default function PropertyLayer() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { popupStyle, themeMode } = usePropertyPopupConfig();
  const { properties } = useProperties(selectedStation?.area_id ?? null);

  const markersRef = useRef<maplibregl.Marker[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map) return;

    // Bersihkan marker dan popup sebelumnya
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (!selectedStation) return;

    properties.forEach((prop) => {
      const el = document.createElement("div");
      el.className = "property-marker-container select-none";

      el.innerHTML = `
        <div class="relative flex flex-col items-center group">
          <img 
            src="/assets/map/maker-property-default.svg" 
            alt="${prop.kategori_properti}" 
            class="w-[20px] h-[25px] object-contain transition-transform duration-200" 
            draggable="false"
          />
          <div class="absolute -top-6 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 px-2 py-0.5 bg-slate-900/90 text-amber-300 text-[9px] font-semibold rounded-md shadow-md whitespace-nowrap border border-slate-700/60 backdrop-blur-sm z-30">
            ${prop.kategori_properti} · ${prop.jenis_properti}
          </div>
        </div>
      `;

      const popupHTML = renderPopupHTML(
        prop,
        selectedStation.station_name,
        popupStyle,
        themeMode
      );

      const popup = new maplibregl.Popup({
        offset: [0, -22],
        closeButton: true,
        closeOnClick: true,
        maxWidth: "300px",
      }).setHTML(popupHTML);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }
        popup.setLngLat([prop.lng, prop.lat]).addTo(map);
        activePopupRef.current = popup;
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([prop.lng, prop.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    return () => {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
        activePopupRef.current = null;
      }
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
    };
  }, [map, selectedStation, popupStyle, themeMode, properties]);

  return null;
}
