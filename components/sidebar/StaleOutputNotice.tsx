/** Hasil di bawahnya masih milik brief sebelumnya selama rencana sedang disunting. */
export default function StaleOutputNotice() {
  return (
    <p
      role="status"
      className="t-body rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)] text-[var(--color-warning-tx)]"
    >
      Hasil di bawah masih dari rencana sebelumnya. Tekan{" "}
      <span className="font-semibold">Nilai ulang kawasan</span> untuk memperbaruinya.
    </p>
  );
}
