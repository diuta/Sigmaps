"use client";

import { useState, useEffect, useSyncExternalStore } from "react";
import BriefSection from "@/components/sidebar/BriefSection";
import CompareBar from "@/components/comparison/CompareBar";
import OutputSection from "@/components/sidebar/OutputSection";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useSelectedProperty } from "@/hooks/property/useSelectedProperty";
import { useSidebarOpen } from "@/hooks/sidebar/useSidebarOpen";

const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeToDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeToDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => true,
  );
}

export default function Sidebar() {
  const [draft, setDraft] = useState("");
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const { scoreResult, loading, error, submitBrief, resetBrief } = useBriefResult();
  const { selectedProperty } = useSelectedProperty();

  const isDesktop = useIsDesktop();
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? isDesktop;

  const { setSidebarOpen } = useSidebarOpen();
  useEffect(() => {
    setSidebarOpen(open);
  }, [open, setSidebarOpen]);

  useEffect(() => {
    if (selectedProperty) {
      setOverride(true);
    }
  }, [selectedProperty]);

  function openEditor() {
    setDraft(submitted ?? "");
    setEditing(true);
    setOverride(true);
  }

  // Balik ke keadaan sebelum menilai: hasil dibuang, peta bebas dijelajahi lagi.
  // Teks rencananya sengaja DITAHAN di `draft` supaya menilai ulang cukup satu klik —
  // bedanya dengan "Edit rencana" adalah Edit menyisakan hasil lama di layar sebagai
  // usang, sedangkan ini menghapusnya.
  function resetToBrowsing() {
    resetBrief();
    setDraft(submitted ?? draft);
    setSubmitted(null);
    setEditing(false);
    setOverride(true);
  }

  async function submit() {
    const teks = draft.trim();
    if (!teks) return;
    await submitBrief(teks);
    setSubmitted(teks);
    setEditing(false);
  }

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-[100] flex transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex w-[min(var(--sidebar-width),100vw)] flex-col gap-[var(--space-xl)] overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] p-[var(--space-lg)]">
        <BriefSection
          draft={draft}
          onDraftChange={setDraft}
          submitted={submitted}
          editing={editing}
          onEdit={openEditor}
          onReset={resetToBrowsing}
          onSubmit={submit}
          loading={loading}
        />

        <CompareBar />

        {error && (
          <p className="t-body rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)] text-[var(--color-warning-tx)]">
            {error}
          </p>
        )}

        <OutputSection
          brief={submitted}
          loading={loading}
          scored={submitted !== null && scoreResult !== null}
          stale={editing && submitted !== null}
          onEditBrief={openEditor}
        />
      </div>

      <button
        type="button"
        onClick={() => setOverride(!open)}
        aria-expanded={open}
        aria-label={open ? "Sembunyikan panel" : "Tampilkan panel"}
        className="absolute left-full top-1/2 flex h-12 w-6 -translate-y-1/2 items-center justify-center rounded-r-[var(--radius-card)] border border-l-0 border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-sub)] shadow-[var(--shadow-card)] transition-colors duration-[var(--motion-fast)] hover:text-[var(--color-brand)]"
      >
        <span aria-hidden className="t-button leading-none">
          {open ? "‹" : "›"}
        </span>
      </button>
    </aside>
  );
}
