"use client";

import AiLoadingBlock from "@/components/sidebar/AiLoadingBlock";
import AreaGapBlock, { DUMMY_KATEGORI_JARANG } from "@/components/sidebar/AreaGapBlock";
import AreaInsightBlock from "@/components/sidebar/AreaInsightBlock";
import PropertyList from "@/components/sidebar/PropertyList";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useProperties } from "@/hooks/property/useProperties";
import { useCommunitySentiment } from "@/hooks/sentiment/useCommunitySentiment";
import type { PropertyUnit } from "@/types/property";

interface Props {
  onSelectProperty: (unit: PropertyUnit, stationName: string) => void;
}

/**
 * Keadaan "kawasan dipilih di peta, rencana belum diisi" — belum ada skor apa pun.
 *
 * Ini gambaran kawasan yang bisa dibaca SEBELUM user menulis rencana usaha, jadi dia bisa
 * memilih kawasan mana yang layak dinilai. Dua blok di atas daftar properti:
 *   - "Kategori yang belum banyak di sini" — masih DUMMY, lihat AreaGapBlock.tsx.
 *   - "Gambaran kawasan" — nyata, dari /api/community-sentiment (sama seperti di ScoredPanel).
 * Blok "Isi kawasan sekarang" (jumlah pedagang per kategori) di mockup sengaja tidak dibuat:
 * tidak ada view/tabel yang menyimpan komposisi pedagang per kawasan.
 */
export default function StationNoBriefPanel({ onSelectProperty }: Props) {
  const { selectedStation } = useSelectedStation();

  // Sengaja TANPA tab bar: di sini cuma ada satu hal untuk ditampilkan, jadi tab tunggal
  // hanya jadi derau. Bandingkan dengan ScoredPanel yang punya dua tampilan.
  const { properties, loading } = useProperties(
    selectedStation?.is_rankable ? selectedStation.area_id : null,
  );

  // Tiap klik stasiun = 1 panggilan Gemini (endpoint ini belum punya cache) — batasan
  // yang diketahui, lihat docs/api-community-sentiment.md.
  const { sentiment, loading: sentimentLoading } = useCommunitySentiment(
    selectedStation?.is_rankable ? selectedStation.area_id : null,
  );

  if (!selectedStation) return null;

  return (
    <div className="flex flex-col gap-[var(--space-xl)]">
      <div className="flex flex-col gap-[var(--space-xs)]">
        <nav aria-label="Lokasi" className="t-micro font-normal text-[var(--color-text-sub)]">
          Peta › {selectedStation.station_name}
        </nav>
        <h1 className="t-heading-1">{selectedStation.station_name}</h1>
        <p className="t-body text-[var(--color-text-sub)]">
          Tulis rencana usaha di atas untuk menilai kawasan ini.
        </p>
      </div>

      {selectedStation.is_rankable ? (
        <>
          <AreaGapBlock kategori={DUMMY_KATEGORI_JARANG} />

          {/* Gagal ambil ringkasan tidak boleh menghalangi daftar properti — diam saja. */}
          {sentimentLoading ? (
            <AiLoadingBlock judul="Gambaran kawasan" />
          ) : (
            sentiment?.ringkasan && <AreaInsightBlock paragraf={sentiment.ringkasan} />
          )}

          <PropertyList
            properties={properties}
            loading={loading}
            onSelect={(unit) => onSelectProperty(unit, selectedStation.station_name)}
          />
        </>
      ) : (
        <section className="flex flex-col gap-[var(--space-sm)] rounded-[var(--radius-card)] border border-[var(--color-warning)] bg-[var(--color-warning-bg)] p-[var(--space-md)]">
          <h2 className="t-heading-2 text-[var(--color-warning-tx)]">Data belum cukup</h2>
          <p className="t-body text-[var(--color-warning-tx)]">
            Kawasan ini tidak dinilai dan tidak masuk peringkat karena pengamatannya terlalu sedikit.
          </p>
        </section>
      )}
    </div>
  );
}
