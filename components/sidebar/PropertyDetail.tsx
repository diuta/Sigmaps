"use client";

import { useEffect, useRef } from "react";
import type { PropertyUnit } from "@/types/property";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import CompareToggleButton from "@/components/comparison/CompareToggleButton";
import type { CompareItem } from "@/hooks/comparison/useComparison.types";

interface Props {
  property: PropertyUnit;
  stationId: string;
  stationName: string;
  onBack: () => void;
}

function Foto({ src, label, alt }: { src: string | null; label: string; alt: string }) {
  return (
    <figure className="flex flex-col gap-[var(--space-xs)]">
      <figcaption className="t-micro font-normal text-[var(--color-text-sub)]">{label}</figcaption>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-[var(--color-border)] object-cover"
        />
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center rounded-[var(--radius-card)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <span className="t-body text-[var(--color-muted)]">Tidak ada foto</span>
        </div>
      )}
    </figure>
  );
}

export default function PropertyDetail({ property, stationId, stationName, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [property.id]);

  const jenis = (property.jenis_properti || "").toLowerCase();
  const sewa = jenis.includes("sewa");
  const tersewa = jenis.includes("tersewa");
  const jalanKaki = formatJalanKaki(property.jarak_jalan_m, property.waktu_jalan_s);

  const compareItem: CompareItem = { unit: property, stationId, stationName };

  return (
    <div className="motion-rise-in flex flex-col gap-[var(--space-lg)]">
      <button
        type="button"
        onClick={onBack}
        className="t-button flex w-fit items-center gap-[var(--space-xs)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] px-[var(--space-md)] py-[var(--space-sm)] text-[var(--color-text-sub)] transition-colors duration-[var(--motion-fast)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
      >
        <span aria-hidden>‹</span> Kembali
      </button>

      <div className="flex flex-col gap-[var(--space-sm)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          {stationName} › {property.kategori_properti}
        </nav>

        <div className="flex items-start gap-[var(--space-sm)]">
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="t-heading-1 min-w-0 flex-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
          >
            {property.kategori_properti}
          </h1>
          <span
            className={`t-micro whitespace-nowrap rounded-[var(--radius-pill)] border px-[var(--space-sm)] py-[2px] ${
              sewa
                ? "border-[var(--color-opportunity)] bg-[var(--color-opportunity-bg)] text-[var(--color-opportunity-tx)]"
                : "border-[var(--color-brand)] bg-[var(--color-accent-surface)] text-[var(--color-brand)]"
            }`}
          >
            {tersewa ? "Sudah Tersewa" : sewa ? "Siap Sewa" : "Siap Jual"}
          </span>
        </div>

        <p className="t-body text-[var(--color-text-sub)]">{property.alamat}</p>
        {jalanKaki && (
          <p
            className="t-micro flex items-center gap-[var(--space-xs)] text-[var(--color-brand)]"
            title={`Rute jalan kaki ke ${stationName} mengikuti jaringan jalan, digambar di peta`}
          >
            <span aria-hidden="true">🚶</span>
            <span>{jalanKaki} ke {stationName}</span>
          </p>
        )}

        <div className="pt-1">
          <CompareToggleButton item={compareItem} />
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-md)]">
        <Foto
          src={property.foto_tampak_depan}
          label="Foto tampak depan"
          alt={`Tampak depan ${property.kategori_properti} di ${property.alamat}`}
        />
        <Foto
          src={property.foto_spanduk}
          label="Foto spanduk"
          alt={`Spanduk ${property.kategori_properti} di ${property.alamat}`}
        />
      </div>

      <p className="t-micro font-normal text-[var(--color-muted)]">
        Properti Go tidak mencatat harga, luas, maupun kontak pemilik, jadi ketiganya tidak
        ditampilkan di mana pun. Tanyakan langsung ke pemilik atau pengelola unit.
      </p>
    </div>
  );
}
