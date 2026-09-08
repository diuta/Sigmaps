/**
 * TODO: `kategori` masih diisi DUMMY_KATEGORI_JARANG di bawah.
 * Sumber aslinya nanti: field `kategori_jarang` dari /api/community-sentiment — menumpang
 * panggilan Gemini yang sudah ada di endpoint itu (bukan endpoint/titik sentuh AI baru),
 * divalidasi ke daftar tipe3_values supaya kosakatanya sama dengan yang dimengerti /api/score.
 * Perubahannya ada di app/api/, lib/ai/, dan types/sentiment/ — sengaja belum dikerjakan
 * karena di luar zona sidebar.
 */
export const DUMMY_KATEGORI_JARANG = ["Kedai kopi", "Bakery", "Minuman kekinian"];

interface Props {
  kategori: string[];
}

/** Keluaran AI — warna accent, bukan warna skor. Sejajar dengan AreaInsightBlock. */
export default function AreaGapBlock({ kategori }: Props) {
  return (
    <section className="flex flex-col gap-[var(--space-sm)] border-l-2 border-[var(--color-accent)] bg-[var(--color-accent-surface)] p-[var(--space-md)]">
      <h2 className="t-heading-2 text-[var(--color-accent)]">Kategori yang belum banyak di sini</h2>
      <div className="flex flex-wrap gap-[var(--space-sm)]">
        {kategori.map((nama) => (
          <span
            key={nama}
            className="t-micro rounded-[var(--radius-pill)] border border-[var(--color-accent)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--color-accent)]"
          >
            {nama}
          </span>
        ))}
      </div>
      <p className="t-micro font-normal text-[var(--color-accent)]">
        Contoh tampilan — belum tersambung ke data. Tidak memengaruhi skor.
      </p>
    </section>
  );
}
