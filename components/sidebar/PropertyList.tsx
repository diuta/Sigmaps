"use client";

/**
 * components/sidebar/PropertyList.tsx
 *
 * Daftar properti Properti Go di sekitar stasiun aktif.
 * - Menampilkan grid kartu properti bersih & elegan
 * - Klik kartu langsung membuka halaman detail properti
 * - Filter multi-select kategori, transaksi, dan foto fisik
 */

import { useMemo } from "react";
import type { PropertyUnit } from "@/types/property";
import { usePropertyFilter } from "@/hooks/property/usePropertyFilter";
import { useComparison } from "@/hooks/comparison/useComparison";
import { getSlotLabel } from "@/hooks/comparison/useComparison.types";

interface Props {
  properties: PropertyUnit[];
  loading: boolean;
  stationId?: string;
  stationName?: string;
  onSelect: (property: PropertyUnit) => void;
}

export default function PropertyList({
  properties,
  loading,
  onSelect,
}: Props) {
  const { propertyTypes, transactionTypes, hasPhotoOnly, resetFilters } = usePropertyFilter();
  const { isInCompare, getSlotFor } = useComparison();

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
        const matchesJenis = transactionTypes.some((t) => {
          if (t === "sewa") return jenis.includes("sewa");
          if (t === "jual") return jenis.includes("jual");
          return false;
        });
        if (!matchesJenis) return false;
      }

      if (hasPhotoOnly && !unit.foto_tampak_depan && !unit.foto_spanduk) {
        return false;
      }

      return true;
    });
  }, [properties, propertyTypes, transactionTypes, hasPhotoOnly]);

  if (loading) {
    return (
      <div className="flex flex-col gap-[var(--space-md)]">
        <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-surface-muted)]" />
        <ul className="grid grid-cols-2 gap-[var(--space-sm)]">
          {[1, 2, 3, 4].map((i) => (
            <li
              key={i}
              className="flex aspect-[3/4] animate-pulse flex-col rounded-[var(--radius-card)] bg-[var(--color-surface-muted)]"
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <section aria-label="Daftar properti" className="flex flex-col gap-[var(--space-md)]">
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
          Grid 2 kolom. Kartu bersih: klik langsung membuka detail properti.
        */
        <ul className="grid grid-cols-2 gap-[var(--space-sm)]">
          {filteredProperties.map((unit) => {
            const inCompare = isInCompare(unit.id);
            const occupiedSlot = getSlotFor(unit.id);

            return (
              <li key={unit.id}>
                <button
                  type="button"
                  id={`unit-${unit.id}`}
                  onClick={() => onSelect(unit)}
                  aria-label={`${unit.kategori_properti} di ${unit.alamat}`}
                  className={`group flex w-full flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-[var(--space-sm)] text-left shadow-[var(--shadow-card)] transition-all duration-[var(--motion-fast)] hover:-translate-y-[1px] hover:shadow-[var(--shadow-float)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)] ${
                    inCompare
                      ? "border-[var(--color-brand)] ring-1 ring-[var(--color-brand)]/40"
                      : "border-[var(--color-border)] hover:border-[var(--color-brand)]"
                  }`}
                >
                  {/* Photo / placeholder */}
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
                      <span className="t-heading-2 flex-1 group-hover:text-[var(--color-brand)] transition-colors">
                        {unit.kategori_properti}
                      </span>
                      {/* In-compare indicator badge on card */}
                      {inCompare && (
                        <span className="t-micro whitespace-nowrap rounded-full bg-[var(--color-brand)] px-[6px] py-[2px] text-white font-bold text-[9px]">
                          {getSlotLabel(occupiedSlot)}
                        </span>
                      )}
                    </div>
                    <span className="t-micro text-[var(--color-pin-hover)]">{unit.jenis_properti}</span>
                    <span className="t-body text-[var(--color-text-sub)] line-clamp-2">{unit.alamat}</span>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
