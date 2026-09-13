"use client";

import BusinessBriefInput from "@/components/sidebar/BusinessBriefInput";
import SubmittedBrief from "@/components/sidebar/SubmittedBrief";

interface Props {
  draft: string;
  onDraftChange: (value: string) => void;
  submitted: string | null;
  editing: boolean;
  onEdit: () => void;
  onSubmit: () => void;
  loading: boolean;
}

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
