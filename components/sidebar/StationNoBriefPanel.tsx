"use client";

import PropertyList from "@/components/sidebar/PropertyList";
import { useSelectedStation } from "@/hooks/station/useSelectedStation";
import { useProperties } from "@/hooks/property/useProperties";
import type { PropertyUnit } from "@/types/property";

interface Props {
  onSelectProperty: (unit: PropertyUnit, stationName: string) => void;
}

/**
 * Keadaan "kawasan dipilih di peta, rencana belum diisi" — belum ada skor apa pun.
 *
 * Sebelumnya menampilkan "gambaran kawasan" hasil AI (kategori jarang, komposisi usaha)
 * lewat AiCategoryBlock/AreaCompositionList — dihapus di sini karena tidak ada endpoint
 * yang pernah menghasilkan data itu. docs/fe/ARCHITECTURE.md secara eksplisit menandai
 * "narasi AI area insight" di luar scope MVP, jadi bukan sesuatu yang perlu disambungkan.
 */
export default function StationNoBriefPanel({ onSelectProperty }: Props) {
  const { selectedStation } = useSelectedStation();

  // Sengaja TANPA tab bar: di sini cuma ada satu hal untuk ditampilkan, jadi tab tunggal
  // hanya jadi derau. Bandingkan dengan ScoredPanel yang punya dua tampilan.
  const { properties, loading } = useProperties(
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
        <PropertyList
          properties={properties}
          loading={loading}
          onSelect={(unit) => onSelectProperty(unit, selectedStation.station_name)}
        />
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
