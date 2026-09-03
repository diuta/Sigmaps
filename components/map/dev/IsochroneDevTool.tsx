"use client";

/**
 * components/map/dev/IsochroneDevTool.tsx
 * 🟡 DEV / EXPERIMENTAL ONLY — Floating Bottom-Center Isochrone Controller
 *
 * Tujuan:
 * 1. Bereksperimen dengan durasi isokron (5 vs 10 Menit)
 * 2. Menguji mode bentuk (Organik Kontur vs Radius Buffer Murni)
 * 3. Mengatur radius meter manual dan melihat perhitungan live `area_km2` (kebutuhan rumus C)
 *
 * ⛔ EASILY DELETABLE: Komponen ini dan folder dev/ dapat langsung dihapus
 * saat poligon GeoJSON final dari MAPID (Jalur 2) sudah tersedia.
 */

import React, { useState } from "react";
import { useIsochroneConfig } from "@/hooks/useIsochroneConfig";
import { useSelectedStation } from "@/hooks/useSelectedStation";

export default function IsochroneDevTool() {
  const { options, setOptions, calculatedAreaKm2 } = useIsochroneConfig();
  const { selectedStation } = useSelectedStation();
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <aside aria-label="Isochrone Dev Tool" className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center">
      {/* Dev Badge / Toggle Header */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-mono rounded-full border border-slate-700/60 shadow-lg backdrop-blur-md transition-all duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-semibold text-amber-300">DEV TOOL:</span> Isochrone Shape & Radius
        <span className="text-[10px] text-slate-400 ml-1">
          {isMinimized ? "▲ Expand" : "▼ Collapse"}
        </span>
      </button>

      {/* Expanded Control Panel */}
      {!isMinimized && (
        <div className="mt-2 w-[420px] max-w-[92vw] bg-slate-900/95 border border-slate-700/70 rounded-xl p-3.5 shadow-2xl backdrop-blur-md text-slate-200 text-xs font-sans transition-all duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-[11px] font-mono text-slate-400">
              Active Station:{" "}
              <strong className="text-white">
                {selectedStation ? selectedStation.station_name : "(None selected)"}
              </strong>
            </span>
            <span className="text-[11px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-700/40 px-2 py-0.5 rounded">
              Area: {calculatedAreaKm2 > 0 ? `${calculatedAreaKm2.toFixed(3)} km²` : "0 km²"}
            </span>
          </div>

          {/* Quick Presets: 5 vs 10 Min */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Preset:</span>
            <div className="flex gap-1.5 flex-1 justify-end">
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, radiusMeter: 400 }))}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  options.radiusMeter === 400
                    ? "bg-[var(--color-brand)] text-white shadow-sm font-semibold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                5 Menit (~400m)
              </button>
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, radiusMeter: 800 }))}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  options.radiusMeter === 800
                    ? "bg-[var(--color-brand)] text-white shadow-sm font-semibold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                10 Menit (~800m)
              </button>
            </div>
          </div>

          {/* Mode Switch: Organic vs Radius */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-400 font-medium">Shape Mode:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, mode: "organic" }))}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                  options.mode === "organic"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Kontur Organik (Jalan)
              </button>
              <button
                type="button"
                onClick={() => setOptions((prev) => ({ ...prev, mode: "radius" }))}
                className={`px-2.5 py-1 rounded-md text-[11px] transition-all ${
                  options.mode === "radius"
                    ? "bg-indigo-600 text-white font-semibold"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                Radius Buffer Murni
              </button>
            </div>
          </div>

          {/* Slider Radius Meter */}
          <div className="mt-3 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span>Manual Radius Jarak:</span>
              <span className="font-mono text-white font-semibold">
                {options.radiusMeter} meter
              </span>
            </div>
            <input
              type="range"
              min={200}
              max={1600}
              step={50}
              value={options.radiusMeter}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  radiusMeter: Number(e.target.value),
                }))
              }
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          <p className="mt-2 text-[10px] text-amber-300/80 leading-tight">
            *Tool sementara ini digunakan untuk menguji simulasi luas kawasan (area_km2) penyebut rumus C sebelum GeoJSON resmi dari MAPID siap.
          </p>
        </div>
      )}
    </aside>
  );
}
