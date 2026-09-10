import { useMemo } from "react";
import type { PropertyUnit } from "@/types/property";
import { usePropertyFilter } from "@/hooks/property/usePropertyFilter";

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
  const {
    propertyTypes,
    transactionTypes,
    hasPhotoOnly,
    resetFilters,
  } = usePropertyFilter();

  const isFilterActive =
    propertyTypes.length > 0 || transactionTypes.length > 0 || hasPhotoOnly;

  const filteredProperties = useMemo(() => {
    return properties.filter((unit) => {
      // 1. Tipe properti (multi-select)
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
      // 2. Jenis transaksi (multi-select)
      if (transactionTypes.length > 0) {
        const jenis = (unit.jenis_properti || "").toLowerCase();
        const matchesType = transactionTypes.some((t) => {
          if (t === "sewa") return jenis.includes("sewa");
          if (t === "jual") return jenis.includes("jual");
          return jenis.includes(t.toLowerCase());
        });
        if (!matchesType) return false;
      }
      // 3. Foto fisik
      if (hasPhotoOnly && !unit.foto_tampak_depan && !unit.foto_spanduk) {
        return false;
      }
      return true;
    });
  }, [properties, propertyTypes, transactionTypes, hasPhotoOnly]);

  if (loading) {
    return <p className="t-body text-[var(--color-text-sub)]">Memuat properti...</p>;
  }

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
            className="text-[11px] font-semibold text-[var(--color-brand)] hover:underline cursor-pointer"
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
          Tanpa max-h dan overflow sendiri: kolom sidebar sudah jadi satu-satunya kontainer
          scroll. Dua kontainer scroll bertumpuk di panel 380px membuat daftar dalam menelan
          event roda trackpad, lalu halaman melompat begitu daftar itu mentok.
        */
        <ul className="grid grid-cols-2 gap-[var(--space-sm)]">
          {filteredProperties.map((unit) => (
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
