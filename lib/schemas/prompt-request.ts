import { z } from 'zod'

// Berkas ini DITULIS ULANG 7 September 2026. `lib/ai/parseIntent.ts` mengimpor
// `buildGeminiRawSchema` dan `Intent` dari sini, tetapi tidak ada satu pun versi
// berkas ini di riwayat git yang pernah mengekspor `buildGeminiRawSchema` — jadi
// berkasnya tidak pernah ter-commit, dan typecheck di branch mana pun gagal.
// Yang ditulis di bawah diturunkan dari dua sumber: bentuk `raw` yang diharapkan
// parseIntent.ts, dan kontrak IntentSchema di context/context-mvp.md §6.6.

// Body yang dikirim client ke POST /api/prompt-request.
//
// Nama fieldnya `teks`, mengikuti context-mvp.md §2 (`POST /api/parse-intent
// { teks: "..." }`). Sebelumnya sempat ada tiga nama berbeda untuk hal yang
// sama — dokumen menulis `teks`, stub route membaca `body.text`, dan skema ini
// memakai `prompt`. Disatukan ke `teks`.
export const PromptRequestSchema = z.object({
  teks: z.string().min(1, 'teks tidak boleh kosong'),
})

// TIDAK ADA `TIPE_3_VALUES` HARDCODED DI SINI, DAN JANGAN DITAMBAHKAN LAGI.
//
// Versi lama berkas ini memuat placeholder empat nilai karangan berkapitalisasi
// judul: 'Restoran Padang', 'Warung Nasi', 'Kedai Kopi', 'Restoran Cepat Saji'.
// Sensus yang sebenarnya berisi 24 nilai, seluruhnya HURUF KAPITAL, dan dua di
// antara empat itu ('Warung Nasi', 'Kedai Kopi') tidak ada sama sekali.
//
// Kalau daftar itu dipakai, Gemini dipaksa mengeluarkan kategori yang tidak akan
// pernah cocok dengan kunci `competitor_counts`, dan alurnya putus di
// /api/score dengan 400. Daftar sah selalu datang dari `getTipe3Values()`
// (lib/tipe3), yang membaca view `tipe3_values` — sama seperti
// `buildScoreRequestSchema` di lib/schemas/score.ts.

function tipe3Enum(tipe3Values: string[]) {
  // 'SEMUA' WAJIB ikut. Dia penanda "jangan saring kategori", tidak ada di
  // sensus maupun di competitor_counts. Tanpa pengecualian ini, jalur fallback
  // di lib/scoring ditolak oleh validasinya sendiri (context-mvp.md §6.6).
  return z.enum([...tipe3Values, 'SEMUA'] as unknown as [string, ...string[]])
}

// Bentuk MENTAH yang dikembalikan Gemini, termasuk `is_kuliner`.
// `is_kuliner` dipakai parseIntent.ts untuk menolak usaha non-kuliner lalu
// DIBUANG — dia tidak boleh ikut ke respons publik, karena 'SEMUA' bukan tempat
// pembuangan: kepadatan restoran tidak mengatakan apa pun tentang peluang
// laundry atau barbershop (§6.6).
export function buildGeminiRawSchema(tipe3Values: string[]) {
  return z.object({
    is_kuliner: z.boolean(),
    tipe_3: tipe3Enum(tipe3Values),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    confidence: z.number().min(0).max(1),
  })
}

// Skema final MVP (context/context-mvp.md §6.6). Mengganti total skema v1
// (`kategori_usaha`, `target_jam`, `segmen`, `skala`, `weights`) — nama-nama itu
// dilarang dipakai.
//
// Tidak ada field `null`: semua selalu terisi, sehingga skoring tidak pernah
// berhenti di tengah dan alur one-shot terjaga. Bila pengguna tidak menyebut
// harga, AI memperkirakannya dan `harga_sumber` diisi 'perkiraan'.
export function buildIntentSchema(tipe3Values: string[]) {
  return z.object({
    tipe_3: tipe3Enum(tipe3Values),
    harga_target: z.number().int().min(1000).max(1_000_000),
    harga_sumber: z.enum(['pengguna', 'perkiraan']),
    // TIDAK masuk rumus skor. Hanya dipakai UI untuk menampilkan konfirmasi
    // penafsiran. Angka ini penilaian model tentang dirinya sendiri dan
    // cenderung menumpuk di rentang sempit — jangan dipakai memblokir apa pun.
    // `harga_sumber` dan `tipe_3 = 'SEMUA'` sinyal faktual yang lebih andal.
    confidence: z.number().min(0).max(1),
  })
}

export type Intent = {
  tipe_3: string
  harga_target: number
  harga_sumber: 'pengguna' | 'perkiraan'
  confidence: number
}
