// Mesin skor SIGMAPS. Fungsi murni, tanpa HTTP/Supabase, tidak pernah memanggil AI.
// skor = 100 × (0,25·D + 0,50·C + 0,25·S) — context-mvp.md §6.1-6.5
//
// D dihitung di pipeline batch dan dipakai apa adanya. C dan S tidak bisa disimpan:
// C butuh tipe_3 pengguna + sebaran seluruh kawasan, S butuh harga_target.

const WEIGHTS = { wD: 0.25, wC: 0.5, wS: 0.25 } as const

// Puncak 0,4 masih asumsi kerja dan sendirian menentukan pemenang (§6.10).
// HUMP_DENOM turunan, jangan diubah terpisah.
const HUMP_PEAK = 0.4
const HUMP_DENOM = Math.max(HUMP_PEAK, 1 - HUMP_PEAK)

const OUTLIER_LOW_PCT = 0.05
const OUTLIER_HIGH_PCT = 0.95

// Minimal bagian kawasan DIPERINGKAT yang harus punya pesaing kategori itu sebelum
// C dianggap bermakna. Diukur pada is_rankable, bukan seluruh 43 — RESTORAN MELAYU
// ada di 26/43 kawasan tapi cuma 4/11 yang diperingkat.
const MIN_COVERAGE_RATIO = 0.5

/** Penanda "jangan saring kategori". Tidak ada di sensus maupun database. */
export const SEMUA = 'SEMUA' as const

// Pemetaan 24 kategori sensus -> 14 kelompok. Lapisan hitung, bukan perubahan data:
// competitor_counts tetap menyimpan 24 kunci mentah. Empat penggabungan berikut
// penilaian tim: RESTORAN AYAM, RESTORAN CINA, RESTORAN MEKSIKO, JAJANAN.
export const GROUPS: Record<string, readonly string[]> = {
  'CEPAT SAJI': ['CEPAT SAJI', 'RESTORAN AYAM'],
  SEAFOOD: ['SEAFOOD'],
  'RESTORAN PADANG': ['RESTORAN PADANG'],
  'MIE DAN BAKSO': ['MIE DAN BAKSO'],
  'NASI GORENG': ['NASI GORENG'],
  'RESTORAN MELAYU': ['RESTORAN MELAYU'],
  'RESTORAN KOREA': ['RESTORAN KOREA'],
  'KAFE DAN RESTO': ['KAFE DAN RESTO', 'JAJANAN'],
  'ASIA TIMUR': ['RESTORAN JEPANG', 'SUSHI', 'RAMEN', 'RESTORAN CINA'],
  'MASAKAN NUSANTARA': ['WARUNG TEGAL', 'RESTORAN NUSANTARA'],
  'ASIA TENGGARA': ['RESTORAN THAILAND', 'RESTORAN VIETNAM'],
  'MASAKAN BARAT': ['RESTORAN EROPA', 'PIZZA', 'STEAK DAN BBQ', 'RESTORAN MEKSIKO'],
  'TIMUR TENGAH': ['RESTORAN TIMUR TENGAH'],
  'RESTORAN AFRIKA': ['RESTORAN AFRIKA'],
}

const GROUP_OF_CATEGORY: Record<string, string> = Object.fromEntries(
  Object.entries(GROUPS).flatMap(([group, members]) => members.map((k) => [k, group]))
)

/** Satu baris `scored_areas`. null pada demand/price_median = pipeline belum jalan. */
export type ScoredAreaRow = {
  area_id: string
  station_id: string
  station_name: string
  area_km2: number
  demand: number | null
  price_median: number | null
  competitor_counts: Record<string, number>
  total_restaurants: number
  n_observations: number
  n_price: number
  is_rankable: boolean
}

export type ScoredArea = {
  area_id: string
  station_id: string
  station_name: string
  skor: number | null
  komponen: {
    demand: number | null
    competitive_headroom: number
    /** null = tidak dinilai, BUKAN buruk. Jangan tampilkan sebagai 0. */
    segment_match: number | null
  }
  bobot: typeof WEIGHTS
  n_observations: number
  n_price: number
  is_rankable: boolean
}

export type ScoringResult = {
  areas: ScoredArea[]
  catatan: {
    kelompok_dinilai: string
    fallback_ke_semua: boolean
    kawasan_berisi: number
    kawasan_diperingkat: number
    total_kawasan: number
  }
}

/** Persentil interpolasi linear, sama seperti default numpy. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function competitorCount(area: ScoredAreaRow, group: string): number {
  if (group === SEMUA) return area.total_restaurants
  return (GROUPS[group] ?? []).reduce((n, k) => n + (area.competitor_counts[k] ?? 0), 0)
}

/** null = tidak dikenali. `SEMUA` dan nama kelompok lolos apa adanya. */
export function groupFor(tipe3: string): string | null {
  if (tipe3 === SEMUA) return SEMUA
  if (tipe3 in GROUPS) return tipe3
  return GROUP_OF_CATEGORY[tipe3] ?? null
}

// hi === lo -> pembagi nol -> NaN, dan skornya tetap keluar terlihat wajar.
// x = 0,5 memberi C sama untuk semua kawasan, yang memang benar.
function hitungC(kepadatan: number, lo: number, hi: number): number {
  const x = hi === lo ? 0.5 : (Math.min(Math.max(kepadatan, lo), hi) - lo) / (hi - lo)
  return Math.max(0, 1 - Math.abs(x - HUMP_PEAK) / HUMP_DENOM)
}

function hitungS(priceMedian: number, hargaTarget: number): number {
  return Math.max(0, 1 - Math.abs(priceMedian - hargaTarget) / hargaTarget)
}

/**
 * `rows` WAJIB berisi seluruh kawasan, termasuk is_rankable=false — skala persentil C
 * dibangun dari sebaran semuanya. Menyaring di query menggeser lo/hi dan mengubah
 * peringkat. Pemotongan Top 5 dilakukan di route, bukan di sini.
 */
export function scoreAreas(
  rows: ScoredAreaRow[],
  tipe3: string,
  hargaTarget: number
): ScoringResult {
  const rankable = rows.filter((r) => r.is_rankable)

  if (rows.length === 0) {
    return {
      areas: [],
      catatan: {
        kelompok_dinilai: SEMUA,
        fallback_ke_semua: tipe3 !== SEMUA,
        kawasan_berisi: 0,
        kawasan_diperingkat: 0,
        total_kawasan: 0,
      },
    }
  }

  const requested = groupFor(tipe3)
  if (requested === null) throw new Error(`Kategori usaha tidak dikenali: ${tipe3}`)

  // Baris is_rankable yang datanya null = bug pipeline, bukan kondisi normal.
  for (const row of rankable) {
    if (row.demand === null || row.price_median === null) {
      console.error(`scored_areas ${row.area_id} is_rankable tapi demand/price_median null`)
    }
  }

  const filledRequested = rankable.filter((r) => competitorCount(r, requested) > 0).length
  const fallback =
    requested !== SEMUA && filledRequested < rankable.length * MIN_COVERAGE_RATIO
  const group = fallback ? SEMUA : requested

  const densities = rows.map((r) => competitorCount(r, group) / r.area_km2)
  const sorted = [...densities].sort((a, b) => a - b)
  const lo = percentile(sorted, OUTLIER_LOW_PCT)
  const hi = percentile(sorted, OUTLIER_HIGH_PCT)

  const areas: ScoredArea[] = rows.map((row, i) => {
    const C = hitungC(densities[i], lo, hi)
    const D = row.demand
    const S = row.price_median === null ? null : hitungS(row.price_median, hargaTarget)
    const skor =
      D === null || S === null ? null : 100 * (WEIGHTS.wD * D + WEIGHTS.wC * C + WEIGHTS.wS * S)

    return {
      area_id: row.area_id,
      station_id: row.station_id,
      station_name: row.station_name,
      skor: skor === null ? null : Math.round(skor * 10) / 10,
      // Pembulatan hanya untuk tampilan; skor dihitung dari nilai penuh.
      komponen: {
        demand: D === null ? null : Math.round(D * 1000) / 1000,
        competitive_headroom: Math.round(C * 1000) / 1000,
        segment_match: S === null ? null : Math.round(S * 1000) / 1000,
      },
      bobot: WEIGHTS,
      n_observations: row.n_observations,
      n_price: row.n_price,
      is_rankable: row.is_rankable,
    }
  })

  // Yang tidak diperingkat selalu di bawah, supaya Top N bisa dipotong dari atas.
  areas.sort((a, b) => {
    if (a.is_rankable !== b.is_rankable) return a.is_rankable ? -1 : 1
    return (b.skor ?? -1) - (a.skor ?? -1)
  })

  return {
    areas,
    catatan: {
      kelompok_dinilai: group,
      fallback_ke_semua: fallback,
      kawasan_berisi: fallback
        ? rankable.filter((r) => competitorCount(r, SEMUA) > 0).length
        : filledRequested,
      kawasan_diperingkat: rankable.length,
      total_kawasan: rows.length,
    },
  }
}
