const WEIGHTS = { wD: 0.25, wC: 0.5, wS: 0.25 } as const

const HUMP_PEAK = 0.4
const HUMP_DENOM = Math.max(HUMP_PEAK, 1 - HUMP_PEAK)

const OUTLIER_LOW_PCT = 0.05
const OUTLIER_HIGH_PCT = 0.95

const MIN_COVERAGE_RATIO = 0.5

export const SEMUA = 'SEMUA' as const

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

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** Bentuk minimum yang dibutuhkan untuk menghitung jumlah pesaing — dipakai
 *  ScoredAreaRow (punya total_restaurants) maupun GapRow (tidak punya, dan
 *  tidak butuh karena kelompok SEMUA tidak pernah dinilai sebagai celah). */
type CountsSource = {
  competitor_counts: Record<string, number>
  total_restaurants?: number
}

function competitorCount(area: CountsSource, group: string): number {
  if (group === SEMUA) return area.total_restaurants ?? 0
  return (GROUPS[group] ?? []).reduce((n, k) => n + (area.competitor_counts[k] ?? 0), 0)
}

export function groupFor(tipe3: string): string | null {
  if (tipe3 === SEMUA) return SEMUA
  if (tipe3 in GROUPS) return tipe3
  return GROUP_OF_CATEGORY[tipe3] ?? null
}

/** Kawasan berperingkat milik sebuah stasiun, atau null kalau stasiun itu tidak
 *  masuk peringkat. Dicocokkan lewat `station_id`, BUKAN `area_id`: keduanya
 *  kebetulan bernilai sama di data sekarang, tapi `selectedStation.area_id`
 *  sebenarnya berisi station_id (lihat StationSearchBar), jadi mencocokkannya ke
 *  `area_id` hanya benar karena kebetulan itu. */
export function areaForStation<T extends { station_id: string }>(
  areas: readonly T[],
  stationId: string | null | undefined
): T | null {
  return areas.find((a) => a.station_id === stationId) ?? null
}

/** Kelompok kuliner yang di kawasan ini jauh lebih jarang daripada rata-rata
 *  jaringan — bahan AreaGapBlock. Bukan bagian dari skor.
 *
 *  Kelompok yang hampir tidak ada di kawasan MANA PUN dilewati: langka di
 *  mana-mana bukan celah pasar, itu tanda pasarnya memang tidak ada, dan
 *  menyebutnya peluang akan menyesatkan. Ambangnya jumlah kawasan yang
 *  memilikinya, bukan median kepadatan — median > 0 sama artinya dengan "ada di
 *  lebih dari separuh kawasan", dan itu membuang kelompok yang nyata tapi
 *  mengelompok (kafe ada di 20 dari 43 kawasan) hanya karena sebarannya timpang. */
export type GapRow = {
  key: string
  area_km2: number | null
  competitor_counts: Record<string, number> | null
}

const GAP_MAX = 3
/** Kelompok harus ada di minimal sebanyak ini kawasan untuk dianggap pasar nyata. */
const GAP_MIN_KAWASAN = 5

export function kategoriJarang(rows: GapRow[], key: string): string[] {
  // ponytail: seluruh sebaran dihitung ulang tiap panggilan — 14 kelompok x 43
  // kawasan, tidak terasa. Kalau jumlah kawasan tumbuh jauh, angkat rata-rata
  // per kelompok ke pipeline batch.
  const valid = rows.flatMap((r) =>
    r.area_km2 !== null && r.area_km2 > 0 && r.competitor_counts !== null
      ? [{ key: r.key, area_km2: r.area_km2, competitor_counts: r.competitor_counts }]
      : []
  )
  const target = valid.find((r) => r.key === key)
  if (!target) return []

  const jarang: Array<{ kelompok: string; rasio: number; selisih: number }> = []

  for (const kelompok of Object.keys(GROUPS)) {
    const kepadatan = valid.map((r) => competitorCount(r, kelompok) / r.area_km2)
    if (kepadatan.filter((d) => d > 0).length < GAP_MIN_KAWASAN) continue

    // Rata-rata, bukan median: median nol untuk setiap kelompok yang ada di
    // kurang dari separuh kawasan, sehingga "di bawah median" mustahil dan
    // kelompoknya hilang. Angkanya tidak pernah ditampilkan, hanya diurutkan.
    const lazim = kepadatan.reduce((a, b) => a + b, 0) / kepadatan.length
    const disini = competitorCount(target, kelompok) / target.area_km2
    if (disini >= lazim) continue

    jarang.push({ kelompok, rasio: disini / lazim, selisih: lazim - disini })
  }

  return jarang
    .sort((a, b) => a.rasio - b.rasio || b.selisih - a.selisih)
    .slice(0, GAP_MAX)
    .map((j) => j.kelompok)
}

function hitungC(kepadatan: number, lo: number, hi: number): number {
  const x = hi === lo ? 0.5 : (Math.min(Math.max(kepadatan, lo), hi) - lo) / (hi - lo)
  return Math.max(0, 1 - Math.abs(x - HUMP_PEAK) / HUMP_DENOM)
}

function hitungS(priceMedian: number, hargaTarget: number): number {
  return Math.max(0, 1 - Math.abs(priceMedian - hargaTarget) / hargaTarget)
}

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
