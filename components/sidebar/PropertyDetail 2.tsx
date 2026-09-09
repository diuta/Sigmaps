"use client";

import { useEffect, useRef } from "react";
import type { PropertyUnit } from "@/types/property";

interface Props {
  property: PropertyUnit;
  /** Nama kawasan asal unit ini, untuk breadcrumb. */
  stationName: string;
  onBack: () => void;
}

/** Satu foto + labelnya. Ruang gambar dipesan lewat aspect-ratio supaya layout tidak
 *  melompat saat foto termuat (CLS). */
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

/**
 * Halaman detail satu unit properti. Mengambil alih seluruh panel hasil (header kawasan,
 * RankStrip, dan tab bar ikut hilang) supaya tombol "Kembali" cuma punya satu arti.
 *
 * Isinya persis apa yang ada di Properti Go: kategori, jenis penawaran, alamat, dua foto.
 * Tidak ada harga, luas, maupun kontak — kolomnya memang tidak ada di dataset
 * (context/dokumentasi-erd-mvp.md §5). Ketiadaan itu dinyatakan terbuka di bawah, karena
 * itu pertanyaan pertama yang muncul di halaman detail properti; tanpa kalimat itu pengguna
 * mengira datanya gagal dimuat.
 */
export default function PropertyDetail({ property, stationName, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Fokus dipindahkan ke judul unit saat halaman ini terbuka: daftar asalnya sudah
  // tersembunyi, jadi membiarkan fokus di sana membuat pengguna keyboard & pembaca layar
  // tertinggal di elemen yang tidak terlihat.
  useEffect(() => {
    headingRef.current?.focus();
  }, [property.id]);

  const sewa = property.jenis_properti === "Sewa";

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
            {sewa ? "Siap Sewa" : "Siap Jual"}
          </span>
        </div>

        <p className="t-body text-[var(--color-text-sub)]">{property.alamat}</p>
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
