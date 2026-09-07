"use client";

import BusinessBriefInput from "@/components/sidebar/BusinessBriefInput";
import SubmittedBrief from "@/components/sidebar/SubmittedBrief";

interface Props {
  draft: string;
  onDraftChange: (value: string) => void;
  /** Brief yang sedang dinilai, null bila belum ada. */
  submitted: string | null;
  /** Penyunting terbuka: kotak rencana kembali bisa diketik. */
  editing: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  loading: boolean;
}

/**
 * Bagian atas sidebar. Menukar isinya sendiri antara kotak yang bisa diketik dan
 * ringkasan yang sengaja tampak nonaktif — tanpa menyentuh bagian hasil di bawahnya.
 */
export default function BriefSection({
  draft,
  onDraftChange,
  submitted,
  editing,
  onEdit,
  onSubmit,
  loading,
}: Props) {
  if (submitted !== null && !editing) {
    return <SubmittedBrief value={submitted} onEdit={onEdit} />;
  }

  return (
    <BusinessBriefInput
      value={draft}
      onChange={onDraftChange}
      onSubmit={onSubmit}
      submitLabel={loading ? "Menilai..." : submitted === null ? "Nilai kawasan" : "Nilai ulang kawasan"}
      disabled={loading}
    />
  );
}
