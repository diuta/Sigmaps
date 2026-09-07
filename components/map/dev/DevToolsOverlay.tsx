"use client";

/**
 * components/map/dev/DevToolsOverlay.tsx
 * 🟡 DEV / EXPERIMENTAL ONLY — Floating Bottom-Center Dev Controller
 *
 * Kontrol dev tools untuk simulasi & visualisasi Isochrone (radius & bentuk).
 * (Varian Property Card sudah difiksasi ke Desain #4).
 */

import React, { useState } from "react";
import { useIsochroneConfig } from "@/hooks/isochrone/useIsochroneConfig";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";

export default function DevToolsOverlay() {
  const [isExpanded, setIsExpanded] = useState(false);

  // Isochrone Config
  const { options: isoOptions, setOptions: setIsoOptions, calculatedAreaKm2 } =
    useIsochroneConfig();

  const { selectedStation } = useSelectedStation();

  return (
    <aside
      aria-label="Unified Dev Tools"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center select-none"
    >
      {/* 1. Header Trigger Pill */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900/95 hover:bg-slate-800 text-slate-200 hover:text-white text-[11px] font-mono rounded-full border border-slate-700/80 shadow-2xl backdrop-blur-md transition-all duration-200"
      >
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-semibold text-amber-300">DEV TOOLS</span>
        <span className="text-slate-500">|</span>
        <span className="text-[11px] text-slate-300">🚶 Isochrone</span>
        <span className="text-[10px] text-slate-400 font-sans ml-1">
          {isExpanded ? "▲ Hide" : "▼ Open"}
        </span>
      </button>

      {/* 2. Expanded Card Body */}
      {isExpanded && (
        <div className="mt-2 w-[380px] max-w-[92vw] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-lg text-slate-200 text-xs font-sans transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
          {/* Sub-Header: Active Station */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[240px]">
              Stasiun:{" "}
              <strong className="text-white">
                {selectedStation ? selectedStation.station_name : "(Pilih di peta)"}
              </strong>
            </span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-[var(--color-brand)] text-white shadow-sm">
              🚶 Isochrone
            </span>
          </div>

          {/* ISOCHRONE SHAPE & RADIUS */}
          <div className="mt-2.5 space-y-2.5">
            {/* Presets & Area Live */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Preset:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setIsoOptions((p) => ({ ...p, radiusMeter: 400 }))}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                    isoOptions.radiusMeter === 400
                      ? "bg-[var(--color-brand)] text-white font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  5 Menit (~400m)
                </button>
                <button
                  type="button"
                  onClick={() => setIsoOptions((p) => ({ ...p, radiusMeter: 800 }))}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                    isoOptions.radiusMeter === 800
                      ? "bg-[var(--color-brand)] text-white font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  10 Menit (~800m)
                </button>
              </div>
            </div>

            {/* Mode Shape */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] text-slate-400 font-medium">Shape:</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setIsoOptions((p) => ({ ...p, mode: "organic" }))}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    isoOptions.mode === "organic"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Kontur Organik
                </button>
                <button
                  type="button"
                  onClick={() => setIsoOptions((p) => ({ ...p, mode: "radius" }))}
                  className={`px-2 py-0.5 rounded text-[10px] transition-all ${
                    isoOptions.mode === "radius"
                      ? "bg-indigo-600 text-white font-semibold"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  Radius Buffer
                </button>
              </div>
            </div>

            {/* Radius Slider & Area Readout */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                <span>Radius: <strong className="text-white font-mono">{isoOptions.radiusMeter}m</strong></span>
                <span className="text-indigo-300 font-mono">Area: {calculatedAreaKm2.toFixed(3)} km²</span>
              </div>
              <input
                type="range"
                min={200}
                max={1600}
                step={50}
                value={isoOptions.radiusMeter}
                onChange={(e) =>
                  setIsoOptions((prev) => ({
                    ...prev,
                    radiusMeter: Number(e.target.value),
                  }))
                }
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>

          <div className="mt-3 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px] text-slate-500">
            <span>🟡 Dev Mode — Easily Deletable</span>
            <button
              onClick={() => setIsExpanded(false)}
              className="hover:text-slate-300 transition-colors"
            >
              Close ✕
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
