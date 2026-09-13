"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { useMapInstance } from "@/hooks/map/useMapInstance";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useStations } from "@/hooks/station/useStations";
import { useBriefResult } from "@/hooks/brief/useBriefResult";

interface StationMarkerData {
  station_id: string;
  station_name: string;
  lng: number;
  lat: number;
  rank: number | null;
  dataBelumCukup: boolean;
}

export default function StationLayer() {
  const { map } = useMapInstance();
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { stations } = useStations();
  const { scoreResult } = useBriefResult();
  const markersRef = useRef<Map<string, { marker: maplibregl.Marker; el: HTMLDivElement }>>(
    new Map()
  );

  const stationMarkers: StationMarkerData[] = (stations?.features ?? [])
    .filter((feature) => feature.geometry !== null)
    .map((feature) => {
      const areaIndex = scoreResult?.areas.findIndex(
        (area) => area.station_id === feature.properties.station_id
      );
      const found = areaIndex !== undefined && areaIndex >= 0;

      return {
        station_id: feature.properties.station_id,
        station_name: feature.properties.nama,
        lng: feature.geometry!.coordinates[0],
        lat: feature.geometry!.coordinates[1],
        rank: found ? areaIndex! + 1 : null,
        dataBelumCukup: feature.properties.is_rankable === false,
      };
    });

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    stationMarkers.forEach((station) => {
      const el = document.createElement("div");
      el.className = "station-marker-container state-idle";
      el.setAttribute("data-area-id", station.station_id);

      const svgSrc = station.dataBelumCukup
        ? "/assets/map/marker-station-inactive.svg"
        : "/assets/map/marker-station-active.svg";

      if (station.dataBelumCukup) {
        el.classList.add("is-inactive");
      }

      el.innerHTML = `
        <div class="marker-active-pulse-container"></div>
        <div class="relative flex flex-col items-center select-none pointer-events-auto">
          <div class="station-label mb-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-tight whitespace-nowrap shadow-xl backdrop-blur-md transition-all duration-200 ${
            station.dataBelumCukup
              ? "bg-slate-800/85 text-slate-300 border border-slate-600/40 text-[10px]"
              : "bg-slate-900/90 text-white border border-slate-700/70"
          }">
            ${
              station.rank !== null
                ? `<span class="px-1.5 py-0.2 bg-[var(--color-brand)] text-white text-[10px] font-extrabold rounded-full shadow-sm">
                    #${station.rank}
                  </span>`
                : ""
            }
            <span>${station.station_name}</span>
            ${station.dataBelumCukup ? ' <span class="text-[9px] text-amber-300 font-normal">· Data belum cukup</span>' : ""}
          </div>

          <div class="relative flex items-center justify-center">
            <img
              src="${svgSrc}"
              alt="${station.station_name}"
              class="${station.dataBelumCukup
                ? 'w-[56px] h-[62px]'
                : 'w-[80px] h-[88px]'
              } object-contain transition-transform duration-200"
              draggable="false"
            />
          </div>
        </div>
      `;

      el.addEventListener("mouseenter", () => {
        if (selectedStation?.area_id !== station.station_id) {
          el.classList.remove("state-idle");
          el.classList.add("state-hover");
        }
      });

      el.addEventListener("mouseleave", () => {
        if (selectedStation?.area_id !== station.station_id) {
          el.classList.remove("state-hover");
          el.classList.add("state-idle");
        }
      });

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelectedStation({
          area_id: station.station_id,
          station_name: station.station_name,
          lng: station.lng,
          lat: station.lat,
          is_rankable: !station.dataBelumCukup,
        });
      });

      const marker = new maplibregl.Marker({
        element: el,
        anchor: "bottom",
      })
        .setLngLat([station.lng, station.lat])
        .addTo(map);

      markersRef.current.set(station.station_id, { marker, el });
    });

    const markersAtMount = markersRef.current;
    return () => {
      markersAtMount.forEach(({ marker }) => marker.remove());
      markersAtMount.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, stations, scoreResult]);

  useEffect(() => {
    markersRef.current.forEach(({ el }, stationId) => {
      const isSelected = selectedStation?.area_id === stationId;
      const pulseContainer = el.querySelector(".marker-active-pulse-container");

      if (isSelected) {
        el.classList.remove("state-idle", "state-hover");
        el.classList.add("state-active");
        if (pulseContainer && !pulseContainer.querySelector(".marker-active-pulse")) {
          pulseContainer.innerHTML = '<div class="marker-active-pulse"></div>';
        }
      } else {
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
