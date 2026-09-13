"use client";

import { useMemo, useState } from "react";
import type { PropertyUnit } from "@/types/property";
import { usePropertyFilter } from "@/hooks/property/usePropertyFilter";
import { useComparison } from "@/hooks/comparison/useComparison";
import type { CompareItem } from "@/hooks/comparison/useComparison.types";

interface Props {
  properties: readonly PropertyUnit[];
  loading: boolean;
  /** Nama stasiun aktif — dioper ke CompareItem supaya panel bisa tampilkan insight kawasan. */
  stationId: string;
  stationName: string;
  /** Buka halaman detail unit ini. */
  onSelect: (unit: PropertyUnit) => void;
}

/**
 * Daftar unit properti dalam grid 2 kolom.
 *
 * Tap pertama → card melebar, muncul 2 tombol aksi di bawahnya:
 *   [Lihat Detail]  [⚖️ Bandingkan]
 * Tap kedua (card yang sama) → collapse kembali.
 *
 * Ini menghilangkan keharusan membuka halaman detail hanya untuk menambah ke compare.
 */
export default function PropertyList({ properties, loading, stationId, stationName, onSelect }: Props) {
  const { propertyTypes, transactionTypes, hasPhotoOnly, resetFilters } = usePropertyFilter();
  const { activeTargetSlot, assignToActiveSlot, isInCompare, getSlotFor, clearSlot, slotA, slotB } = useComparison();

  /** id unit yang sedang "expanded" (menampilkan action row) */
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const isFilterActive = propertyTypes.length > 0 || transactionTypes.length > 0 || hasPhotoOnly;

  const filteredProperties = useMemo(() => {
    return properties.filter((unit) => {
      if (propertyTypes.length > 0) {
        const cat = (unit.kategori_properti || "").toLowerCase();
        const matchesAny = propertyTypes.some((t) => {
          if (t === "rumah") return cat.includes("rumah");
          if (t === "kos") return cat.includes("kos") || cat.includes("kost");
          if (t === "ruko") return cat.includes("ruko");
          if (t === "kantor") return cat.includes("kantor") || cat.includes("office");
          if (t === "tanah") return cat.includes("tanah") || cat.includes("lahan");
          if (t === "retail") return cat.includes("retail") || cat.includes("ritel") || cat.includes("toko");
          return cat.includes(t.toLowerCase());
        });
        if (!matchesAny) return false;
      }
      if (transactionTypes.length > 0) {
        const jenis = (unit.jenis_properti || "").toLowerCase();
        const matchesType = transactionTypes.some((t) => {
          if (t === "sewa") return jenis.includes("sewa");
          if (t === "jual") return jenis.includes("jual");
          return jenis.includes(t.toLowerCase());
        });
        if (!matchesType) return false;
      }
      if (hasPhotoOnly && !unit.foto_tampak_depan && !unit.foto_spanduk) return false;
      return true;
    });
  }, [properties, propertyTypes, transactionTypes, hasPhotoOnly]);

  if (loading) {
    return <p className="t-body text-[var(--color-text-sub)]">Memuat properti...</p>;
  }

  const bothFull = slotA !== null && slotB !== null;

  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex items-center justify-between">
        <p className="t-micro font-normal text-[var(--color-text-sub)]">
          {isFilterActive
            ? `${filteredProperties.length} dari ${properties.length} unit (terfilter)`
            : `${properties.length} unit dari Properti Go`}
        </p>
        {isFilterActive && (
          <button
            type="button"
            onClick={resetFilters}
            className="cursor-pointer text-[11px] font-semibold text-[var(--color-brand)] hover:underline"
          >
            Reset filter
          </button>
        )}
      </div>

      {filteredProperties.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-center">
          <p className="t-body text-[var(--color-text-sub)]">
            {isFilterActive
              ? "Tidak ada unit yang sesuai dengan filter yang dipilih."
              : "Belum ada properti tercatat di kawasan ini."}
          </p>
          {isFilterActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 text-[12px] font-semibold text-[var(--color-brand)] hover:underline"
            >
              Tampilkan semua unit
            </button>
          )}
        </div>
      ) : (
        /*
          Grid 2 kolom. Card full-width dalam li agar action row bisa span seluruh lebar.
          Tanpa max-h + overflow sendiri: sidebar sudah jadi satu-satunya scroll container.
        */
        <ul className="grid grid-cols-2 gap-[var(--space-sm)]">
          {filteredProperties.map((unit) => {
            const isExpanded = expandedId === unit.id;
            const inCompare = isInCompare(unit.id);
            const occupiedSlot = getSlotFor(unit.id);

            function handleCardTap() {
              // Toggle expand: tap same card collapses it
              setExpandedId(isExpanded ? null : unit.id);
            }

            function handleDetail(e: React.MouseEvent) {
              e.stopPropagation();
              setExpandedId(null);
              onSelect(unit);
            }

            function handleCompare(e: React.MouseEvent) {
              e.stopPropagation();
              if (inCompare && occupiedSlot) {
                clearSlot(occupiedSlot);
                return;
              }
              const item: CompareItem = { unit, stationId, stationName };
              assignToActiveSlot(item);
            }

            return (
              <li key={unit.id} className="flex flex-col">
                {/*
                  Card body — single tap toggles action row.
                  id dipakai OutputSection untuk kembalikan fokus setelah detail ditutup.
                */}
                <button
                  type="button"
                  id={`unit-${unit.id}`}
                  onClick={handleCardTap}
                  aria-expanded={isExpanded}
                  aria-label={`${unit.kategori_properti} di ${unit.alamat}`}
                  className={`flex w-full flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-[var(--space-sm)] text-left shadow-[var(--shadow-card)] transition-all duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] ${
                    isExpanded
                      ? "rounded-b-none border-[var(--color-brand)] shadow-[var(--shadow-float)]"
                      : inCompare
                      ? "border-[var(--color-brand)]/50 hover:border-[var(--color-brand)]"
                      : "border-[var(--color-border)] hover:-translate-y-[1px] hover:border-[var(--color-pin)] hover:shadow-[var(--shadow-float)]"
                  }`}
                >
                  {/* Photo / initial placeholder */}
                  {unit.foto_tampak_depan ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={unit.foto_tampak_depan}
                      alt=""
                      className="aspect-square w-full rounded-[var(--radius-card)] object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="flex aspect-square w-full items-center justify-center rounded-[var(--radius-card)] bg-[var(--color-pin-surface)] text-[28px] font-bold leading-none text-[var(--color-pin-hover)]"
                    >
                      {unit.kategori_properti.charAt(0)}
                    </div>
                  )}

                  <div className="flex flex-col gap-[var(--space-xs)]">
                    <div className="flex items-start justify-between gap-[2px]">
                      <span className="t-heading-2 flex-1">{unit.kategori_properti}</span>
                      {/* In-compare indicator badge on card */}
                      {inCompare && (
                        <span className="t-micro whitespace-nowrap rounded-full bg-[var(--color-brand)] px-[6px] py-[2px] text-white">
                          {occupiedSlot}
                        </span>
                      )}
                    </div>
                    <span className="t-micro text-[var(--color-pin-hover)]">{unit.jenis_properti}</span>
                    <span className="t-body text-[var(--color-text-sub)]">{unit.alamat}</span>
                  </div>
                </button>

                {/* ── Action row (slides in below card when expanded) ── */}
                <div
                  aria-hidden={!isExpanded}
                  className={`grid overflow-hidden rounded-b-[var(--radius-card)] border border-t-0 border-[var(--color-brand)] transition-all duration-[var(--motion-base)] ease-[var(--ease-out)] ${
                    isExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="min-h-0">
                    <div className="grid grid-cols-2 divide-x divide-[var(--color-border)] bg-[var(--color-surface-muted)]">
                      {/* Detail button */}
                      <button
                        type="button"
                        tabIndex={isExpanded ? 0 : -1}
                        onClick={handleDetail}
                        className="t-button flex items-center justify-center gap-[var(--space-xs)] py-[var(--space-sm)] text-[var(--color-text-sub)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)]"
                      >
                        <span aria-hidden className="text-[11px]">🔍</span>
                        Detail
                      </button>

                      {/* Compare button */}
                      <button
                        type="button"
                        tabIndex={isExpanded ? 0 : -1}
                        onClick={handleCompare}
                        className={`t-button flex items-center justify-center gap-[var(--space-xs)] py-[var(--space-sm)] transition-colors duration-[var(--motion-fast)] focus-visible:outline-2 focus-visible:outline-[var(--color-brand)] cursor-pointer ${
                          inCompare
                            ? "bg-[var(--color-brand)] text-white hover:bg-rose-600"
                            : "text-[var(--color-brand)] hover:bg-[var(--color-accent-surface)] font-semibold"
                        }`}
                        aria-label={
                          inCompare
                            ? `Hapus dari Slot ${occupiedSlot}`
                            : `Masukkan ke Slot ${activeTargetSlot}`
                        }
                      >
                        <span aria-hidden className="text-[11px]">{inCompare ? "✓" : "⚖️"}</span>
                        {inCompare ? `Slot ${occupiedSlot} (Batal)` : `+ Slot ${activeTargetSlot}`}
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
