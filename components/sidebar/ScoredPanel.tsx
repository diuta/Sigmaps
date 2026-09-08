"use client";

import { useState } from "react";
import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import PropertyList from "@/components/sidebar/PropertyList";
import RankStrip from "@/components/sidebar/RankStrip";
import ScoreComponentBar from "@/components/sidebar/ScoreComponentBar";
import UnrankableNotice from "@/components/sidebar/UnrankableNotice";
import {
  COMPONENT_LABELS,
  explainComponent,
  explainNeutralPull,
  observedRange,
} from "@/lib/scoring/explanations";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useBriefResult } from "@/hooks/brief/useBriefResult";
import { useStations } from "@/hooks/station/useStations";
import { useProperties } from "@/hooks/property/useProperties";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import type { ScoreComponentKey } from "@/types/scoring";
import type { PropertyUnit } from "@/types/property";

const COMPONENT_ORDER: readonly { key: ScoreComponentKey; weight: number }[] = [
  { key: "demand", weight: 0.25 },
  { key: "competitive_headroom", weight: 0.5 },
  { key: "segment_match", weight: 0.25 },
];

/** Berapa kawasan teratas yang ditampilkan. Batas tampilan saja — /api/score tetap
 *  mengembalikan seluruh kawasan yang dapat diperingkat, dan peta tetap memberi badge
 *  peringkat apa adanya. */
const TOP_N = 5;

interface Props {
  /** Buka halaman detail satu unit. Panel ini tidak tahu bentuk halamannya — cuma meneruskan. */
  onSelectProperty: (unit: PropertyUnit, stationName: string) => void;
}

export default function ScoredPanel({ onSelectProperty }: Props) {
  const { setSelectedStation } = useSelectedStation();
  const { scoreResult } = useBriefResult();
  const { stations } = useStations();

  // Sudah terurut skor tertinggi -> terendah oleh scoreAreas() di server. Kawasan
  // is_rankable=false TIDAK PERNAH ada di sini (/api/score memang tidak mengirimnya,
  // lihat docs/api-score.md) — makanya "kawasan mana yang belum cukup data" dihitung
  // di bawah dengan membandingkan ke daftar semua stasiun, bukan dibaca dari sini.
  const allRanked = scoreResult?.areas ?? [];

  // Sidebar hanya menampilkan Top 5.
  const rankedAreas = allRanked.slice(0, TOP_N);

  const [activeAreaId, setActiveAreaId] = useState<string | null>(rankedAreas[0]?.area_id ?? null);

  // rankedAreas berubah tiap kali brief baru disubmit — reset area aktif ke #1 supaya panel
  // tidak diam-diam menunjuk kawasan dari hasil brief sebelumnya. Disesuaikan LANGSUNG saat
  // render (pola resmi React untuk "adjusting state when a prop changes"), bukan lewat
  // useEffect — tidak ada efek samping ke luar React di sini, cuma turunan dari scoreResult.
  const [prevScoreResult, setPrevScoreResult] = useState(scoreResult);
  if (scoreResult !== prevScoreResult) {
    setPrevScoreResult(scoreResult);
    setActiveAreaId(rankedAreas[0]?.area_id ?? null);
  }

  // ⚠️ Dua hitungan di bawah WAJIB memakai allRanked, bukan rankedAreas yang sudah dipotong:
  // kawasan peringkat 6 ke bawah tetap dinilai, jadi memotongnya lebih dulu akan salah
  // melabelinya "data belum cukup", dan rentang komponen yang ditampilkan di bar akan
  // menyusut jadi rentang lima kawasan saja.
  const unrankableStations = (stations?.features ?? [])
    .filter((feature) => !allRanked.some((area) => area.station_id === feature.properties.station_id))
    .map((feature) => ({
      station_id: feature.properties.station_id,
      station_name: feature.properties.nama,
    }));

  const demandObservedRange = observedRange(allRanked.map((area) => area.komponen.demand));

  const area = rankedAreas.find((a) => a.area_id === activeAreaId) ?? rankedAreas[0] ?? null;
  const { sentiment, loading: sentimentLoading } = useCommunitySentiment(area?.station_id ?? null);

  // Diambil DI SINI, bukan di dalam PropertyList: jumlahnya dipakai label tab, dan memanggil
  // hook yang sama dua kali berarti dua permintaan /api/properties untuk stasiun yang sama.
  // Efek sampingnya bagus — angka (0) sudah terlihat sebelum tabnya dibuka, jadi kawasan
  // berskor tinggi tanpa properti tidak tersembunyi di balik satu klik.
  const { properties, loading: propertiesLoading } = useProperties(area?.station_id ?? null);

  // Pilihan tab sengaja TIDAK direset saat pengguna berpindah peringkat maupun saat brief baru
  // dinilai: kalau ia sedang membandingkan unit antar peringkat, dilempar balik ke tab skor
  // tiap kali berpindah lebih buruk daripada tidak punya tab sama sekali.
  const [tab, setTab] = useState<"skor" | "unit">("skor");

  if (!area) {
    return (
      <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
        <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Belum ada kawasan yang bisa dinilai</h2>
        <p className="t-body text-[var(--color-warning-tx)]">
          Semua kawasan untuk kategori usaha ini belum punya cukup data pengamatan.
        </p>
      </section>
    );
  }

  const peringkat = rankedAreas.findIndex((a) => a.area_id === area.area_id) + 1;

  /**
   * Pilih peringkat lain. Kamera peta digeser dengan mengubah stasiun aktif, bukan dengan
   * memanggil map.flyTo() dari sini — docs/fe/ARCHITECTURE.md §4.1.
   */
  function selectArea(areaId: string) {
    setActiveAreaId(areaId);
    const target = rankedAreas.find((a) => a.area_id === areaId);
    const feature = stations?.features.find((f) => f.properties.station_id === target?.station_id);
    if (target && feature?.geometry) {
      setSelectedStation({
        area_id: target.area_id,
        station_name: target.station_name,
        lng: feature.geometry.coordinates[0],
        lat: feature.geometry.coordinates[1],
        is_rankable: true,
      });
    }
  }

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <div className="flex flex-col gap-[var(--space-md)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          Peringkat › {area.station_name}
        </nav>

        <RankStrip areas={rankedAreas} activeAreaId={area.area_id} onSelect={selectArea} />

        <div className="flex items-baseline gap-[var(--space-md)]">
          <div className="flex min-w-0 flex-1 flex-col gap-[var(--space-xs)]">
            <h1 className="t-heading-1">{area.station_name}</h1>
            <p className="t-micro font-normal text-[var(--color-text-sub)]">
              Peringkat {peringkat} dari {rankedAreas.length} · {area.n_observations} pengamatan
            </p>
          </div>
          <span className="t-display-score text-right tabular-nums text-[var(--color-opportunity-tx)]">
            {area.skor.toLocaleString("id-ID", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
      </div>

      {/*
        Dua pertanyaan yang berbeda dipisah jadi dua tab: "kawasan ini bagus atau tidak?"
        (skor) dan "apa yang bisa saya sewa di sini?" (unit). Selain memisahkan isi, ini
        menghapus scroll bersarang — sebelumnya daftar properti punya kontainer scroll sendiri
        di dalam kolom sidebar yang juga bisa di-scroll.
      */}
      <div role="tablist" aria-label="Tampilan kawasan" className="flex gap-[var(--space-xs)] border-b border-[var(--color-border)]">
        {(
          [
            { id: "skor", label: "Skor" },
            { id: "unit", label: `Unit properti (${properties.length})` },
          ] as const
        ).map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={`t-button -mb-px border-b-2 px-[var(--space-sm)] py-[var(--space-sm)] transition-colors duration-[var(--motion-fast)] ${
              tab === id
                ? "border-[var(--color-brand)] text-[var(--color-brand)]"
                : "border-transparent text-[var(--color-text-sub)] hover:text-[var(--color-text)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "skor" ? (
        <div
          role="tabpanel"
          id="panel-skor"
          aria-labelledby="tab-skor"
          className="flex flex-col gap-[var(--space-xl)]"
        >
          {COMPONENT_ORDER.map(({ key, weight }) => (
            <ScoreComponentBar
              key={key}
              label={COMPONENT_LABELS[key]}
              value={area.komponen[key]}
              weight={weight}
              explanation={explainComponent(key, area.komponen[key])}
              caveat={key === "demand" ? explainNeutralPull(area.n_observations) : null}
              range={key === "demand" ? demandObservedRange : null}
            />
          ))}

          {/* Gagal ambil ringkasan tidak merender apa pun — jangan halangi isi tab lainnya. */}
          {sentimentLoading ? (
            <AiLoadingBlock judul="Gambaran kawasan" />
          ) : (
            sentiment?.ringkasan && <AreaInsightBlock paragraf={sentiment.ringkasan} />
          )}

          {/* Paling bawah dan tertutup: menjawab "kenapa kawasan lain tidak ada di peringkat",
              pertanyaan yang sama dengan tab ini — bukan bagian dari katalog unit. */}
          <UnrankableNotice stations={unrankableStations} />
        </div>
      ) : (
        <div role="tabpanel" id="panel-unit" aria-labelledby="tab-unit">
          <PropertyList
            properties={properties}
            loading={propertiesLoading}
            onSelect={(unit) => onSelectProperty(unit, area.station_name)}
          />
        </div>
      )}
    </div>
  );
}
