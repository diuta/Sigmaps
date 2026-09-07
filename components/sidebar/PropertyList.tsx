"use client";

import { useProperties } from "@/hooks/property/useProperties";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import type { PropertyUnit } from "@/types/property";

interface Props {
  stationId: string;
}

/** Empat field per unit: kategori, jenis, alamat, foto. Tanpa luas, harga, kontak. */
export default function PropertyList({ stationId }: Props) {
  const { properties, loading } = useProperties(stationId);
  const { selectedProperty, setSelectedProperty } = useSelectedProperty();

  function handleCardClick(unit: PropertyUnit) {
    setSelectedProperty(unit);
  }

  if (loading) {
    return <p className="t-body text-[var(--color-text-sub)]">Memuat properti...</p>;
  }

  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h2 className="t-heading-2">Properti di kawasan</h2>
        <p className="t-micro font-normal text-[var(--color-text-sub)]">
          {properties.length} unit dari Properti Go, tidak ikut menentukan skor
        </p>
      </div>

      {properties.length === 0 ? (
        <p className="t-body text-[var(--color-text-sub)]">Belum ada properti tercatat di kawasan ini.</p>
      ) : (
        <ul className="grid max-h-[420px] grid-cols-2 gap-[var(--space-sm)] overflow-y-auto pr-[var(--space-xs)]">
          {properties.map((unit) => (
            <li
              key={unit.id}
              onClick={() => handleCardClick(unit)}
              className={`flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border bg-[var(--color-surface)] p-[var(--space-sm)] shadow-[var(--shadow-card)] transition-all duration-[var(--motion-fast)] cursor-pointer hover:-translate-y-[1px] hover:shadow-[var(--shadow-float)] ${
                selectedProperty?.id === unit.id
                  ? "border-[var(--color-pin)] ring-1 ring-[var(--color-pin)] -translate-y-[1px]"
                  : "border-[var(--color-border)] hover:border-[var(--color-pin)]"
              }`}
            >
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
                <span className="t-heading-2">{unit.kategori_properti}</span>
                <span className="t-micro text-[var(--color-pin-hover)]">{unit.jenis_properti}</span>
                <span className="t-body text-[var(--color-text-sub)]">{unit.alamat}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
