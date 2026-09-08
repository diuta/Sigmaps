/**
 * Dua tabel padanan manual untuk titik sentuh AI #3 (context/context-mvp.md §6.6).
 *
 * Keduanya ditempel ke dalam prompt sistem Gemini di lib/ai/parseIntent.ts —
 * BUKAN tabel database, dan tidak pernah menyentuh Supabase.
 *
 * Kenapa harus ada:
 *
 * 1. SINONIM — memaksa AI memilih nama kategori yang benar-benar ada di sensus.
 *    Tanpa daftar ini Gemini menjawab "Warteg" / "Warung Tegal" / "Warung Makan"
 *    untuk hal yang sama, padahal hanya `WARUNG TEGAL` yang cocok dengan kunci
 *    `competitor_counts`. Nilai yang meleset ditolak /api/score dengan 400 — atau
 *    kalau lolos, jumlah pesaingnya terbaca NOL dan C seragam 0,333 di semua
 *    kawasan. Skornya tetap keluar dan terlihat wajar padahal salah.
 *
 * 2. HARGA_PERKIRAAN — membuat tebakan harga selalu sama. Alur MVP one-shot, jadi
 *    `harga_target` wajib terisi walau pengguna tidak menyebut harga. Kalau Gemini
 *    menebak bebas, kategori yang sama bisa dapat Rp12.000 hari ini dan Rp25.000
 *    besok; S ikut berubah dan peringkatnya berbeda. Itu mematahkan klaim inti
 *    PRD: parameter yang sama selalu menghasilkan skor yang sama.
 *
 * Dipakai hanya bila pengguna TIDAK menyebut harga. Kalau menyebut, angka
 * penggunalah yang dipakai dan `harga_sumber` diisi 'pengguna'.
 */

/**
 * Kunci = 24 nilai `TIPE_3` sensus, HURUF KAPITAL, harus cocok persis dengan
 * `select distinct tipe_3 from katalog_restoran`.
 *
 * Nilai = kata yang wajar dipakai orang saat menyebut usahanya. Bukan daftar
 * tertutup — Gemini tetap boleh menyimpulkan sendiri, ini contoh yang mengarahkan.
 */
export const SINONIM_TIPE_3: Record<string, readonly string[]> = {
  'CEPAT SAJI': ['fast food', 'ayam goreng tepung', 'fried chicken', 'burger', 'gerai cepat saji'],
  'NASI GORENG': ['nasi goreng', 'nasgor', 'gerobak nasi goreng', 'nasi goreng gerobak'],
  SEAFOOD: ['seafood', 'ikan bakar', 'kepiting', 'udang', 'cumi', 'pecak ikan'],
  'MIE DAN BAKSO': ['bakso', 'mie ayam', 'mi ayam', 'pangsit', 'mie yamin', 'bakmi'],
  'RESTORAN PADANG': ['rumah makan padang', 'rm padang', 'masakan minang', 'nasi kapau', 'nasi padang'],
  'RESTORAN KOREA': ['korean bbq', 'masakan korea', 'korean food', 'bibimbap', 'tteokbokki'],
  'RESTORAN MELAYU': ['masakan melayu', 'nasi lemak', 'masakan sumatera', 'rumah makan melayu'],
  'RESTORAN JEPANG': ['masakan jepang', 'japanese food', 'donburi', 'katsu', 'teppanyaki'],
  'KAFE DAN RESTO': ['kafe', 'cafe', 'coffee shop', 'kedai kopi', 'warung kopi', 'ngopi', 'kopi susu'],
  'RESTORAN THAILAND': ['masakan thailand', 'thai food', 'tom yum', 'pad thai'],
  'WARUNG TEGAL': ['warteg', 'warung tegal', 'warung nasi', 'warung makan', 'nasi rames'],
  'RESTORAN TIMUR TENGAH': ['kebab', 'nasi kebuli', 'masakan arab', 'shawarma', 'timur tengah'],
  SUSHI: ['sushi', 'sashimi', 'sushi roll'],
  'RESTORAN EROPA': ['masakan eropa', 'western food', 'pasta', 'italian', 'bistro'],
  'STEAK DAN BBQ': ['steak', 'steakhouse', 'bbq', 'barbeque', 'grill'],
  'RESTORAN VIETNAM': ['masakan vietnam', 'pho', 'banh mi', 'vietnamese'],
  RAMEN: ['ramen', 'kedai ramen', 'mie jepang'],
  'RESTORAN CINA': ['chinese food', 'masakan cina', 'masakan tionghoa', 'dimsum', 'kwetiau'],
  'RESTORAN MEKSIKO': ['masakan meksiko', 'mexican food', 'taco', 'burrito'],
  'RESTORAN AYAM': ['ayam geprek', 'ayam penyet', 'ayam bakar', 'ayam kremes', 'warung ayam'],
  PIZZA: ['pizza', 'kedai pizza', 'pizzeria'],
  JAJANAN: ['jajanan', 'gorengan', 'cemilan', 'snack', 'martabak', 'kaki lima jajanan'],
  'RESTORAN NUSANTARA': ['masakan nusantara', 'masakan indonesia', 'masakan daerah'],
  'RESTORAN AFRIKA': ['masakan afrika', 'african food'],
}

/**
 * Perkiraan `harga_target` per porsi, rupiah.
 *
 * SETIAP ANGKA DI SINI TERUKUR — tidak ada satu pun yang ditebak.
 *
 * Nilainya diambil apa adanya dari median harga nyata per format tempat, dihitung
 * dari 175 pengamatan Menu Go DKI yang harganya lolos pembersihan (8 September
 * 2026, `select percentile_cont(0.5) ... from menu_go group by jenis_tempat`):
 *
 *     Kaki Lima/Gerobak  n=52   14.000
 *     Fast Food          n=19   17.000
 *     Warung/Tenda       n=39   20.000
 *     Kafe               n=26   22.000
 *     Restoran           n=39   30.000
 *
 * Yang tersisa sebagai penilaian tim hanyalah MENUGASKAN tiap kategori ke salah
 * satu dari lima format itu — pertanyaan "warteg itu formatnya warung atau
 * restoran?", bukan "warteg itu berapa rupiah?". Jauh lebih mudah dipertahankan,
 * dan kalimat PRD-nya jadi: *perkiraan harga diturunkan dari median harga nyata
 * per format tempat pada 175 pengamatan Menu Go DKI.*
 *
 * ⚠ BATASAN YANG WAJIB DIAKUI DI PRD: Menu Go bukan populasi restoran. Sebarannya
 * didominasi kaki lima dan warung (Kaki Lima 47, Restoran 22, Warung 21, Fast Food
 * 6, Kafe 4 dari sampel 100), sehingga median tertingginya berhenti di 30.000.
 * Akibatnya SELURUH kategori premium — sushi, steak, masakan Eropa — ikut
 * mendarat di 30.000, jauh di bawah harga sebenarnya di Jakarta.
 *
 * Konsekuensinya pada rumus: untuk usaha premium, `harga_target` yang dipakai
 * lebih rendah daripada niat pengguna sesungguhnya, sehingga S menilai kawasan
 * murah lebih cocok daripada semestinya. Ini pilihan sadar — lebih baik meleset
 * ke arah yang dapat ditelusuri daripada memakai angka yang tidak ada dasarnya.
 * Pengguna tetap dapat mengoreksinya, karena `harga_sumber` selalu dikirim
 * bernilai 'perkiraan' dan UI menawarkan penyuntingan.
 */
export const HARGA_PERKIRAAN: Record<string, number> = {
  // --- format Kaki Lima/Gerobak, median 14.000 ---
  JAJANAN: 14_000,
  'MIE DAN BAKSO': 14_000,
  'NASI GORENG': 14_000,

  // --- format Fast Food, median 17.000 ---
  'CEPAT SAJI': 17_000,
  'RESTORAN AYAM': 17_000, // ayam geprek/penyet, format gerai cepat saji
  PIZZA: 17_000,           // gerai rantai (Pizza Hut, Domino's), bukan restoran duduk

  // --- format Warung/Tenda, median 20.000 ---
  'WARUNG TEGAL': 20_000,
  'RESTORAN PADANG': 20_000,
  'RESTORAN MELAYU': 20_000,
  'RESTORAN NUSANTARA': 20_000,

  // --- format Kafe, median 22.000 ---
  'KAFE DAN RESTO': 22_000,

  // --- format Restoran, median 30.000 ---
  // Seluruh kategori premium jatuh ke sini. Lihat batasan di atas: Menu Go tidak
  // memuat cukup restoran kelas atas untuk memberi median yang lebih tinggi.
  SEAFOOD: 30_000,
  'RESTORAN KOREA': 30_000,
  'RESTORAN JEPANG': 30_000,
  'RESTORAN THAILAND': 30_000,
  'RESTORAN TIMUR TENGAH': 30_000,
  'RESTORAN VIETNAM': 30_000,
  'RESTORAN CINA': 30_000,
  'RESTORAN MEKSIKO': 30_000,
  'RESTORAN EROPA': 30_000,
  'STEAK DAN BBQ': 30_000,
  'RESTORAN AFRIKA': 30_000,
  SUSHI: 30_000,
  RAMEN: 30_000,
}

/**
 * Dipakai kalau kategori tidak ada di HARGA_PERKIRAAN, atau `tipe_3 = 'SEMUA'`.
 *
 * Bukan angka bulat pilihan sendiri: ini median SELURUH 175 harga Menu Go tanpa
 * dipilah format — padanan yang tepat untuk 'SEMUA', yang memang berarti "tidak
 * menyaring kategori".
 */
export const HARGA_DEFAULT = 20_000

/**
 * Susun kedua daftar jadi teks yang ditempel ke prompt sistem Gemini.
 *
 * Hanya kategori yang benar-benar ada di database yang ikut — `tipe3Values`
 * datang dari `getTipe3Values()` (view `tipe3_values`). Kalau suatu saat sensus
 * bertambah kategori dan berkas ini belum diperbarui, kategori itu tetap muncul
 * di prompt tanpa sinonim dan harga; AI masih bisa memilihnya, cuma tanpa
 * bantuan. Sebaliknya kategori di berkas ini yang tidak ada di database sengaja
 * DIBUANG, supaya AI tidak pernah menyebut nilai yang akan ditolak /api/score.
 */
export function daftarUntukPrompt(tipe3Values: string[]): string {
  return tipe3Values
    .map((t) => {
      const sinonim = SINONIM_TIPE_3[t]
      const harga = HARGA_PERKIRAAN[t] ?? HARGA_DEFAULT
      const contoh = sinonim?.length ? ` (mis. ${sinonim.join(', ')})` : ''
      return `- "${t}"${contoh} — perkiraan harga ${harga}`
    })
    .join('\n')
}
