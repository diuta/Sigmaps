"use client";

/**
 * components/map/layers/PropertyLayer.tsx
 * ZONA CACA — Property Units Pin Layer
 *
 * Mendukung template popup yang dapat diganti via `usePropertyPopupConfig()`:
 * - 'sleek': Compact horizontal pill (sesuai referensi Figma 200x72)
 * - 'slender-detail': Horizontal sleek + baris alamat ringkas
 * - 'vertical-card': Format kartu vertikal awal
 * - 'vertical-card-v2': Premium redesign — full-bleed photo, gradient, kategori + badge overlay
 *
 * Anti-overlap: resolveOverlaps() menyebarkan pin yang posisinya sangat berdekatan
 * ke spiral kecil supaya tidak saling menumpuk.
 */

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
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
  if (style === "vertical-card") {
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

  // 4. VERTICAL CARD V2 — Light mode, clean design
  const badgeColorV2 =
    prop.jenis_properti === "Sewa"
      ? "background:#F59E0B;color:#431407"
      : "background:#10B981;color:#052e16";
  const badgeLabelV2 = prop.jenis_properti === "Sewa" ? "DISEWA" : "DIJUAL";

  return `
    <div style="width:252px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.06);font-family:system-ui,-apple-system,sans-serif">
      <div style="position:relative;width:100%;height:144px;overflow:hidden;background:#f1f5f9">
        <img src="${photoSrc}" alt="${prop.kategori_properti}" style="width:100%;height:100%;object-fit:cover;display:block" />
        <!-- Very light bottom scrim so category text stays readable -->
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,0.28) 100%)"></div>
        <!-- Badge top-left -->
        <span style="position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.07em;${badgeColorV2}">${badgeLabelV2}</span>
        <!-- Category title over scrim at bottom -->
        <div style="position:absolute;bottom:9px;left:11px;right:11px;font-size:15px;font-weight:700;color:#fff;line-height:1.25;letter-spacing:-0.01em;text-shadow:0 1px 6px rgba(0,0,0,0.5)">${prop.kategori_properti}</div>
      </div>
      <!-- Body: just the address -->
      <div style="padding:9px 12px 11px">
        <p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${prop.alamat}</p>
      </div>
    </div>
  `;
}

/**
 * Anti-overlap: properti dengan koordinat identik / sangat berdekatan (≤ ~3m)
 * dikelompokkan, lalu masing-masing digeser ke titik berbeda dalam lingkaran kecil
 * (radius ≈ 13m) sehingga pin tidak menumpuk satu sama lain.
 */
function resolveOverlaps(
  props: PropertyUnit[],
  spreadDeg = 0.00015
): Array<{ prop: PropertyUnit; lng: number; lat: number }> {
  const BUCKET = 0.00003; // ~3m
  const snap = (v: number) => Math.round(v / BUCKET) * BUCKET;

  const groups = new Map<string, PropertyUnit[]>();
  for (const prop of props) {
    const key = `${snap(prop.lng).toFixed(6)},${snap(prop.lat).toFixed(6)}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(prop);
  }

  const result: Array<{ prop: PropertyUnit; lng: number; lat: number }> = [];

  for (const [, group] of groups) {
    if (group.length === 1) {
      result.push({ prop: group[0], lng: group[0].lng, lat: group[0].lat });
      continue;
    }
    // Sebarkan ke posisi-posisi sekeliling titik pusat (mulai dari atas, searah jam)
    const angleStep = (2 * Math.PI) / group.length;
    group.forEach((prop, i) => {
      const angle = -Math.PI / 2 + i * angleStep;
      result.push({
        prop,
        lng: prop.lng + Math.cos(angle) * spreadDeg,
        lat: prop.lat + Math.sin(angle) * spreadDeg * 0.65,
      });
    });
  }

  return result;
}


export default function PropertyLayer() {
  const { map } = useMapInstance();
  const { selectedStation } = useSelectedStation();
  const { selectedProperty } = useSelectedProperty();
  const { popupStyle, themeMode } = usePropertyPopupConfig();
  const { properties } = useProperties(selectedStation?.area_id ?? null);

  const markersRef = useRef<maplibregl.Marker[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  // Map property id → its Popup instance for programmatic open from sidebar
  const popupMapRef = useRef<Map<string, { popup: maplibregl.Popup; prop: PropertyUnit }>>(new Map());

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

    const placed = resolveOverlaps(properties);

    placed.forEach(({ prop, lng, lat }) => {
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
        // anchor: 'bottom' → popup tip points down at the lnglat.
        // offset [0, -30]: tip sits 30px above lnglat (5px clear gap above the
        // 25px-tall pin svg whose anchor is 'bottom' = tip at lnglat).
        // This is the ONLY place this offset is set — keeps positioning consistent
        // regardless of popup content height.
        anchor: "bottom",
        offset: [0, -30] as [number, number],
        closeButton: true,
        closeOnClick: true,
        maxWidth: "300px",
      }).setHTML(popupHTML);

      // Simpan dengan koordinat offset agar sidebar-click bisa buka di posisi yang benar
      popupMapRef.current.set(prop.id, { popup, prop: { ...prop, lng, lat } });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }
        popup.setLngLat([lng, lat]).addTo(map);
        activePopupRef.current = popup;
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([lng, lat])
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
      popupMapRef.current.clear();
    };
  }, [map, selectedStation, popupStyle, themeMode, properties]);

  // 2. React to selectedProperty (klik dari sidebar) → buka popup pin yang sesuai
  useEffect(() => {
    if (!map || !selectedProperty) return;

    const entry = popupMapRef.current.get(selectedProperty.id);
    if (!entry) return; // properti mungkin belum di-render (stasiun berbeda)

    if (activePopupRef.current) {
      activePopupRef.current.remove();
    }
    entry.popup.setLngLat([entry.prop.lng, entry.prop.lat]).addTo(map);
    activePopupRef.current = entry.popup;
  }, [map, selectedProperty]);

  return null;
}
