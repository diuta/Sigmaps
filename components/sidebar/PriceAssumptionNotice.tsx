interface Props {
  /** Harga yang diperkirakan AI dari jenis usaha, dalam rupiah. */
  hargaTarget: number;
  onEdit: () => void;
}

/**
 * Wajib tampil saat harga_sumber = 'perkiraan' — context-mvp.md §2, ARCHITECTURE.md §11.
 * Inferensi yang terlihat dan bisa disunting itu sah; yang diam-diam masuk rumus tidak.
 */
export default function PriceAssumptionNotice({ hargaTarget, onEdit }: Props) {
  return (
    <div className="flex flex-col items-start gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
      <p className="t-body text-[var(--color-warning-tx)]">
        Harga tidak Anda sebutkan, jadi kami perkirakan Rp
        {hargaTarget.toLocaleString("id-ID")} dari jenis usahanya.
      </p>
      <button
        type="button"
        onClick={onEdit}
        className="t-micro rounded-[var(--radius-pill)] border border-[var(--color-warning-tx)] px-[var(--space-md)] py-[var(--space-xs)] text-[var(--color-warning-tx)] transition-all duration-[var(--motion-fast)] hover:bg-[var(--color-warning-tx)] hover:text-[var(--color-warning-bg)] active:translate-y-[1px]"
      >
        Ubah rencana
      </button>
    </div>
  );
}
