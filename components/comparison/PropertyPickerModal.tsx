"use client";

import { useEffect, useMemo, useState } from "react";
import { useAllPropertiesSummary, type PropertySummaryItem } from "@/hooks/property/useAllPropertiesSummary";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import type { CompareItem, CompareSlot } from "@/hooks/comparison/useComparison.types";
import { getSlotLabel, getSlotNumber } from "@/hooks/comparison/useComparison.types";
import type { PropertyUnit } from "@/types/property";

interface Props {
  slot: CompareSlot;
  isOpen: boolean;
  onClose: () => void;
  onSelect: (item: CompareItem) => void;
  stationNames: Record<string, string>;
  otherSlotUnitId?: string | null;
  otherSlotName?: CompareSlot;
}

export default function PropertyPickerModal({
  slot,
  isOpen,
  onClose,
  onSelect,
  stationNames,
  otherSlotUnitId,
  otherSlotName,
}: Props) {
  const { data: allProperties, loading } = useAllPropertiesSummary();

  const [selectedStationId, setSelectedStationId] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Unique sorted stations
  const stationList = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of allProperties) {
      counts[p.station_id] = (counts[p.station_id] || 0) + 1;
    }
    return Object.keys(counts)
      .map((id) => ({
        id,
        name: stationNames[id] || id,
        count: counts[id],
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allProperties, stationNames]);

  // Unique sorted categories
  const categoryList = useMemo(() => {
    const cats = new Set<string>();
    for (const p of allProperties) {
      if (p.kategori_properti) cats.add(p.kategori_properti);
    }
    return Array.from(cats).sort();
  }, [allProperties]);

  // Filtered properties
  const filteredProperties = useMemo(() => {
    return allProperties.filter((p) => {
      if (selectedStationId !== "all" && p.station_id !== selectedStationId) return false;
      if (selectedCategory !== "all" && p.kategori_properti !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const stationName = stationNames[p.station_id] || "";
        const haystack = `${p.kategori_properti} ${p.jenis_properti} ${p.alamat || ""} ${stationName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [allProperties, selectedStationId, selectedCategory, searchQuery, stationNames]);

  if (!isOpen) return null;

  function handleSelect(p: PropertySummaryItem) {
    const stationName = stationNames[p.station_id] ?? p.station_id;
    const unit: PropertyUnit = {
      id: p.id,
      kategori_properti: p.kategori_properti,
      jenis_properti: p.jenis_properti,
      alamat: p.alamat || "",
      foto_tampak_depan: p.foto_tampak_depan,
      foto_spanduk: p.foto_spanduk,
      lat: 0,
      lng: 0,
      jarak_jalan_m: p.jarak_jalan_m,
      waktu_jalan_s: p.waktu_jalan_s,
    };
    onSelect({ unit, stationId: p.station_id, stationName });
  }

  function handleResetFilter() {
    setSelectedStationId("all");
    setSelectedCategory("all");
    setSearchQuery("");
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pilih ${getSlotLabel(slot)}`}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
    >
      {/* Click outside backdrop */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden />

      {/* Modal dialog box */}
      <div className="relative flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--color-border)] px-5 py-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-brand)] text-xs font-bold text-white">
                {getSlotNumber(slot)}
              </span>
              <h2 className="t-heading-1 text-base text-[var(--color-text)]">
                Pilih {getSlotLabel(slot)}
              </h2>
            </div>
            <p className="t-micro font-normal text-[var(--color-text-sub)]">
              Klik opsi properti di bawah untuk langsung membandingkan tanpa mengetik.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup"
            className="rounded-full p-1.5 text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Filter Section (1-Click selection) */}
        <div className="flex flex-col gap-2.5 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3">
          {/* Station Filter Pills */}
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-[var(--color-text-sub)]">
              Filter Stasiun:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => setSelectedStationId("all")}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedStationId === "all"
                    ? "bg-[var(--color-brand)] text-white shadow-xs"
                    : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-[var(--color-brand)]"
                }`}
              >
                Semua ({allProperties.length})
              </button>
              {stationList.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStationId(st.id)}
                  className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedStationId === st.id
                      ? "bg-[var(--color-brand)] text-white shadow-xs"
                      : "border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  {st.name} ({st.count})
                </button>
              ))}
            </div>
          </div>

          {/* Category Filter Pills & Optional Search */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSelectedCategory("all")}
                className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                  selectedCategory === "all"
                    ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                    : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
                }`}
              >
                Semua Tipe
              </button>
              {categoryList.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`cursor-pointer rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-[var(--color-text)] text-[var(--color-surface)]"
                      : "bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Optional search input */}
            <div className="relative flex min-w-[140px] max-w-[200px] items-center">
              <input
                type="text"
                value={searchQuery}
                placeholder="Cari kata kunci..."
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border)] bg-[var(--color-surface)] py-1 pl-2.5 pr-7 text-xs text-[var(--color-text)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-brand)] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Options List */}
        <div className="flex flex-1 flex-col overflow-y-auto p-4 scrollbar-thin">
          {loading ? (
            <div className="flex flex-col gap-2.5 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex h-20 animate-pulse rounded-[12px] bg-[var(--color-surface-muted)]" />
              ))}
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="t-body text-[var(--color-muted)]">
                Tidak ada properti yang cocok dengan filter yang dipilih.
              </p>
              <button
                type="button"
                onClick={handleResetFilter}
                className="cursor-pointer text-xs font-semibold text-[var(--color-brand)] hover:underline"
              >
                Reset semua filter
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {filteredProperties.map((p) => {
                const isOther = p.id === otherSlotUnitId;
                const stName = stationNames[p.station_id] ?? p.station_id;
                const isSewa = (p.jenis_properti || "").toLowerCase().includes("sewa");
                const jalanKaki = formatJalanKaki(p.jarak_jalan_m, p.waktu_jalan_s);

                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOther}
                    onClick={() => handleSelect(p)}
                    className={`group relative flex items-start gap-3 rounded-[12px] border p-3 text-left transition-all ${
                      isOther
                        ? "cursor-not-allowed border-[var(--color-border)] bg-[var(--color-surface-muted)] opacity-50"
                        : "cursor-pointer border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-[1px] hover:border-[var(--color-brand)] hover:bg-[var(--color-accent-surface)]/20 hover:shadow-[var(--shadow-card)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                    }`}
                  >
                    {/* Thumbnail */}
                    {p.foto_tampak_depan ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.foto_tampak_depan}
                        alt=""
                        className="h-16 w-16 flex-shrink-0 rounded-[8px] object-cover"
                      />
                    ) : (
                      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[8px] bg-[var(--color-pin-surface)] text-xl font-bold text-[var(--color-pin)]">
                        {p.kategori_properti.charAt(0)}
                      </div>
                    )}

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <span className="t-heading-2 truncate text-[13px] font-bold text-[var(--color-text)]">
                          {p.kategori_properti}
                        </span>
                        <span
                          className={`flex-shrink-0 rounded-[var(--radius-pill)] px-1.5 py-0.5 text-[9px] font-bold ${
                            isSewa
                              ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300"
                              : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-300"
                          }`}
                        >
                          {p.jenis_properti}
                        </span>
                      </div>

                      <p className="t-micro truncate font-semibold text-[var(--color-brand)]">
                        📍 {stName}
                      </p>

                      {p.alamat && (
                        <p className="t-micro line-clamp-1 font-normal text-[var(--color-text-sub)]">
                          {p.alamat}
                        </p>
                      )}

                      {jalanKaki && (
                        <p className="t-micro flex items-center gap-1 text-[var(--color-text-sub)]">
                          <span aria-hidden>🚶</span>
                          <span>{jalanKaki}</span>
                        </p>
                      )}

                      {isOther && (
                        <span className="mt-1 text-[10px] font-bold text-[var(--color-muted)]">
                          ✓ Terpilih di {getSlotLabel(otherSlotName)}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] bg-[var(--color-surface-muted)] px-5 py-3">
          <p className="t-micro font-normal text-[var(--color-muted)]">
            Menampilkan {filteredProperties.length} unit properti
          </p>
          <button
            type="button"
            onClick={onClose}
            className="t-button rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-1.5 text-xs text-[var(--color-text-sub)] hover:border-[var(--color-brand)] hover:text-[var(--color-text)]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
