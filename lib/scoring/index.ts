// Mesin skoring SIGMAPS MVP — 100% deterministik, tidak pernah memanggil AI
// (context/context-mvp.md §6.1-6.5, §6.8).
//
// skor = 100 × (0,25·D + 0,50·C + 0,25·S)

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
}

export type ScoredArea = {
  area_id: string
  station_id: string
  station_name: string
  skor: number
  komponen: {
    demand: number
    competitive_headroom: number
    segment_match: number
  }
  bobot: typeof WEIGHTS
  n_observations: number
  n_price: number
  is_rankable: true
}

const WEIGHTS = { wD: 0.25, wC: 0.5, wS: 0.25 } as const

// Kurva punuk C: puncak di 0,4, penyebut terikat pada puncak (maks(puncak, 1 − puncak)).
const HUMP_PEAK = 0.4
const HUMP_DENOM = Math.max(HUMP_PEAK, 1 - HUMP_PEAK)

// Pemotongan pencilan min-max (bukan persentil murni — lihat context-mvp.md §6.3).
const OUTLIER_LOW_PCT = 0.05
const OUTLIER_HIGH_PCT = 0.95

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

function densitasKompetitor(area: ScoredAreaRow, tipe3: string): number {
  const jumlah = tipe3 === 'SEMUA' ? area.total_restaurants : (area.competitor_counts[tipe3] ?? 0)
  return jumlah / area.area_km2
}

// Pengaman wajib: hi === lo (cuma satu kawasan / semua kawasan punya kepadatan sama untuk
// kategori ini) membuat pembagi nol dan NaN — set x = 0,5 (context-mvp.md §6.8).
function hitungC(kepadatan: number, lo: number, hi: number): number {
  const x = hi === lo ? 0.5 : (Math.min(Math.max(kepadatan, lo), hi) - lo) / (hi - lo)
  return Math.max(0, 1 - Math.abs(x - HUMP_PEAK) / HUMP_DENOM)
}

function hitungS(priceMedian: number, hargaTarget: number): number {
  return Math.max(0, 1 - Math.abs(priceMedian - hargaTarget) / hargaTarget)
}

export function scoreAreas(rows: ScoredAreaRow[], tipe3: string, hargaTarget: number): ScoredArea[] {
  // demand & price_median wajib terisi untuk baris is_rankable = true (n_observations >= 10,
  // n_price >= 5) — baris yang lolos filter tapi datanya null menandakan bug di batch,
  // bukan kondisi normal, jadi dibuang di sini daripada menghasilkan skor NaN diam-diam.
  const areas = rows.filter((row) => {
    const valid = row.demand !== null && row.price_median !== null
    if (!valid) {
      console.error(`scored_areas ${row.area_id} is_rankable tapi demand/price_median null`)
    }
    return valid
  })

  if (areas.length === 0) return []

  const densities = areas.map((area) => densitasKompetitor(area, tipe3))
  const sorted = [...densities].sort((a, b) => a - b)
  const lo = percentile(sorted, OUTLIER_LOW_PCT)
  const hi = percentile(sorted, OUTLIER_HIGH_PCT)

  return areas
    .map((area, i) => {
      const D = area.demand as number
      const C = hitungC(densities[i], lo, hi)
      const S = hitungS(area.price_median as number, hargaTarget)
      const skor = 100 * (WEIGHTS.wD * D + WEIGHTS.wC * C + WEIGHTS.wS * S)

      return {
        area_id: area.area_id,
        station_id: area.station_id,
        station_name: area.station_name,
        skor: Math.round(skor * 10) / 10,
        komponen: { demand: D, competitive_headroom: C, segment_match: S },
        bobot: WEIGHTS,
        n_observations: area.n_observations,
        n_price: area.n_price,
        is_rankable: true as const,
      }
    })
    .sort((a, b) => b.skor - a.skor)
}
