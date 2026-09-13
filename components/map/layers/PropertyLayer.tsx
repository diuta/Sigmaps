"use client";

/**
 * components/map/layers/PropertyLayer.tsx
 * ZONA CACA — Property Units Pin Layer
 *
 * Clean & focused map pin layer:
 * - Shows pins for properties around selected station
 * - Pin click displays a clean property preview popup with "Lihat Detail ›"
 * - Clicking the popup opens the full Property Detail view in the sidebar
 * - Compare actions are intentionally kept exclusively inside Property Detail
 *
 * Anti-overlap: resolveOverlaps() spreads closely positioned pins onto a small spiral.
 */

import { useEffect, useRef, useMemo } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { usePropertyFilter } from "@/hooks/property/usePropertyFilter";
import type { PropertyUnit } from "@/types/property";
import { useProperties } from "@/hooks/property/useProperties";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import { matchesPropertyFilter } from "@/lib/property/filter";

function renderPopupHTML(prop: PropertyUnit): string {
  const photoSrc =
    prop.foto_tampak_depan ||
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=300&auto=format&fit=crop&q=80";

  const sewa = (prop.jenis_properti || "").toLowerCase().includes("sewa");
  const badgeColor = sewa
    ? "background:#F59E0B;color:#431407"
    : "background:#10B981;color:#052e16";
  const badgeLabel = sewa ? "DISEWA" : "DIJUAL";
  const jalanKaki = formatJalanKaki(prop.jarak_jalan_m, prop.waktu_jalan_s);
  const barisJarak = jalanKaki
    ? `<p style="margin:5px 0 0;font-size:11px;font-weight:600;color:#1e40af;line-height:1.4">🚶 ${jalanKaki}</p>`
    : "";

  return `
    <div style="width:248px;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.18),0 2px 8px rgba(0,0,0,0.08);border:1px solid rgba(0,0,0,0.06);font-family:system-ui,-apple-system,sans-serif;cursor:pointer">
      <div style="position:relative;width:100%;height:140px;overflow:hidden;background:#f1f5f9">
        <img src="${photoSrc}" alt="${prop.kategori_properti}" style="width:100%;height:100%;object-fit:cover;display:block" />
        <div style="position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0) 40%,rgba(0,0,0,0.28) 100%)"></div>
        <span style="position:absolute;top:10px;left:10px;padding:3px 10px;border-radius:20px;font-size:10px;font-weight:800;letter-spacing:0.07em;${badgeColor}">${badgeLabel}</span>
        <div style="position:absolute;bottom:9px;left:11px;right:11px;font-size:15px;font-weight:700;color:#fff;line-height:1.25;letter-spacing:-0.01em;text-shadow:0 1px 6px rgba(0,0,0,0.5)">${prop.kategori_properti}</div>
      </div>
      <div style="padding:10px 12px 11px">
        <p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">${prop.alamat}</p>
        ${barisJarak}
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:flex-end;gap:3px;color:#2563eb;font-size:11px;font-weight:700">
          <span>Lihat Detail</span>
          <span style="font-size:13px;line-height:1">›</span>
        </div>
      </div>
    </div>
  `;
}

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
      const angle = i * angleStep - Math.PI / 2;
      result.push({
        prop,
        lng: prop.lng + spreadDeg * Math.cos(angle),
        lat: prop.lat + spreadDeg * Math.sin(angle),
      });
    });
  }

  return result;
}

export default function PropertyLayer() {
  const { map } = useMapInstance();
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { stations } = useStations();
  const { properties } = useProperties("all");
  const { selectedProperty, setSelectedProperty, setPreviewProperty } = useSelectedProperty();
  const { propertyTypes, transactionTypes, hasPhotoOnly } = usePropertyFilter();

  // Predikatnya di lib/property/filter.ts — sama persis dengan PropertyList & StationSearchBar.
  const filteredProperties = useMemo(
    () =>
      properties.filter((prop) =>
        matchesPropertyFilter(prop, { propertyTypes, transactionTypes, hasPhotoOnly }),
      ),
    [properties, propertyTypes, transactionTypes, hasPhotoOnly],
  );

  const markersRef = useRef<maplibregl.Marker[]>([]);
  const activePopupRef = useRef<maplibregl.Popup | null>(null);
  // Map property id → its Popup instance for programmatic open from sidebar
  const popupMapRef = useRef<Map<string, { popup: maplibregl.Popup; prop: PropertyUnit }>>(new Map());

  function handleSelectProperty(prop: PropertyUnit) {
    if (prop.station_id && (!selectedStation || selectedStation.area_id !== prop.station_id)) {
      const targetStation = stations?.features.find(
        (f) => f.properties.station_id === prop.station_id
      );
      if (targetStation && targetStation.geometry) {
        setSelectedStation({
          area_id: targetStation.properties.station_id,
          station_name: targetStation.properties.nama,
          lng: targetStation.geometry.coordinates[0],
          lat: targetStation.geometry.coordinates[1],
          is_rankable: targetStation.properties.is_rankable !== false,
        });
      }
    }
    setSelectedProperty({ ...prop });
  }

  useEffect(() => {
    if (!map) return;

    // Bersihkan marker dan popup sebelumnya
    if (activePopupRef.current) {
      activePopupRef.current.remove();
      activePopupRef.current = null;
    }
    setPreviewProperty(null);
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    const placed = resolveOverlaps(filteredProperties);

    placed.forEach(({ prop, lng, lat }) => {
      const isCurrentStation = Boolean(selectedStation && prop.station_id === selectedStation.area_id);
      const el = document.createElement("div");
      el.className = `property-marker-container select-none cursor-pointer transition-transform duration-200 ${
        isCurrentStation ? "z-20 scale-100" : "z-10 opacity-80 hover:opacity-100 hover:scale-110"
      }`;

      const svgSrc = isCurrentStation
        ? "/assets/map/maker-property-default.svg"
        : "/assets/map/marker-property-unselected.svg";

      el.innerHTML = `
        <div class="relative flex flex-col items-center group">
          <img 
            src="${svgSrc}" 
            alt="${prop.kategori_properti}" 
            class="${isCurrentStation ? "w-[22px] h-[27px]" : "w-[19px] h-[24px]"} object-contain transition-transform duration-200" 
            draggable="false"
          />
          <div class="absolute -top-6 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-150 px-2 py-0.5 bg-slate-900/90 text-amber-300 text-[9px] font-semibold rounded-md shadow-md whitespace-nowrap border border-slate-700/60 backdrop-blur-sm z-30">
            ${prop.kategori_properti} · ${prop.jenis_properti}
          </div>
        </div>
      `;

      const popupEl = document.createElement("div");
      popupEl.className = "property-popup-interactive select-none";
      popupEl.innerHTML = renderPopupHTML(prop);

      popupEl.addEventListener("click", (e) => {
        e.stopPropagation();
        handleSelectProperty(prop);
      });

      const popup = new maplibregl.Popup({
        className: "property-card-popup",
        anchor: "bottom",
        offset: [0, -30] as [number, number],
        closeButton: true,
        closeOnClick: true,
        maxWidth: "300px",
      }).setDOMContent(popupEl);

      // Popup terbuka = properti "dipratinjau": RouteLayer langsung menggambar rutenya.
      // Ditutup (tombol X / klik peta / popup lain dibuka) = pratinjau selesai.
      popup.on("open", () => {
        setPreviewProperty({ ...prop, lng, lat });
      });
      popup.on("close", () => {
        if (activePopupRef.current === popup) {
          activePopupRef.current = null;
        }
        setPreviewProperty((current) => (current?.id === prop.id ? null : current));
      });

      // Simpan dengan koordinat offset agar sidebar-click bisa buka di posisi yang benar
      popupMapRef.current.set(prop.id, { popup, prop: { ...prop, lng, lat } });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (activePopupRef.current === popup) {
          handleSelectProperty(prop);
          return;
        }
        if (activePopupRef.current) {
          activePopupRef.current.remove();
        }
        popup.setLngLat([lng, lat]).addTo(map);
        activePopupRef.current = popup;
        handleSelectProperty(prop);
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
  }, [map, selectedStation, filteredProperties, stations, setSelectedStation, setSelectedProperty, setPreviewProperty]);

  // 2. React to selectedProperty (klik dari sidebar atau peta) → buka popup pin yang sesuai
  useEffect(() => {
    if (!map || !selectedProperty) return;

    const entry = popupMapRef.current.get(selectedProperty.id);
    if (!entry) return; // properti mungkin belum di-render (stasiun berbeda)

    if (activePopupRef.current !== entry.popup) {
      if (activePopupRef.current) {
        activePopupRef.current.remove();
      }
      entry.popup.setLngLat([entry.prop.lng, entry.prop.lat]).addTo(map);
      activePopupRef.current = entry.popup;
    }
  }, [map, selectedProperty]);

  return null;
}
