"use client";

import { useEffect, useRef } from "react";
import type { PropertyUnit } from "@/types/property";
import { formatJalanKaki } from "@/helper/format-jalan-kaki";
import CompareToggleButton from "@/components/comparison/CompareToggleButton";
import type { CompareItem } from "@/hooks/comparison/useComparison.types";

/**
 * Format nomor WhatsApp dari DB ke URL wa.me.
 * DB menyimpan dalam format +62xxxxxxxxxx — cukup strip tanda + untuk wa.me.
 * Contoh: +6281234567890 → https://wa.me/6281234567890
 */
function formatWhatsApp(raw: string): string {
  // Hapus semua karakter non-digit; DB sudah ber-kode negara jadi langsung pakai.
  const digits = raw.replace(/\D/g, "");
  return `https://wa.me/${digits}`;
}

interface Props {
  property: PropertyUnit;
  /** Kawasan asal unit ini: id untuk CompareItem (→ /api/community-sentiment), nama untuk breadcrumb. */
  stationId: string;
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
export default function PropertyDetail({ property, stationId, stationName, onBack }: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Fokus dipindahkan ke judul unit saat halaman ini terbuka: daftar asalnya sudah
  // tersembunyi, jadi membiarkan fokus di sana membuat pengguna keyboard & pembaca layar
  // tertinggal di elemen yang tidak terlihat.
  useEffect(() => {
    headingRef.current?.focus();
  }, [property.id]);

  // Nilai di DB: "Disewa" / "Dijual" / "Sudah Tersewa" (aset KAI yang sudah terisi)
  const jenis = (property.jenis_properti || "").toLowerCase();
  const sewa = jenis.includes("sewa");
  const tersewa = jenis.includes("tersewa");
  // null kalau rute belum dihitung (etl/hitung_rute.py) — baris jarak disembunyikan saja
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

        {/* Kontak WhatsApp */}
        {property.contact_number ? (
          <a
            href={formatWhatsApp(property.contact_number)}
            target="_blank"
            rel="noopener noreferrer"
            className="t-button flex w-full cursor-pointer items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-emerald-600 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-800 shadow-xs transition-all hover:bg-emerald-600 hover:text-white focus-visible:outline-2 focus-visible:outline-emerald-600"
            aria-label="Hubungi pemilik properti via WhatsApp"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Hubungi via WhatsApp
          </a>
        ) : (
          <div
            className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-2.5 text-xs text-[var(--color-muted)] select-none"
            aria-label="Kontak tidak tersedia"
          >
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Kontak tidak tersedia — lihat foto untuk info lebih lanjut
          </div>
        )}

        {/* 1-Click Compare Action in Detail */}
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
