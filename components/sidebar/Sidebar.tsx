"use client";

import { useState, useSyncExternalStore } from "react";
import BriefSection from "@/components/sidebar/BriefSection";
import OutputSection from "@/components/sidebar/OutputSection";
import { useBriefResult } from "@/hooks/brief/useBriefResult";

/** Di bawah lebar ini halaman dibuka dengan panel tertutup supaya peta terlihat lebih dulu. */
const DESKTOP_QUERY = "(min-width: 768px)";

function subscribeToDesktop(onChange: () => void) {
  const mql = window.matchMedia(DESKTOP_QUERY);
  mql.addEventListener("change", onChange);
  return () => mql.removeEventListener("change", onChange);
}

/**
 * Layar cukup lebar untuk membuka panel sejak awal. Dibaca lewat useSyncExternalStore, bukan
 * useState + useEffect: nilainya milik peramban, dan ini satu-satunya cara membacanya tanpa
 * render server & klien berbeda. Snapshot server `true` — desktop adalah tampilan bawaan.
 */
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
  const { scoreResult, loading, error, submitBrief } = useBriefResult();

  // Terbuka mengikuti ukuran layar sampai pengguna memutuskan sendiri; sejak tombolnya
  // ditekan, `override` yang menang.
  const isDesktop = useIsDesktop();
  const [override, setOverride] = useState<boolean | null>(null);
  const open = override ?? isDesktop;

  function openEditor() {
    setDraft(submitted ?? "");
    setEditing(true);
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
    /*
      Sidebar MELAYANG di atas peta (`fixed`), bukan kolom di sebelahnya — ini yang membuat
      peta berhenti flicker saat panel dibuka/ditutup. Alasannya: `components/map/BaseMap.tsx`
      memasang ResizeObserver yang memanggil map.resize() pada SETIAP perubahan ukuran
      kontainer, jadi selama sidebar menganimasikan lebarnya, canvas MapLibre di-resize dan
      digambar ulang belasan kali berturut-turut. Dengan `fixed`, sidebar keluar dari flex row
      di app/page.tsx: pembungkus peta selalu selebar layar, ResizeObserver tidak pernah
      terpanggil, dan yang beranimasi cuma transform sidebar ini (murni compositor).
      Jangan kembalikan ke lebar yang dianimasikan.
    */
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex transition-transform duration-[var(--motion-base)] ease-[var(--ease-out)] ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/*
        Isi panel tetap ter-mount saat tertutup (digeser keluar layar, bukan `hidden`/unmount):
        melepasnya membuat useCommunitySentiment memanggil Gemini lagi tiap kali sidebar
        dibuka, padahal /api/community-sentiment belum punya cache dan kuotanya dipakai
        bersama seluruh pengunjung (docs/api-community-sentiment.md).
      */}
      <div className="flex w-[min(var(--sidebar-width),100vw)] flex-col gap-[var(--space-xl)] overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface-muted)] p-[var(--space-lg)]">
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
      </div>

      {/*
        Tab menempel di tepi kanan panel. Dipasang `left-full` supaya ia ikut tergeser oleh
        transform induknya: saat panel keluar layar, tombolnya berhenti persis di tepi kiri
        layar tanpa perhitungan posisi kedua.
      */}
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
