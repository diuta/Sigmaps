"use client";

/**
 * components/map/StationSearchBar.tsx
 *
 * Floating Station Search Bar di atas kanvas peta:
 * - Pencarian cepat (fuzzy match) 43 stasiun KRL Jabodetabek.
 * - Posisi responsif & tersinkronisasi dengan sidebar (bergeser mulus mengikuti sidebar).
 * - Menampilkan badge peringkat (#1, #2, dll) jika sudah ada hasil brief,
 *   atau badge "Data belum cukup" jika kawasan tidak dinilai.
 * - Aksesibilitas: Mendukung keyboard shortcut (⌘K / Ctrl+K), navigasi panah (Arrow Up/Down), Enter, dan Escape.
 * - Memilih stasiun langsung mengaktifkan stasiun (kamera flyTo, isokron 10 mnt, properti, dan detail sidebar).
 */

import { useState, useRef, useEffect, useMemo } from "react";
import { useStations } from "@/hooks/station/useStations";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";
import type { StationLocation } from "@/types/station";

const SIDEBAR_CLOSED_PX = 24;
const GAP_PX = 16;
const BASE_LEFT_PX = SIDEBAR_CLOSED_PX + GAP_PX; // 40px
const TRANSLATE_OPEN_PX = 380 - SIDEBAR_CLOSED_PX; // 356px

interface SearchItem extends StationLocation {
  rank: number | null;
  dataBelumCukup: boolean;
}

export default function StationSearchBar() {
  const { stations } = useStations();
  const { scoreResult } = useBriefResult();
  const { selectedStation, setSelectedStation } = useSelectedStation();
  const { sidebarOpen } = useSidebarOpen();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

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
        // Stasiun berperingkat (#1, #2...) tampil lebih dulu
        if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
        if (a.rank !== null) return -1;
        if (b.rank !== null) return 1;
        // Diikuti stasiun rankable
        if (a.is_rankable && !b.is_rankable) return -1;
        if (!a.is_rankable && b.is_rankable) return 1;
        // Urutkan alfabetis
        return a.station_name.localeCompare(b.station_name);
      });
  }, [stations, scoreResult]);

  // Filter stasiun berdasarkan input teks
  const filteredStations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allStations;
    return allStations.filter((s) => s.station_name.toLowerCase().includes(q));
  }, [allStations, query]);

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

  // Tutup dropdown saat klik di luar area komponen
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update input text jika ada stasiun yang terpilih dari peta/sidebar
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

  return (
    <div
      ref={containerRef}
      className="absolute top-[var(--space-md)] z-30 transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)]"
      style={{
        left: BASE_LEFT_PX,
        transform: `translateX(${translateX}px)`,
      }}
    >
      {/* ── Search Input Capsule ────────────────────────────────────────── */}
      <div className="relative flex items-center w-[250px] sm:w-[300px] md:w-[320px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-float)] backdrop-blur-md transition-all duration-[var(--motion-fast)] focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20">
        {/* Search Icon */}
        <div className="flex items-center justify-center pl-3.5 pr-1 text-[var(--color-muted)] pointer-events-none">
          <svg
            width="15"
            height="15"
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
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Cari stasiun KRL..."
          className="w-full bg-transparent py-2 px-1.5 text-[13px] text-[var(--color-text)] placeholder-[var(--color-muted)] outline-none"
          aria-label="Cari stasiun KRL"
          aria-expanded={isOpen}
          role="combobox"
          aria-autocomplete="list"
        />

        {/* Clear Button or Cmd+K Hint */}
        <div className="flex items-center pr-2.5">
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pencarian"
              className="flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted)] hover:bg-[var(--color-border)] hover:text-[var(--color-text)] transition-colors"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center rounded border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[9px] font-semibold text-[var(--color-muted)] shadow-2xs pointer-events-none">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* ── Dropdown Suggestions ─────────────────────────────────────────── */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-float)] backdrop-blur-md transition-all">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)]">
            <span className="text-[10px] font-semibold tracking-wider text-[var(--color-text-sub)] uppercase">
              Stasiun KRL Jabodetabek
            </span>
            <span className="text-[10px] text-[var(--color-muted)] font-medium">
              {filteredStations.length} hasil
            </span>
          </div>

          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto list-none m-0 p-0 divide-y divide-[var(--color-border)]"
            role="listbox"
          >
            {filteredStations.length === 0 ? (
              <li className="px-3 py-4 text-center text-[12px] text-[var(--color-muted)]">
                Tidak ada stasiun &ldquo;{query}&rdquo;
              </li>
            ) : (
              filteredStations.map((station, index) => {
                const isSelected = selectedStation?.area_id === station.area_id;
                const isHighlighted = index === highlightedIndex;

                return (
                  <li
                    key={station.area_id}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(station)}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    className={`flex items-center justify-between gap-2 px-3 py-2 text-left cursor-pointer transition-colors ${
                      isHighlighted
                        ? "bg-[var(--color-surface-muted)]"
                        : "bg-transparent"
                    } ${isSelected ? "bg-[var(--color-brand)]/5" : ""}`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Train Icon Marker */}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
                        <svg
                          width="11"
                          height="11"
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

                      <span className="truncate text-[12px] font-medium text-[var(--color-text)]">
                        {station.station_name}
                      </span>
                    </div>

                    {/* Rank / Status Badge */}
                    <div className="shrink-0 flex items-center gap-1">
                      {station.rank !== null ? (
                        <span className="rounded-full bg-[var(--color-brand)] px-1.5 py-0.2 text-[9px] font-extrabold text-white shadow-xs">
                          #{station.rank}
                        </span>
                      ) : station.dataBelumCukup ? (
                        <span className="rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-600 dark:text-amber-400">
                          Data minim
                        </span>
                      ) : null}
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
