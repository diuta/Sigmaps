import { PROPERTIES, PROPERTIES_FOOTNOTE } from "@/lib/fixtures/properties";

/** Empat field per unit: kategori, jenis, alamat, foto. Tanpa luas, harga, kontak. */
export default function PropertyList() {
  return (
    <section className="flex flex-col gap-[var(--space-md)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <h2 className="t-heading-2">Properti di kawasan</h2>
        <p className="t-micro font-normal text-[var(--color-text-sub)]">
          {PROPERTIES.length} unit dari Properti Go, tidak ikut menentukan skor
        </p>
      </div>

      <ul className="grid max-h-[420px] grid-cols-2 gap-[var(--space-sm)] overflow-y-auto pr-[var(--space-xs)]">
        {PROPERTIES.map((unit) => (
          <li
            key={unit.id}
            className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-[var(--space-sm)] shadow-[var(--shadow-card)] transition-all duration-[var(--motion-fast)] hover:-translate-y-[1px] hover:border-[var(--color-pin)] hover:shadow-[var(--shadow-float)]"
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

      <p className="t-micro font-normal text-[var(--color-muted)]">{PROPERTIES_FOOTNOTE}</p>
    </section>
  );
}
