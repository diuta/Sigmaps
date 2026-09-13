/**
 * lib/pdf/businessPlanDocument.tsx
 * Susun & render dokumen PDF "Ringkasan Rencana Usaha" — dipanggil oleh
 * components/sidebar/ExportPdfButton.tsx setelah brief dinilai (/api/prompt-request
 * + /api/score). Domain-specific (tahu bentuk AreaScore/IntentOutput SIGMAPS), jadi
 * di lib/, bukan helper/ (CLAUDE.md §2b).
 *
 * Dirender 100% di browser lewat @react-pdf/renderer (vektor, teks bisa di-select) —
 * sengaja TIDAK lewat app/api/*: generate PDF di route.ts akan kena batas waktu
 * function Vercel Hobby (CLAUDE.md §8) untuk sesuatu yang sebenarnya tidak perlu
 * server sama sekali.
 */

import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";
import {
  COMPONENT_LABELS,
  COMPONENT_ORDER,
  explainComponent,
  explainNeutralPull,
} from "@/lib/scoring/explanations";
import type { AreaScore } from "@/types/scoring";
import type { IntentOutput } from "@/types/prompt-request";
import type { PropertyUnit } from "@/types/property";

/** Properti dipotong supaya PDF tidak membengkak untuk kawasan dengan ratusan unit. */
const MAX_PROPERTIES_LISTED = 30;

export interface BusinessPlanPdfData {
  /** Teks rencana usaha mentah dari user (state `submitted` di Sidebar.tsx). */
  brief: string;
  intent: IntentOutput;
  /** Top 5 kawasan is_rankable, sudah terurut skor desc — ambil dari ScoreResponse.areas. */
  areas: readonly AreaScore[];
  /** Kawasan yang sedang dibuka user di ScoredPanel. */
  activeArea: AreaScore;
  /** Unit properti kawasan aktif (dari useProperties), belum difilter UI. */
  properties: readonly PropertyUnit[];
}

const COLOR_BRAND = "#1E40AF";
const COLOR_TEXT = "#0F172A";
const COLOR_TEXT_SUB = "#64748B";
const COLOR_BORDER = "#E2E8F0";
const COLOR_ROW_ACTIVE = "#ECFDF5";

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 40,
    paddingHorizontal: 40,
    fontSize: 10,
    color: COLOR_TEXT,
    fontFamily: "Helvetica",
  },
  brand: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BRAND,
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginTop: 4,
  },
  subtitle: {
    fontSize: 9,
    color: COLOR_TEXT_SUB,
    marginTop: 2,
    marginBottom: 16,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
  },
  briefBox: {
    padding: 10,
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
    lineHeight: 1.4,
  },
  metaRow: {
    flexDirection: "row",
    gap: 24,
  },
  metaLabel: {
    fontSize: 8,
    color: COLOR_TEXT_SUB,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  notice: {
    marginTop: 8,
    padding: 8,
    borderRadius: 4,
    backgroundColor: "#FFFBEB",
    color: "#92400E",
    fontSize: 9,
    lineHeight: 1.4,
  },
  table: {
    borderWidth: 1,
    borderColor: COLOR_BORDER,
    borderRadius: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
  },
  tableRowLast: {
    flexDirection: "row",
  },
  tableRowActive: {
    backgroundColor: COLOR_ROW_ACTIVE,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: COLOR_TEXT_SUB,
    padding: 6,
  },
  tableCell: {
    fontSize: 9,
    padding: 6,
  },
  colRank: { width: "10%" },
  colName: { width: "40%" },
  colScore: { width: "16%", textAlign: "right" },
  colComponent: { width: "17.33%", textAlign: "right" },
  colPropKategori: { width: "22%" },
  colPropJenis: { width: "18%" },
  colPropAlamat: { width: "60%" },
  scoreHeadline: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginBottom: 10,
  },
  scoreNumber: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: COLOR_BRAND,
  },
  componentBlock: {
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLOR_BORDER,
  },
  componentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  componentLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  componentValue: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
    color: COLOR_BRAND,
  },
  componentExplanation: {
    fontSize: 9,
    color: COLOR_TEXT_SUB,
    lineHeight: 1.4,
  },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: COLOR_TEXT_SUB,
  },
});

function formatSkor(skor: number): string {
  return skor.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function formatKomponen(value: number): string {
  return value.toLocaleString("id-ID", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatRupiah(value: number): string {
  return `Rp${value.toLocaleString("id-ID")}`;
}

function formatTanggal(date: Date): string {
  return date.toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });
}

/**
 * Dokumen PDF "Ringkasan Rencana Usaha". Diekspor terpisah dari
 * `generateBusinessPlanPdfBlob` (di bawah) supaya kalau nanti ada kebutuhan preview
 * langsung di layar (`<PDFViewer>`), komponennya sudah siap dipakai ulang.
 */
export function BusinessPlanDocument({
  brief,
  intent,
  areas,
  activeArea,
  properties,
}: BusinessPlanPdfData) {
  const rankableAreas = areas.filter((a) => a.is_rankable);
  const peringkat = rankableAreas.findIndex((a) => a.area_id === activeArea.area_id) + 1;
  const perkiraanHarga = intent.harga_sumber === "perkiraan";
  const listedProperties = properties.slice(0, MAX_PROPERTIES_LISTED);
  const sisaProperti = properties.length - listedProperties.length;

  return (
    <Document
      title={`Ringkasan Rencana Usaha — ${activeArea.station_name}`}
      author="SIGMAPS"
    >
      <Page size="A4" style={styles.page} wrap>
        <Text style={styles.brand}>SIGMAPS</Text>
        <Text style={styles.title}>Ringkasan Rencana Usaha</Text>
        <Text style={styles.subtitle}>Dibuat {formatTanggal(new Date())}</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rencana usaha</Text>
          <Text style={styles.briefBox}>{brief}</Text>

          <View style={[styles.metaRow, { marginTop: 10 }]}>
            <View>
              <Text style={styles.metaLabel}>Jenis usaha</Text>
              <Text style={styles.metaValue}>{intent.tipe_3}</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Harga target</Text>
              <Text style={styles.metaValue}>{formatRupiah(intent.harga_target)}</Text>
            </View>
          </View>

          {perkiraanHarga && (
            <Text style={styles.notice}>
              Harga tidak disebutkan pengguna di rencana usaha ini — angka di atas adalah
              perkiraan SIGMAPS dari jenis usahanya, bukan target yang eksplisit disebutkan.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Peringkat kawasan (Top {rankableAreas.length})
          </Text>
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <Text style={[styles.tableHeaderCell, styles.colRank]}>#</Text>
              <Text style={[styles.tableHeaderCell, styles.colName]}>Kawasan</Text>
              <Text style={[styles.tableHeaderCell, styles.colScore]}>Skor</Text>
              {COMPONENT_ORDER.map(({ key }) => (
                <Text key={key} style={[styles.tableHeaderCell, styles.colComponent]}>
                  {COMPONENT_LABELS[key]}
                </Text>
              ))}
            </View>
            {rankableAreas.map((area, index) => {
              const isActive = area.area_id === activeArea.area_id;
              const isLast = index === rankableAreas.length - 1;
              return (
                <View
                  key={area.area_id}
                  style={[
                    isLast ? styles.tableRowLast : styles.tableRow,
                    isActive ? styles.tableRowActive : {},
                  ]}
                >
                  <Text style={[styles.tableCell, styles.colRank]}>{index + 1}</Text>
                  <Text style={[styles.tableCell, styles.colName]}>
                    {area.station_name}
                    {isActive ? " (dipilih)" : ""}
                  </Text>
                  <Text style={[styles.tableCell, styles.colScore]}>{formatSkor(area.skor)}</Text>
                  {COMPONENT_ORDER.map(({ key }) => (
                    <Text key={key} style={[styles.tableCell, styles.colComponent]}>
                      {formatKomponen(area.komponen[key])}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>
            Detail kawasan — {activeArea.station_name}
          </Text>
          <View style={styles.scoreHeadline}>
            <Text style={styles.scoreNumber}>{formatSkor(activeArea.skor)}</Text>
            <Text style={{ color: COLOR_TEXT_SUB }}>
              dari 100 · Peringkat {peringkat} dari {rankableAreas.length} ·{" "}
              {activeArea.n_observations} pengamatan
            </Text>
          </View>

          {COMPONENT_ORDER.map(({ key, bobot }) => (
            <View key={key} style={styles.componentBlock}>
              <View style={styles.componentHeader}>
                <Text style={styles.componentLabel}>
                  {COMPONENT_LABELS[key]} (bobot {Math.round(activeArea.bobot[bobot] * 100)}%)
                </Text>
                <Text style={styles.componentValue}>{formatKomponen(activeArea.komponen[key])}</Text>
              </View>
              <Text style={styles.componentExplanation}>
                {explainComponent(key, activeArea.komponen[key])}
                {key === "demand" && explainNeutralPull(activeArea.n_observations)
                  ? ` ${explainNeutralPull(activeArea.n_observations)}`
                  : ""}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Unit properti — {activeArea.station_name} ({properties.length} unit)
          </Text>
          {properties.length === 0 ? (
            <Text style={{ color: COLOR_TEXT_SUB }}>
              Belum ada properti tercatat di kawasan ini.
            </Text>
          ) : (
            <View style={styles.table}>
              <View style={styles.tableRow}>
                <Text style={[styles.tableHeaderCell, styles.colPropKategori]}>Kategori</Text>
                <Text style={[styles.tableHeaderCell, styles.colPropJenis]}>Jenis</Text>
                <Text style={[styles.tableHeaderCell, styles.colPropAlamat]}>Alamat</Text>
              </View>
              {listedProperties.map((unit, index) => {
                const isLast = index === listedProperties.length - 1 && sisaProperti <= 0;
                return (
                  <View key={unit.id} style={isLast ? styles.tableRowLast : styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colPropKategori]}>
                      {unit.kategori_properti}
                    </Text>
                    <Text style={[styles.tableCell, styles.colPropJenis]}>{unit.jenis_properti}</Text>
                    <Text style={[styles.tableCell, styles.colPropAlamat]}>{unit.alamat}</Text>
                  </View>
                );
              })}
            </View>
          )}
          {sisaProperti > 0 && (
            <Text style={{ marginTop: 6, color: COLOR_TEXT_SUB, fontSize: 8 }}>
              +{sisaProperti} unit lain tidak ditampilkan di ringkasan ini — lihat daftar lengkap
              di SIGMAPS.
            </Text>
          )}
        </View>

        <View style={styles.footer} fixed>
          <Text render={({ pageNumber, totalPages }) => `Halaman ${pageNumber} / ${totalPages}`} />
          <Text>Dihasilkan otomatis oleh SIGMAPS — skor bukan proyeksi keuangan</Text>
        </View>
      </Page>
    </Document>
  );
}

/** Render dokumen di atas jadi Blob PDF, siap diunduh browser (lihat ExportPdfButton). */
export async function generateBusinessPlanPdfBlob(data: BusinessPlanPdfData): Promise<Blob> {
  return pdf(<BusinessPlanDocument {...data} />).toBlob();
}
