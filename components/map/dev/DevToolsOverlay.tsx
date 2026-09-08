"use client";

/**
 * components/map/dev/DevToolsOverlay.tsx
 * 🟡 DEV / EXPERIMENTAL ONLY — Unified Floating Bottom-Center Dev Controller
 *
 * Menggabungkan kontrol Isochrone & Property Popup ke dalam satu panel tunggal
 * dengan tab atas-bawah yang rapi, bersih, dan mudah dihapus saat final.
 */

import React, { useState } from "react";
import { useIsochroneConfig } from "@/hooks/isochrone/useIsochroneConfig";
import { usePropertyPopupConfig } from "@/hooks/property/usePropertyPopupConfig";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";

export default function DevToolsOverlay() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"isochrone" | "popup">("popup");

  // Isochrone Config — tinggal pembacaan luas saja.
  // Kontrol radius/mode sudah dihapus: bentuk poligon sekarang datang asli dari
  // MAPID Isochrone Tool lewat /api/stations dan tidak bisa diubah dari klien.
  const { calculatedAreaKm2 } = useIsochroneConfig();

  // Property Popup Config
  const { popupStyle, setPopupStyle, themeMode, setThemeMode } =
    usePropertyPopupConfig();

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
        <span className="text-[11px] text-slate-300">
          {activeTab === "isochrone" ? "🚶 Isochrone" : "🏢 Property Card"}
        </span>
        <span className="text-[10px] text-slate-400 font-sans ml-1">
          {isExpanded ? "▲ Hide" : "▼ Open"}
        </span>
      </button>

      {/* 2. Expanded Card Body */}
      {isExpanded && (
        <div className="mt-2 w-[400px] max-w-[92vw] bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-lg text-slate-200 text-xs font-sans transition-all duration-200 animate-in fade-in slide-in-from-bottom-2">
          {/* Sub-Header: Active Station & Tab Switches */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-[11px] font-mono text-slate-400 truncate max-w-[170px]">
              Stasiun:{" "}
              <strong className="text-white">
                {selectedStation ? selectedStation.station_name : "(Pilih di peta)"}
              </strong>
            </span>

            {/* Navigation Tabs (Atas / Bawah Switcher) */}
            <div className="flex p-0.5 bg-slate-800/90 rounded-lg border border-slate-700/50">
              <button
                type="button"
                onClick={() => setActiveTab("popup")}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  activeTab === "popup"
                    ? "bg-emerald-600 text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🏢 Property Card
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("isochrone")}
                className={`px-2.5 py-0.5 rounded-md text-[10px] font-medium transition-all ${
                  activeTab === "isochrone"
                    ? "bg-[var(--color-brand)] text-white font-semibold shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                🚶 Isochrone
              </button>
            </div>
          </div>

          {/* TAB 1: PROPERTY POPUP DESIGNS */}
          {activeTab === "popup" && (
            <div className="mt-2.5 space-y-2.5">
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1">
                  Varian Desain Card:
                </span>
                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPopupStyle("sleek")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all ${
                      popupStyle === "sleek"
                        ? "bg-emerald-600/90 text-white font-semibold border border-emerald-400/40 shadow-sm"
                        : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70"
                    }`}
                  >
                    <span>✨ 1. Sleek Compact (Figma 200x72)</span>
                    <span className="text-[9px] opacity-75 font-mono">Horizontal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPopupStyle("slender-detail")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all ${
                      popupStyle === "slender-detail"
                        ? "bg-emerald-600/90 text-white font-semibold border border-emerald-400/40 shadow-sm"
                        : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70"
                    }`}
                  >
                    <span>🏢 2. Slender + Alamat Jalan</span>
                    <span className="text-[9px] opacity-75 font-mono">+Address</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPopupStyle("vertical-card")}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] text-left transition-all ${
                      popupStyle === "vertical-card"
                        ? "bg-emerald-600/90 text-white font-semibold border border-emerald-400/40 shadow-sm"
                        : "bg-slate-800/70 text-slate-300 hover:bg-slate-700/70"
                    }`}
                  >
                    <span>📦 3. Vertical Card (Format Awal)</span>
                    <span className="text-[9px] opacity-75 font-mono">Tall</span>
                  </button>
                </div>
              </div>

              {/* Theme Toggle */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Card Theme:</span>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setThemeMode("light")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      themeMode === "light"
                        ? "bg-white text-slate-900 font-bold shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Light (Figma)
                  </button>
                  <button
                    type="button"
                    onClick={() => setThemeMode("dark")}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                      themeMode === "dark"
                        ? "bg-slate-700 text-white font-bold shadow-sm"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    Dark Mode
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ISOCHRONE — HANYA BACA */}
          {activeTab === "isochrone" && (
            <div className="mt-2.5 space-y-2.5">
              <div className="rounded-lg bg-slate-800/70 px-2.5 py-2 space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Sumber poligon</span>
                  <span className="text-white font-mono">MAPID Isochrone Tool</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Profil</span>
                  <span className="text-white font-mono">foot &middot; 600 detik</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-400">Luas kawasan</span>
                  <span className="text-indigo-300 font-mono">
                    {calculatedAreaKm2 > 0 ? `${calculatedAreaKm2.toFixed(3)} km²` : "—"}
                  </span>
                </div>
              </div>

              <p className="text-[10px] leading-relaxed text-slate-500">
                Kontrol radius dan bentuk sudah dihapus. Poligonnya keluaran MAPID apa
                adanya dan tidak dapat diubah dari klien — luas di atas dihitung PostGIS
                dengan <span className="font-mono">ST_Area(geom::geography)</span>, angka
                yang sama persis dipakai sebagai penyebut rumus C.
              </p>
            </div>
          )}

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
