"use client";

/**
 * components/map/StationSearchBar.tsx
 *
 * Floating Station & Property Search Bar di atas kanvas peta:
 * - Pencarian cepat (fuzzy match) 43 stasiun KRL Jabodetabek & properti terkait.
 * - Multi-select filter tipe properti: Rumah, Kos, Ruko, Kantor, Tanah, Retail.
 * - Multi-select filter jenis transaksi: Disewa, Dijual, serta foto fisik terverifikasi.
 * - Filter kawasan stasiun: Data Lengkap, Data Minim, Top AI Rekomendasi.
 * - Akurat & Intuitif:
 *   1. Memfilter stasiun yang benar-benar memiliki properti sesuai filter yang dipilih.
 *   2. Daftar stasiun langsung terlihat dan ter-update seketika di bawah filter tanpa harus menutup panel filter.
 *   3. Default: Filter tertutup saat awal load, dan terbuka saat tombol [Filter] diklik.
 * - Posisi responsif & tersinkronisasi mulus dengan pergerakan sidebar.
 * - Aksesibilitas: Keyboard shortcut (⌘K / Ctrl+K), panah (Arrow Up/Down), Enter, dan Escape.
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useStations } from "@/hooks/station/useStations";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";
import { usePropertyFilter } from "@/hooks/property/usePropertyFilter";
import { useAllPropertiesSummary } from "@/hooks/property/useAllPropertiesSummary";
import type { StationLocation } from "@/types/station";
import {
  PROPERTY_TYPES,
  TRANSACTION_TYPES,
  matchesPropertyType,
  matchesTransactionType,
} from "@/lib/property/filter";

const SIDEBAR_CLOSED_PX = 24;
const GAP_PX = 16;
const BASE_LEFT_PX = SIDEBAR_CLOSED_PX + GAP_PX; // 40px
const TRANSLATE_OPEN_PX = 380 - SIDEBAR_CLOSED_PX; // 356px
/** Ruang yang disisakan di kanan untuk MapNavigationControl (zoom +/- & recenter). */
const RIGHT_GUTTER_PX = 64;

interface SearchItem extends StationLocation {
  rank: number | null;
  dataBelumCukup: boolean;
}

export default function StationSearchBar() {
  const { stations } = useStations();
  const { scoreResult } = useBriefResult();
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { sidebarOpen } = useSidebarOpen();

  // Data ringkasan properti per stasiun dari database Supabase
  const { stationPropertyMap } = useAllPropertiesSummary();

  const {
    propertyTypes,
    transactionTypes,
    stationTier,
    hasPhotoOnly,
    togglePropertyType,
    toggleTransactionType,
    toggleStationTier,
    toggleHasPhotoOnly,
    resetFilters,
    activeFilterCount,
  } = usePropertyFilter();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  // Default: Filter drawer tertutup saat awal halaman dimuat
  const [showFilters, setShowFilters] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Posisi bergeser sinkron dengan Sidebar (persis MapLegend)
  const translateX = sidebarOpen ? TRANSLATE_OPEN_PX : 0;

  // Siapkan daftar seluruh stasiun dengan info ranking terkini
  const allStations: SearchItem[] = useMemo(() => {
    return (stations?.features ?? [])
      .filter((f) => f.geometry !== null)
      .map((f) => {
        const areaIndex = scoreResult?.areas.findIndex(
          (area) => area.station_id === f.properties.station_id
        );
        const found = areaIndex !== undefined && areaIndex >= 0;

        return {
          area_id: f.properties.station_id,
          station_name: f.properties.nama,
          lng: f.geometry!.coordinates[0],
          lat: f.geometry!.coordinates[1],
          is_rankable: f.properties.is_rankable !== false,
          rank: found ? areaIndex! + 1 : null,
          dataBelumCukup: f.properties.is_rankable === false,
        };
      })
      .sort((a, b) => {
        if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
        if (a.rank !== null) return -1;
        if (b.rank !== null) return 1;
        if (a.is_rankable && !b.is_rankable) return -1;
        if (!a.is_rankable && b.is_rankable) return 1;
        return a.station_name.localeCompare(b.station_name);
      });
  }, [stations, scoreResult]);

  // Hitung jumlah stasiun per kategori data stasiun
  const stationTierCounts = useMemo(() => {
    const recommended = allStations.filter((s) => s.rank !== null).length;
    const ready = allStations.filter((s) => s.is_rankable).length;
    const minimal = allStations.filter((s) => s.dataBelumCukup).length;
    return {
      all: allStations.length,
      recommended,
      ready,
      minimal,
    };
  }, [allStations]);

  // Filter stasiun berdasarkan:
  // 1. Ketersediaan unit properti yang sesuai (multi-select tipe & transaksi & foto)
  // 2. Tingkatan stasiun (ready/minimal/recommended)
  // 3. Kata kunci teks pencarian
  const filteredStations = useMemo(() => {
    return allStations.filter((station) => {
      const propMeta = stationPropertyMap.get(station.area_id);

      // A–C. Ketersediaan unit sesuai filter — predikatnya di lib/property/filter.ts, sama
      // persis dengan yang dipakai PropertyLayer & PropertyList untuk unit satu per satu.
      // Stasiun tanpa properti (propMeta undefined) gugur begitu ada filter unit yang aktif.
      if (propertyTypes.length > 0 && !propMeta?.categories.some((c) => matchesPropertyType(c, propertyTypes))) {
        return false;
      }
      if (transactionTypes.length > 0 && !propMeta?.types.some((t) => matchesTransactionType(t, transactionTypes))) {
        return false;
      }
      if (hasPhotoOnly && !(propMeta && propMeta.hasPhoto)) {
        return false;
      }

      // D. Filter Kategori Stasiun KRL (Data Lengkap, Data Minim, Top Rekomendasi)
      if (stationTier === "recommended") {
        if (station.rank === null) return false;
      } else if (stationTier === "ready") {
        if (!station.is_rankable) return false;
      } else if (stationTier === "minimal") {
        if (!station.dataBelumCukup) return false;
      }

      // E. Filter Kata Kunci Pencarian (Nama Stasiun atau Kategori Properti)
      const q = query.trim().toLowerCase();
      if (!q) return true;

      const nameMatch = station.station_name.toLowerCase().includes(q);
      const propMatch = propMeta
        ? propMeta.categories.some((c) => c.toLowerCase().includes(q))
        : false;

      return nameMatch || propMatch;
    });
  }, [
    allStations,
    stationPropertyMap,
    propertyTypes,
    transactionTypes,
    hasPhotoOnly,
    stationTier,
    query,
  ]);

  // Global shortcut ⌘K / Ctrl+K untuk langsung fokus ke search bar
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Tutup dropdown saat klik di luar container
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update query saat stasiun terpilih diubah dari peta atau sidebar
  useEffect(() => {
    if (selectedStation) {
      setQuery(selectedStation.station_name);
    }
  }, [selectedStation]);

  function handleSelect(station: SearchItem) {
    setSelectedStation({
      area_id: station.area_id,
      station_name: station.station_name,
      lng: station.lng,
      lat: station.lat,
      is_rankable: station.is_rankable,
    });
    setQuery(station.station_name);
    setIsOpen(false);
    setShowFilters(false);
    inputRef.current?.blur();
  }

  function handleClear() {
    setQuery("");
    setIsOpen(true);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
        return;
      }
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filteredStations.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filteredStations.length - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredStations.length) {
        handleSelect(filteredStations[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setShowFilters(false);
      inputRef.current?.blur();
    }
  }

  // Auto-scroll item yang di-highlight via panah keyboard
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      activeEl?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  // Apakah panel dropdown harus terbuka (karena user mengetik, fokus input, atau membuka filter)
  const isDropdownOpen = isOpen || showFilters;

  return (
    <div
      ref={containerRef}
      className="absolute top-[var(--space-md)] z-[90] w-[340px] sm:w-[440px] md:w-[500px] transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)]"
      style={{
        left: BASE_LEFT_PX,
        transform: `translateX(${translateX}px)`,
        maxWidth: `calc(100vw - ${BASE_LEFT_PX + translateX + RIGHT_GUTTER_PX}px)`,
      }}
    >
      {/* ── Search Input Capsule ────────────────────────────────────────── */}
      <div className="relative flex items-center h-11 sm:h-12 w-full rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-float)] backdrop-blur-md transition-all duration-[var(--motion-fast)] focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20">
        {/* Search Icon */}
        <div className="flex items-center justify-center pl-4 pr-1 text-[var(--color-muted)] pointer-events-none">
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Cari stasiun atau properti..."
          className="w-full bg-transparent py-2.5 px-2 text-[14px] text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
          aria-label="Cari stasiun atau properti"
          aria-expanded={isDropdownOpen}
          role="combobox"
          aria-autocomplete="list"
        />

        {/* Filter Toggle Button inside input */}
        <button
          type="button"
          onClick={() => {
            setShowFilters((v) => !v);
            setIsOpen(true);
          }}
          title={showFilters ? "Tutup panel filter" : "Buka filter properti & stasiun"}
          className={`relative flex h-8 px-3 items-center gap-1.5 rounded-full text-[12px] font-medium transition-all mr-1.5 select-none cursor-pointer ${
            activeFilterCount > 0 || showFilters
              ? "text-[var(--color-brand)] bg-[var(--color-brand)]/15 border border-[var(--color-brand)]/30 font-semibold"
              : "text-[var(--color-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] border border-transparent"
          }`}
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="hidden sm:inline">Filter</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white shadow-xs">
              {activeFilterCount}
            </span>
          )}
        </button>

        {/* Clear Button or Cmd+K Hint */}
        <div className="flex items-center pr-3">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pencarian"
              className="flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-muted)] shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Unified Dropdown: Filter Controls + Real-Time Station List ───── */}
      {isDropdownOpen && (
        <div className="absolute left-0 top-full mt-2 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl backdrop-blur-xl overflow-hidden z-[91] transition-all animate-in fade-in duration-150">
          {/* ── A. Filter Drawer Panel (Bila showFilters true) ───────────── */}
          {showFilters && (
            <div className="p-3 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]/50">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[var(--color-border)]/60">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold tracking-wider uppercase text-[var(--color-text-sub)]">
                    Filter Properti & Kawasan
                  </span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[var(--color-brand)] px-1 text-[9px] font-bold text-white">
                      {activeFilterCount}
                    </span>
                  )}
                </div>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline cursor-pointer"
                  >
                    Reset Semua
                  </button>
                )}
              </div>

              {/* 1. Multi-Select Tipe Properti */}
              <div className="flex flex-col gap-1.5 mb-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                    Tipe Properti (Bisa pilih &gt; 1)
                  </span>
                  {propertyTypes.length > 0 && (
                    <span className="text-[10px] text-[var(--color-brand)] font-medium">
                      {propertyTypes.length} dipilih
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => togglePropertyType("all")}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                      propertyTypes.length === 0
                        ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span>Semua Tipe</span>
                  </button>

                  {PROPERTY_TYPES.map((t) => {
                    const isSelected = propertyTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => togglePropertyType(t.id)}
                        className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                            : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        {isSelected && (
                          <span className="text-[10px] leading-none">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Multi-Select Karakteristik & Jenis Transaksi */}
              <div className="flex flex-col gap-1.5 mb-2.5">
                <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Transaksi & Karakteristik
                </span>
                <div className="flex flex-wrap gap-1">
                  {TRANSACTION_TYPES.map((t) => {
                    const isSelected = transactionTypes.includes(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTransactionType(t.id)}
                        className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                          isSelected
                            ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                            : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                        }`}
                      >
                        <span>{t.icon}</span>
                        <span>{t.label}</span>
                        {isSelected && (
                          <span className="text-[10px] leading-none">✓</span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={toggleHasPhotoOnly}
                    className={`flex items-center gap-1.5 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                      hasPhotoOnly
                        ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span>📸</span>
                    <span>Ada Foto Fisik</span>
                    {hasPhotoOnly && (
                      <span className="text-[10px] leading-none">✓</span>
                    )}
                  </button>
                </div>
              </div>

              {/* 3. Filter Kawasan Stasiun (Data Lengkap & Data Minim) */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold text-[var(--color-muted)] uppercase tracking-wider">
                  Kawasan Stasiun
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => toggleStationTier("all")}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                      stationTier === "all"
                        ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span>Semua Stasiun</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStationTier("ready")}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                      stationTier === "ready"
                        ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>Data Lengkap</span>
                    <span className="text-[10px] opacity-75">({stationTierCounts.ready})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleStationTier("minimal")}
                    className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                      stationTier === "minimal"
                        ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                        : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    <span>Data Minim</span>
                    <span className="text-[10px] opacity-75">({stationTierCounts.minimal})</span>
                  </button>

                  {stationTierCounts.recommended > 0 && (
                    <button
                      type="button"
                      onClick={() => toggleStationTier("recommended")}
                      className={`flex items-center gap-1 h-6 px-2.5 rounded-full text-[11px] font-medium transition-all select-none cursor-pointer ${
                        stationTier === "recommended"
                          ? "bg-[var(--color-brand)] text-white font-semibold shadow-xs"
                          : "bg-[var(--color-surface)] text-[var(--color-text-sub)] border border-[var(--color-border)] hover:text-[var(--color-text)]"
                      }`}
                    >
                      <span>🏆 Top {stationTierCounts.recommended}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── B. Header Hasil Pencarian Stasiun ────────────────────────── */}
          <div className="flex items-center justify-between px-3.5 py-2 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
            <div className="flex items-center gap-1.5 overflow-hidden">
              <span className="text-[10px] font-bold tracking-wider text-[var(--color-text-sub)] uppercase truncate">
                {propertyTypes.length > 0
                  ? `Stasiun dengan ${propertyTypes.join(", ")}`
                  : stationTier === "ready"
                  ? "Stasiun Data Lengkap"
                  : stationTier === "minimal"
                  ? "Stasiun Data Minim"
                  : "Stasiun KRL Jabodetabek"}
              </span>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[10px] font-semibold text-[var(--color-brand)] hover:underline shrink-0"
                >
                  Reset ({activeFilterCount})
                </button>
              )}
            </div>
            <span className="text-[10px] text-[var(--color-muted)] font-semibold shrink-0">
              {filteredStations.length} stasiun
            </span>
          </div>

          {/* ── C. Real-Time Matching Stations List ──────────────────────── */}
          <ul
            ref={listRef}
            className="max-h-72 overflow-y-auto list-none m-0 p-0 divide-y divide-[var(--color-border)]/60"
            role="listbox"
          >
            {filteredStations.length === 0 ? (
              <li className="px-4 py-6 text-center text-[12px] text-[var(--color-muted)] flex flex-col items-center gap-2">
                <p>Tidak ada stasiun yang cocok dengan kriteria filter saat ini.</p>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline cursor-pointer"
                  >
                    Reset semua filter
                  </button>
                )}
              </li>
            ) : (
              filteredStations.map((station, index) => {
                const isSelected = selectedStation?.area_id === station.area_id;
                const isHighlighted = index === highlightedIndex;
                const propMeta = stationPropertyMap.get(station.area_id);

                return (
                  <li
                    key={station.area_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(station)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 text-left cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-[var(--color-surface-muted)]"
                        : "bg-transparent"
                    } ${isSelected ? "bg-[var(--color-brand)]/5" : ""}`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {/* Train Icon Marker */}
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect x="4" y="3" width="16" height="16" rx="2" />
                          <path d="M4 11h16" />
                          <path d="M12 3v8" />
                          <path d="m8 19-2 3" />
                          <path d="m16 19 2 3" />
                          <circle cx="9" cy="15" r="1" fill="currentColor" />
                          <circle cx="15" cy="15" r="1" fill="currentColor" />
                        </svg>
                      </span>

                      <div className="flex flex-col min-w-0">
                        <span className="truncate text-[12px] font-medium text-[var(--color-text)]">
                          {station.station_name}
                        </span>

                        {/* Properti yang tersedia di stasiun ini */}
                        {propMeta && propMeta.count > 0 ? (
                          <span className="text-[10px] text-[var(--color-text-sub)] truncate flex items-center gap-1">
                            <span className="font-semibold text-[var(--color-brand)]">
                              {propMeta.count} unit
                            </span>
                            <span>·</span>
                            <span className="truncate">
                              {propMeta.categories.join(", ")}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-[var(--color-muted)]">
                            {station.is_rankable ? "Kawasan siap dinilai" : "Data minim"}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Rank / Status Badge */}
                    <div className="shrink-0 flex items-center gap-1">
                      {station.rank !== null ? (
                        <span className="rounded-full bg-[var(--color-brand)] px-2 py-0.5 text-[9px] font-extrabold text-white shadow-xs">
                          #{station.rank}
                        </span>
                      ) : station.dataBelumCukup ? (
                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                          Data minim
                        </span>
                      ) : (
                        <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600 dark:text-emerald-400">
                          Lengkap
                        </span>
                      )}
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
