"use client";

import { useState } from "react";
import BriefSection from "@/components/sidebar/BriefSection";
import OutputSection from "@/components/sidebar/OutputSection";

export default function Sidebar() {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);

  function openEditor() {
    setDraft(submitted ?? "");
    setEditing(true);
  }

  function submit() {
    const teks = draft.trim();
    if (!teks) return;
    // 🟡 FASE DUMMY: ganti dengan useParseIntent + useScore saat API siap
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
      />

      <OutputSection
        scored={submitted !== null}
        stale={editing && submitted !== null}
        onEditBrief={openEditor}
        onPrefill={setDraft}
      />
    </aside>
  );
}
