// Mesin skoring SIGMAPS MVP — fungsi murni, 100% deterministik, tidak pernah
// memanggil AI (context/context-mvp.md §6.1-6.5, §6.8).
//
//   skor = 100 × (0,25·D + 0,50·C + 0,25·S)
//
// Tidak boleh mengimpor Supabase, Request/Response, atau apa pun yang berbau
// HTTP (CLAUDE.md bagian 2 aturan 3).
//
// PEMBAGIAN KERJA YANG WAJIB DIPAHAMI SEBELUM MENGUBAH APA PUN:
//   D  dihitung penuh di pipeline batch, disimpan di kolom `demand`, dipakai di
//      sini APA ADANYA tanpa normalisasi lagi.
//   C  TIDAK bisa disimpan: kepadatan bergantung pada tipe_3 yang baru diketahui
//      saat pengguna mengetik, dan normalisasinya butuh sebaran SELURUH kawasan.
//   S  TIDAK bisa disimpan: butuh harga_target pengguna sebagai pembagi.
//
// Skor akhir tidak pernah ditulis ke database.

const WEIGHTS = { wD: 0.25, wC: 0.5, wS: 0.25 } as const

// Kurva punuk C: puncak di 0,4, penyebut terikat pada puncak.
// Puncak 0,4 masih ASUMSI KERJA dan sendirian menentukan siapa yang menang
// (§6.10). Jangan diubah tanpa keputusan tim tertulis, dan jangan mengubah
// penyebutnya terpisah — dia turunan, bukan angka bebas.
const HUMP_PEAK = 0.4
const HUMP_DENOM = Math.max(HUMP_PEAK, 1 - HUMP_PEAK)

const OUTLIER_LOW_PCT = 0.05
const OUTLIER_HIGH_PCT = 0.95

// Berapa bagian dari kawasan YANG DIPERINGKAT harus punya pesaing kategori itu
// sebelum C dianggap bermakna. Di bawah ini, penilaian turun ke SEMUA.
//
// Diukur pada kawasan `is_rankable`, BUKAN seluruh kawasan — dan bedanya nyata.
// Data 6 September 2026: RESTORAN MELAYU ada di 26 dari 43 kawasan, terdengar
// cukup, tapi cuma di 4 dari 11 kawasan yang benar-benar diperingkat. Tujuh
// sisanya mendarat di C = 0,333 — dan 0,333 bukan nilai netral, melainkan
// hukuman "pasar belum terbukti". Komponen berbobot 0,50 lalu berhenti
// membedakan apa pun, sementara skornya tetap keluar terlihat wajar.
//
// Rasio, bukan angka mati, supaya ikut menyesuaikan saat data Menu Go bertambah.
const MIN_COVERAGE_RATIO = 0.5

// Penanda "jangan saring kategori". TIDAK ADA di sensus maupun database.
export const SEMUA = 'SEMUA' as const

// Pengelompokan 24 kategori sensus menjadi 14 kelompok penilaian.
//
// INI LAPISAN PEMETAAN, BUKAN PERUBAHAN DATA. `competitor_counts` di database
// tetap menyimpan 24 kunci mentah; penjumlahan terjadi di sini. Mengubah peta
// ini cukup mengedit blok di bawah — tidak ada migrasi, tidak ada data yang
// perlu ditarik ulang.
//
// Nama kelompok ('ASIA TIMUR' dsb) karangan tim, TIDAK ADA di sensus. Jangan
// pernah menyimpannya ke katalog_restoran.tipe_3.
//
// Latar belakangnya: dari 6.392 restoran sensus, hanya 751 yang jatuh di dalam
// isokron. Dipecah 24 arah, 12 kategori cuma ada di kurang dari 10 kawasan dan
// C-nya praktis mati. Pengelompokan menaikkan cakupan; sisanya ditangani
// penurunan ke SEMUA di bawah.
//
// Empat penggabungan berikut PENILAIAN TIM, bukan fakta, dan pantas dibantah:
//   RESTORAN AYAM    -> CEPAT SAJI      (kuat: isinya gerai ayam cepat saji)
//   RESTORAN CINA    -> ASIA TIMUR      (lemah: Cina dan Jepang bukan pesaing sama)
//   RESTORAN MEKSIKO -> MASAKAN BARAT   (lemah: kelompok "bukan-Asia", bukan masakan)
//   JAJANAN          -> KAFE DAN RESTO  (paling lemah, tapi cuma 24 baris se-Jakarta)
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

// ---------------------------------------------------------------------------
// Tipe
// ---------------------------------------------------------------------------

/** Satu baris `scored_areas` apa adanya dari database. */
export type ScoredAreaRow = {
  area_id: string
  station_id: string
  station_name: string
  area_km2: number
  /** null = pipeline belum memproses kawasan ini. Bukan berarti nol. */
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
  /** null = komponennya belum lengkap, kawasan tidak dapat diskor. */
  skor: number | null
  komponen: {
    demand: number | null
    competitive_headroom: number
    /** null berarti "tidak dinilai", BUKAN "buruk". Jangan pernah kirim 0. */
    segment_match: number | null
  }
  bobot: typeof WEIGHTS
  n_observations: number
  n_price: number
  is_rankable: boolean
}

export type ScoringResult = {
  /** Seluruh kawasan, yang `is_rankable` selalu di urutan atas. */
  areas: ScoredArea[]
  catatan: {
    /** Kelompok yang benar-benar dipakai menghitung C. */
    kelompok_dinilai: string
    /** true = kategori pengguna terlalu tipis, penilaian turun ke SEMUA. */
    fallback_ke_semua: boolean
    /** Berapa kawasan diperingkat punya pesaing kelompok itu. */
    kawasan_berisi: number
    kawasan_diperingkat: number
    total_kawasan: number
  }
}

// ---------------------------------------------------------------------------
// Pembantu
// ---------------------------------------------------------------------------

/** Persentil dengan interpolasi linear, sama seperti default numpy. */
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0
  const idx = p * (sorted.length - 1)
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  if (lo === hi) return sorted[lo]
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** Jumlah pesaing sebuah kawasan untuk satu kelompok (atau seluruhnya). */
function competitorCount(area: ScoredAreaRow, group: string): number {
  if (group === SEMUA) return area.total_restaurants
  const members = GROUPS[group] ?? []
  return members.reduce((n, category) => n + (area.competitor_counts[category] ?? 0), 0)
}

/** Nama kelompok untuk sebuah tipe_3. `SEMUA` dan nama kelompok lolos apa adanya. */
export function groupFor(tipe3: string): string | null {
  if (tipe3 === SEMUA) return SEMUA
  if (tipe3 in GROUPS) return tipe3
  return GROUP_OF_CATEGORY[tipe3] ?? null
}

// Pengaman wajib: hi === lo membuat pembagi nol dan hasilnya NaN — skor tetap
// keluar dan terlihat wajar padahal seluruhnya rusak. x = 0,5 membuat semua
// kawasan mendapat C sama, yang memang benar: tidak ada informasi kompetisi
// yang membedakan mereka (§6.8).
function hitungC(kepadatan: number, lo: number, hi: number): number {
  const x = hi === lo ? 0.5 : (Math.min(Math.max(kepadatan, lo), hi) - lo) / (hi - lo)
  return Math.max(0, 1 - Math.abs(x - HUMP_PEAK) / HUMP_DENOM)
}

// Pembagi memakai harga_target agar selisihnya relatif: meleset Rp5.000 fatal
// untuk target Rp10.000, sepele untuk target Rp100.000.
function hitungS(priceMedian: number, hargaTarget: number): number {
  return Math.max(0, 1 - Math.abs(priceMedian - hargaTarget) / hargaTarget)
}

// ---------------------------------------------------------------------------
// Pintu masuk
// ---------------------------------------------------------------------------

/**
 * Hitung skor seluruh kawasan lalu urutkan.
 *
 * PENTING: `rows` harus berisi SELURUH kawasan, termasuk yang
 * `is_rankable = false`. Query /api/score sengaja TANPA `.eq('is_rankable', true)`.
 *
 * Alasannya: skala normalisasi C dibangun dari sebaran seluruh kawasan.
 * `is_rankable` mengukur ketebalan pengamatan Menu Go — itu urusan D dan S.
 * Data pesaing datang dari sensus yang lengkap tanpa peduli ada pengamatan atau
 * tidak. Membuang kawasan bermuatan tipis berarti membuang data pesaing yang
 * valid, dan lo/hi bergeser sehingga peringkatnya ikut berubah.
 *
 * Perhatikan bedanya dengan keputusan fallback di bawah: SKALA dibangun dari
 * semua kawasan, tapi CAKUPAN kategori diukur hanya pada yang diperingkat.
 *
 * Pemotongan ke Top 5 dilakukan di route, bukan di sini — fungsi ini tetap
 * mengembalikan semuanya agar dapat dites dan diaudit utuh.
 */
export function scoreAreas(
  rows: ScoredAreaRow[],
  tipe3: string,
  hargaTarget: number
): ScoringResult {
  const rankable = rows.filter((row) => row.is_rankable)

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
  if (requested === null) {
    throw new Error(`Kategori usaha tidak dikenali: ${tipe3}`)
  }

  // Baris is_rankable yang datanya null menandakan bug di pipeline batch, bukan
  // kondisi normal — dicatat supaya ketahuan, bukan dibiarkan lewat diam-diam.
  for (const row of rankable) {
    if (row.demand === null || row.price_median === null) {
      console.error(
        `scored_areas ${row.area_id} is_rankable tapi demand/price_median null — periksa pipeline batch`
      )
    }
  }

  // Cakupan diukur pada kawasan yang diperingkat — merekalah yang bersaing
  // masuk Top 5. Kategori yang tersebar luas di 43 kawasan tapi absen di
  // kawasan yang punya data pengamatan tetap tidak berguna.
  const filledRequested = rankable.filter((r) => competitorCount(r, requested) > 0).length
  const enough = filledRequested >= rankable.length * MIN_COVERAGE_RATIO
  const fallback = requested !== SEMUA && !enough
  const group = fallback ? SEMUA : requested

  const densities = rows.map((r) => competitorCount(r, group) / r.area_km2)
  const sorted = [...densities].sort((a, b) => a - b)
  const lo = percentile(sorted, OUTLIER_LOW_PCT)
  const hi = percentile(sorted, OUTLIER_HIGH_PCT)

  const areas: ScoredArea[] = rows.map((row, i) => {
    const C = hitungC(densities[i], lo, hi)
    const D = row.demand
    const S = row.price_median === null ? null : hitungS(row.price_median, hargaTarget)
    const skor = D === null || S === null ? null : 100 * (WEIGHTS.wD * D + WEIGHTS.wC * C + WEIGHTS.wS * S)

    return {
      area_id: row.area_id,
      station_id: row.station_id,
      station_name: row.station_name,
      skor: skor === null ? null : Math.round(skor * 10) / 10,
      komponen: {
        // Ketiganya dibulatkan 3 desimal hanya untuk DITAMPILKAN. Skor di atas
        // dihitung dari nilai penuh, jadi pembulatan di sini tidak menggeser
        // peringkat sama sekali.
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

  // Yang tidak dapat diperingkat selalu di bawah, supaya pemanggil bisa
  // memotong Top N dari atas tanpa menyaring lebih dulu.
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
