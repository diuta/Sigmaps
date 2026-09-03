"use client";

/**
 * components/map/layers/PropertyLayer.tsx
 * ZONA CACA — Property Units Pin Layer
 *
 * Sesuai context-mvp.md §2 Langkah 4:
 * - Menampilkan titik properti di sekitar stasiun aktif (`selectedStation`).
 * - Menggunakan aset SVG oranye: `/assets/map/maker-property-default.svg`.
 * - Interaksi Klik: Membuka mini popover foto tampak depan + alamat.
 *
 * ⛔ STRICT DATA GUARDRAILS:
 * Dilarang menampilkan harga, luas tanah/bangunan, atau kontak pemilik.
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/useMapInstance";
import { useSelectedStation } from "@/hooks/useSelectedStation";
import type { PropertyUnit } from "@/types/property";

// 🟡 FASE DUMMY: swap ke fetch(/api/properties?station_id=...) saat backend siap
import { DUMMY_PROPERTIES } from "@/lib/dummy/properties";

export default function PropertyLayer() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();

  const markersRef = useRef<maplibregl.Marker[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map) return;

    // 1. Bersihkan marker dan popup sebelumnya
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // 2. Jika tidak ada stasiun aktif, tidak perlu merender properti
    if (!selectedStation) return;

    // 3. Ambil data properti untuk stasiun yang sedang dipilih
    // 🟡 FASE DUMMY: nanti diganti fetch(`/api/properties?station_id=${selectedStation.area_id}`)
    const properties: PropertyUnit[] =
      DUMMY_PROPERTIES[selectedStation.area_id] || [];

    properties.forEach((prop) => {
      const el = document.createElement("div");
      el.className = "property-marker-container select-none";

      el.innerHTML = `
        <div class="relative flex flex-col items-center group">
          <!-- Property Pin SVG (Compact secondary marker ~20x25px) -->
          <img 
            src="/assets/map/maker-property-default.svg" 
            alt="${prop.kategori_properti}" 
            class="w-[20px] h-[25px] object-contain transition-transform duration-200" 
            draggable="false"
          />

          <!-- Mini Hover Tag -->
          <div class="absolute -top-6 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 px-2 py-0.5 bg-slate-900/90 text-amber-300 text-[9px] font-semibold rounded-md shadow-md whitespace-nowrap border border-slate-700/60 backdrop-blur-sm z-30">
            ${prop.kategori_properti} · ${prop.jenis_properti}
          </div>
        </div>
      `;

      // HTML konten untuk Popover Card saat pin diklik
      const popupContent = `
        <div class="w-[260px] bg-slate-900/95 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700/80 font-sans backdrop-blur-md">
          <!-- Foto Tampak Depan -->
          <div class="relative w-full h-[120px] bg-slate-800 flex items-center justify-center overflow-hidden">
            ${
              prop.foto_tampak_depan
                ? `<img src="${prop.foto_tampak_depan}" alt="${prop.alamat}" class="w-full h-full object-cover" />`
                : `<span class="text-[11px] text-slate-400 italic">Foto tidak tersedia</span>`
            }
            <span class="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
              prop.jenis_properti === "Sewa"
                ? "bg-amber-500/90 text-slate-950"
                : "bg-emerald-500/90 text-slate-950"
            }">
              ${prop.jenis_properti}
            </span>
            <span class="absolute top-2 right-8 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-950/70 text-slate-200 border border-slate-700/50">
              ${prop.kategori_properti}
            </span>
          </div>

          <!-- Info Alamat -->
          <div class="p-3">
            <h4 class="text-xs font-semibold text-white line-clamp-2 leading-snug">
              ${prop.alamat}
            </h4>
            <div class="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Unit di sekitar ${selectedStation.station_name}</span>
              <span class="text-emerald-400 font-medium">Tersedia</span>
            </div>
          </div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: [0, -24],
        closeButton: true,
        closeOnClick: true,
        maxWidth: "280px",
      }).setHTML(popupContent);

      // Event click pin -> buka popup
      el.addEventListener("click", (e) => {
        e.stopPropagation();

        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }

        popup.setLngLat([prop.lng, prop.lat]).addTo(map);
        activePopupRef.current = popup;
      });

      // Pasang Marker ke Map
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
  }, [map, selectedStation]);

  return null;
}
