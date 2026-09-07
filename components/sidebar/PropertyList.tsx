"use client";

import type { PropertyUnit } from "@/types/property";

interface Props {
  properties: readonly PropertyUnit[];
  loading: boolean;
  /** Buka halaman detail unit ini. */
  onSelect: (unit: PropertyUnit) => void;
}

/**
 * Empat field per unit: kategori, jenis, alamat, foto. Tanpa luas, harga, kontak.
 *
 * Presentational — datanya diambil pemanggil (`useProperties`), bukan di sini, supaya
 * pemanggil bisa memakai jumlahnya untuk label tab tanpa memicu fetch kedua untuk stasiun
 * yang sama.
 */
export default function PropertyList({ properties, loading, onSelect }: Props) {
  if (loading) {
    return <p className="t-body text-[var(--color-text-sub)]">Memuat properti...</p>;
  }

  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <p className="t-micro font-normal text-[var(--color-text-sub)]">
        {properties.length} unit dari Properti Go, tidak ikut menentukan skor
      </p>

      {properties.length === 0 ? (
        <p className="t-body text-[var(--color-text-sub)]">Belum ada properti tercatat di kawasan ini.</p>
      ) : (
        /*
          Tanpa max-h dan overflow sendiri: kolom sidebar sudah jadi satu-satunya kontainer
          scroll. Dua kontainer scroll bertumpuk di panel 380px membuat daftar dalam menelan
          event roda trackpad, lalu halaman melompat begitu daftar itu mentok.
        */
        <ul className="grid grid-cols-2 gap-[var(--space-sm)]">
          {properties.map((unit) => (
            <li key={unit.id} className="flex">
              {/*
                Tombol sungguhan, bukan <li> ber-onClick: kontrol yang bisa diklik wajib bisa
                difokus keyboard dan punya indikator fokus yang terlihat. `id`-nya dipakai
                OutputSection untuk mengembalikan fokus ke sini setelah halaman detail ditutup.
              */}
              <button
                type="button"
                id={`unit-${unit.id}`}
                onClick={() => onSelect(unit)}
                aria-label={`Lihat detail ${unit.kategori_properti} di ${unit.alamat}`}
                className="flex w-full flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] text-left shadow-[var(--shadow-card)] transition-all duration-[var(--motion-fast)] hover:-translate-y-[1px] hover:border-[var(--color-pin)] hover:shadow-[var(--shadow-float)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-brand)]"
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
