/**
 * Mesin skor SIGMAPS — fungsi murni, dipanggil dari app/api/score/route.ts.
 *
 * Berkas ini TIDAK boleh mengimpor Supabase, `Request`/`Response`, atau apa pun
 * yang berbau HTTP (CLAUDE.md bagian 2 aturan 3). Terima array baris
 * `scored_areas`, kembalikan array berskor.
 *
 * PEMBAGIAN KERJA YANG WAJIB DIPAHAMI SEBELUM MENGUBAH APA PUN:
 *
 *   D  dihitung penuh di pipeline batch (etl/pipeline_scoring.py), disimpan di
 *      kolom `demand`, dipakai di sini APA ADANYA tanpa normalisasi lagi.
 *   C  TIDAK bisa disimpan: kepadatan bergantung pada tipe_3 yang baru
 *      diketahui saat pengguna mengetik, dan normalisasinya butuh sebaran
 *      SELURUH kawasan pada tipe itu.
 *   S  TIDAK bisa disimpan: butuh harga_target pengguna sebagai pembagi.
 *
 * Skor akhir 0-100 tidak pernah ditulis ke database. Parameter yang sama selalu
 * menghasilkan skor yang sama — AI menyiapkan masukan, tidak menyentuh hitungan.
 */

// =============================================================================
// Konstanta — seluruh angka rumus hidup di satu tempat
// =============================================================================

/** Bobot tunggal. Rasio C:D = 2:1 dari studi AHP-TOPSIS (context-mvp 6.5). */
export const BOBOT = { wD: 0.25, wC: 0.5, wS: 0.25 } as const;

/**
 * Puncak kurva punuk C. Konstanta PALING RAPUH di seluruh model dan sendirian
 * menentukan siapa yang menang (context-mvp 6.10). Masih tebakan tim.
 */
const PUNCAK = 0.4;

/** Turunan dari PUNCAK: maks(puncak, 1 - puncak). Jangan diubah terpisah. */
const PENYEBUT = Math.max(PUNCAK, 1 - PUNCAK);

const PERSENTIL_BAWAH = 0.05;
const PERSENTIL_ATAS = 0.95;

/**
 * Berapa bagian dari kawasan YANG DIPERINGKAT harus punya pesaing kategori itu
 * sebelum C dianggap bermakna. Di bawah ini, penilaian turun ke SEMUA.
 *
 * Diukur pada kawasan `is_rankable`, BUKAN seluruh kawasan — dan bedanya nyata.
 * Contoh dari data 5 September 2026: RESTORAN MELAYU ada di 26 dari 43 kawasan,
 * terdengar cukup, tapi cuma 4 dari 11 kawasan yang benar-benar diperingkat.
 * Tujuh kawasan sisanya mendarat di C = 0,333, dan 0,333 bukan nilai netral
 * melainkan hukuman "pasar belum terbukti". Peringkatnya lalu ditentukan D dan
 * S saja, sementara komponen berbobot 0,50 berhenti membedakan apa pun.
 *
 * Dipakai sebagai rasio, bukan angka mati, supaya ikut menyesuaikan saat data
 * Menu Go bertambah dan jumlah kawasan yang diperingkat berubah.
 */
const AMBANG_CAKUPAN = 0.5;

/** Penanda "jangan saring kategori". TIDAK ADA di sensus maupun database. */
export const SEMUA = "SEMUA" as const;

/**
 * Pengelompokan 24 kategori sensus menjadi 14 kelompok penilaian.
 *
 * INI LAPISAN PEMETAAN, BUKAN PERUBAHAN DATA. `competitor_counts` di database
 * tetap menyimpan 24 kunci mentah; penjumlahan terjadi di sini. Mengubah peta
 * ini cukup mengedit blok di bawah — tidak ada migrasi, tidak ada data yang
 * perlu ditarik ulang.
 *
 * Nama kelompok ('ASIA TIMUR' dsb) karangan tim, TIDAK ADA di sensus. Jangan
 * pernah menyimpannya ke katalog_restoran.tipe_3.
 *
 * Empat penggabungan berikut penilaian tim, bukan fakta. Kalau ada yang
 * membantahnya, ubah di sini dan catat alasannya:
 *   RESTORAN AYAM    -> CEPAT SAJI      (isinya gerai ayam cepat saji)
 *   RESTORAN CINA    -> ASIA TIMUR      (lemah: Cina dan Jepang bukan pesaing sama)
 *   RESTORAN MEKSIKO -> MASAKAN BARAT   (lemah: kelompok "bukan-Asia", bukan masakan)
 *   JAJANAN          -> KAFE DAN RESTO  (paling lemah, tapi cuma 24 baris se-Jakarta)
 */
export const KELOMPOK: Record<string, readonly string[]> = {
  "CEPAT SAJI": ["CEPAT SAJI", "RESTORAN AYAM"],
  SEAFOOD: ["SEAFOOD"],
  "RESTORAN PADANG": ["RESTORAN PADANG"],
  "MIE DAN BAKSO": ["MIE DAN BAKSO"],
  "NASI GORENG": ["NASI GORENG"],
  "RESTORAN MELAYU": ["RESTORAN MELAYU"],
  "RESTORAN KOREA": ["RESTORAN KOREA"],
  "KAFE DAN RESTO": ["KAFE DAN RESTO", "JAJANAN"],
  "ASIA TIMUR": ["RESTORAN JEPANG", "SUSHI", "RAMEN", "RESTORAN CINA"],
  "MASAKAN NUSANTARA": ["WARUNG TEGAL", "RESTORAN NUSANTARA"],
  "ASIA TENGGARA": ["RESTORAN THAILAND", "RESTORAN VIETNAM"],
  "MASAKAN BARAT": ["RESTORAN EROPA", "PIZZA", "STEAK DAN BBQ", "RESTORAN MEKSIKO"],
  "TIMUR TENGAH": ["RESTORAN TIMUR TENGAH"],
  "RESTORAN AFRIKA": ["RESTORAN AFRIKA"],
};

const KELOMPOK_DARI_KATEGORI: Record<string, string> = Object.fromEntries(
  Object.entries(KELOMPOK).flatMap(([grup, anggota]) => anggota.map((k) => [k, grup])),
);

// =============================================================================
// Tipe
// =============================================================================

/** Satu baris `scored_areas` apa adanya dari database. */
export type BarisKawasan = {
  area_id: string;
  station_id: string;
  station_name: string;
  area_km2: number;
  /** null = pipeline belum memproses kawasan ini. Bukan berarti nol. */
  demand: number | null;
  price_median: number | null;
  competitor_counts: Record<string, number>;
  total_restaurants: number;
  n_observations: number;
  n_price: number;
  is_rankable: boolean;
};

export type KawasanBerskor = {
  area_id: string;
  station_id: string;
  station_name: string;
  /** null = komponennya belum lengkap, kawasan tidak dapat diskor. */
  skor: number | null;
  komponen: {
    demand: number | null;
    competitive_headroom: number;
    /** null berarti "tidak dinilai", BUKAN "buruk". Jangan pernah kirim 0. */
    segment_match: number | null;
  };
  bobot: typeof BOBOT;
  n_observations: number;
  n_price: number;
  is_rankable: boolean;
};

export type HasilSkor = {
  areas: KawasanBerskor[];
  catatan: {
    /** Kelompok yang benar-benar dipakai menghitung C. */
    kelompok_dinilai: string;
    /** true = kategori pengguna terlalu tipis, penilaian turun ke SEMUA. */
    fallback_ke_semua: boolean;
    /** Berapa kawasan diperingkat punya pesaing kelompok itu. Tampilkan apa adanya. */
    kawasan_berisi: number;
    kawasan_diperingkat: number;
    total_kawasan: number;
  };
};

// =============================================================================
// Pembantu
// =============================================================================

/** Persentil dengan interpolasi linear, sama seperti default numpy. */
function persentil(nilai: number[], q: number): number {
  const urut = [...nilai].sort((a, b) => a - b);
  const posisi = (urut.length - 1) * q;
  const bawah = Math.floor(posisi);
  const atas = Math.ceil(posisi);
  if (bawah === atas) return urut[bawah];
  return urut[bawah] + (posisi - bawah) * (urut[atas] - urut[bawah]);
}

/** Jumlah pesaing sebuah kawasan untuk satu kelompok (atau seluruhnya). */
function hitungPesaing(baris: BarisKawasan, kelompok: string): number {
  if (kelompok === SEMUA) return baris.total_restaurants;
  const anggota = KELOMPOK[kelompok] ?? [];
  return anggota.reduce((n, kategori) => n + (baris.competitor_counts[kategori] ?? 0), 0);
}

/** Nama kelompok untuk sebuah tipe_3. `SEMUA` dan nama kelompok lolos apa adanya. */
export function kelompokUntuk(tipe_3: string): string | null {
  if (tipe_3 === SEMUA) return SEMUA;
  if (tipe_3 in KELOMPOK) return tipe_3;
  return KELOMPOK_DARI_KATEGORI[tipe_3] ?? null;
}

// =============================================================================
// Rumus
// =============================================================================

/**
 * C — ruang kompetisi. Kurva punuk: tanpa pesaing dihukum (pasar belum
 * terbukti), terlalu padat dihukum, ideal di tengah.
 *
 *   x = 0,0 -> C = 0,33   tanpa pesaing
 *   x = 0,4 -> C = 1,00   ideal
 *   x = 1,0 -> C = 0,00   paling sesak
 */
function hitungC(x: number): number {
  return Math.max(0, 1 - Math.abs(x - PUNCAK) / PENYEBUT);
}

/**
 * S — kecocokan segmen. Pembaginya harga_target supaya selisihnya relatif:
 * meleset Rp5.000 fatal untuk target Rp10.000, sepele untuk Rp100.000.
 */
function hitungS(price_median: number, harga_target: number): number {
  return Math.max(0, 1 - Math.abs(price_median - harga_target) / harga_target);
}

// =============================================================================
// Pintu masuk
// =============================================================================

/**
 * Hitung skor seluruh kawasan lalu urutkan.
 *
 * PENTING: `baris` harus berisi SELURUH kawasan, termasuk yang
 * `is_rankable = false`. Query `/api/score` sengaja tanpa `where is_rankable`.
 * Dua alasannya:
 *
 *   1. Skala normalisasi C dibangun dari sebaran seluruh kawasan.
 *      `is_rankable` mengukur ketebalan pengamatan Menu Go — itu urusan D dan
 *      S. Data pesaing datang dari sensus yang lengkap tanpa peduli ada
 *      pengamatan atau tidak. Membuang kawasan bermuatan tipis berarti
 *      membuang data pesaing yang valid, dan skalanya bergeser.
 *   2. Kawasan `is_rankable = false` tetap harus digambar di peta dengan label
 *      "data belum cukup".
 *
 * Perhatikan bedanya dengan keputusan fallback di bawah: SKALA dibangun dari
 * semua kawasan, tapi CAKUPAN kategori diukur hanya pada yang diperingkat.
 */
export function hitungSkor(
  baris: BarisKawasan[],
  tipe_3: string,
  harga_target: number,
): HasilSkor {
  const diperingkat = baris.filter((b) => b.is_rankable);

  if (baris.length === 0) {
    return {
      areas: [],
      catatan: {
        kelompok_dinilai: SEMUA,
        fallback_ke_semua: tipe_3 !== SEMUA,
        kawasan_berisi: 0,
        kawasan_diperingkat: 0,
        total_kawasan: 0,
      },
    };
  }

  const diminta = kelompokUntuk(tipe_3);
  if (diminta === null) {
    throw new Error(`Kategori usaha tidak dikenali: ${tipe_3}`);
  }

  // Cakupan diukur pada kawasan yang diperingkat — merekalah yang bersaing
  // masuk Top 5. Kategori yang tersebar luas di 43 kawasan tapi absen di
  // kawasan-kawasan yang punya data pengamatan tetap tidak berguna.
  const berisiDiminta = diperingkat.filter((b) => hitungPesaing(b, diminta) > 0).length;
  const cukup = berisiDiminta >= diperingkat.length * AMBANG_CAKUPAN;
  const fallback = diminta !== SEMUA && !cukup;
  const kelompok = fallback ? SEMUA : diminta;

  const kepadatan = baris.map((b) => hitungPesaing(b, kelompok) / b.area_km2);
  const lo = persentil(kepadatan, PERSENTIL_BAWAH);
  const hi = persentil(kepadatan, PERSENTIL_ATAS);

  const areas: KawasanBerskor[] = baris.map((b, i) => {
    // PENGAMAN WAJIB: kalau lo === hi, pembaginya nol dan hasilnya NaN — skor
    // tetap keluar dan terlihat wajar padahal seluruhnya rusak. x = 0,5 membuat
    // semua kawasan mendapat C sama, yang memang benar: tidak ada informasi
    // kompetisi yang membedakan mereka.
    const x = hi === lo ? 0.5 : (Math.min(Math.max(kepadatan[i], lo), hi) - lo) / (hi - lo);
    const C = hitungC(x);

    const S = b.price_median === null ? null : hitungS(b.price_median, harga_target);
    const D = b.demand;

    const skor =
      D === null || S === null ? null : 100 * (BOBOT.wD * D + BOBOT.wC * C + BOBOT.wS * S);

    return {
      area_id: b.area_id,
      station_id: b.station_id,
      station_name: b.station_name,
      skor: skor === null ? null : Math.round(skor * 10) / 10,
      komponen: {
        demand: D,
        competitive_headroom: Math.round(C * 1000) / 1000,
        segment_match: S === null ? null : Math.round(S * 1000) / 1000,
      },
      bobot: BOBOT,
      n_observations: b.n_observations,
      n_price: b.n_price,
      is_rankable: b.is_rankable,
    };
  });

  // Yang tidak dapat diperingkat tetap dikirim, tapi selalu di bawah — supaya
  // frontend bisa memotong Top 5 dari atas tanpa menyaring lebih dulu.
  areas.sort((a, b) => {
    if (a.is_rankable !== b.is_rankable) return a.is_rankable ? -1 : 1;
    return (b.skor ?? -1) - (a.skor ?? -1);
  });

  return {
    areas,
    catatan: {
      kelompok_dinilai: kelompok,
      fallback_ke_semua: fallback,
      kawasan_berisi: fallback
        ? diperingkat.filter((b) => hitungPesaing(b, SEMUA) > 0).length
        : berisiDiminta,
      kawasan_diperingkat: diperingkat.length,
      total_kawasan: baris.length,
    },
  };
}
