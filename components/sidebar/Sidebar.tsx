"use client";

import { useState } from "react";
import BriefSection from "@/components/sidebar/BriefSection";
import OutputSection from "@/components/sidebar/OutputSection";
import { useBriefResult } from "@/hooks/brief/useBriefResult";

export default function Sidebar() {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { scoreResult, loading, error, submitBrief } = useBriefResult();

  function openEditor() {
    setDraft(submitted ?? "");
    setEditing(true);
  }

  async function submit() {
    const teks = draft.trim();
    if (!teks) return;
    await submitBrief(teks);
    setSubmitted(teks);
    setEditing(false);
  }

  return (
    <aside className="z-50 flex h-screen w-[var(--sidebar-width)] shrink-0 flex-col gap-[var(--space-xl)] overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] p-[var(--space-lg)]">
      <BriefSection
        draft={draft}
        onDraftChange={setDraft}
        submitted={submitted}
        editing={editing}
        onEdit={openEditor}
        onSubmit={submit}
        loading={loading}
      />

      {error && (
        <p className="t-body rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)] text-[var(--color-warning-tx)]">
          {error}
        </p>
      )}

      <OutputSection
        scored={submitted !== null && scoreResult !== null}
        stale={editing && submitted !== null}
        onEditBrief={openEditor}
      />
    </aside>
  );
}
