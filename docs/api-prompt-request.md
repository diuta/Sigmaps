# `app/api/prompt-request/route.ts` — POST /api/prompt-request

## Apa fungsinya

Titik sentuh AI #3. Mengubah kalimat bebas Business Brief jadi parameter terstruktur yang
langsung bisa dikirim ke [`/api/score`](api-score.md).

```
"mau buka warung nasi padang, sekitar 20 ribuan"
   → { tipe_3: "RESTORAN PADANG", harga_target: 20000, harga_sumber: "pengguna", confidence: 1 }
```

AI hanya menyiapkan **masukan**. Skor tetap dihitung deterministik di `lib/scoring`. Kalimat
yang benar untuk PRD: *parameter yang sama selalu menghasilkan skor yang sama* — bukan "AI
tidak pernah dipanggil".

Route ini tipis sesuai `CLAUDE.md` bagian 2: validasi → panggil `lib/ai/parseIntent` → format
respons. Seluruh prompt sistem, penanganan galat, dan validasi Zod atas keluaran Gemini ada di
`lib/ai/parseIntent.ts`.

## Cara pakai

```
POST /api/prompt-request
Content-Type: application/json

{ "teks": "mau buka warung nasi padang, sekitar 20 ribuan" }
```

Respons sukses:

```json
{
  "data": {
    "tipe_3": "RESTORAN PADANG",
    "harga_target": 20000,
    "harga_sumber": "pengguna",
    "confidence": 1
  }
}
```

Kode galat:

| Kondisi | Kode | Pesan |
|---|---|---|
| Body bukan JSON | 400 | `Body bukan JSON yang valid` |
| `teks` kosong / tidak ada | 400 | `Input tidak valid` |
| Usaha non-kuliner (laundry, bengkel, salon) | 400 | `Hanya usaha kuliner yang didukung` |
| Keluaran Gemini gagal validasi Zod | 422 | `Permintaan tidak dapat ditafsirkan` |
| Gemini tidak tersedia / kuota habis | 503 | `Layanan AI sedang penuh, gunakan filter manual` |
| Gagal membaca daftar kategori | 503 | `Gagal mengambil daftar kategori usaha` |

## Dependency/prasyarat

- [`lib/ai/gemini.ts`](lib-ai-gemini.md) — client Gemini, butuh `GEMINI_API_KEY`.
- `lib/ai/parseIntent.ts` — prompt sistem, tiga kelas galat, validasi Zod.
- `lib/schemas/prompt-request.ts` — `PromptRequestSchema` dan `buildGeminiRawSchema`.
- `lib/tipe3` — `getTipe3Values()`, membaca view `tipe3_values`. Route ini tidak jalan tanpa
  tabel `katalog_restoran` terisi.

## Batasan/gotcha

**1. Nama field body-nya `teks`, bukan `text` atau `prompt`.** Mengikuti `context-mvp.md` §2.
Sebelumnya sempat ada tiga nama berbeda untuk hal yang sama — dokumen ini menulis `teks`, route
membaca `body.text`, dan skemanya memakai `prompt`. Sudah disatukan.

**2. Tiga kelas galat WAJIB dibedakan dengan `instanceof`,** bukan ditangkap sebagai `Error`
generik. `NonCulinaryError` → 400, `IntentValidationError` → 422, `GeminiUnavailableError` →
503. Menyamakannya membuat UI tidak bisa membedakan "usahamu bukan kuliner" dari "AI sedang
sibuk" — dua hal yang penanganannya sangat berbeda bagi pengguna.

**3. `'SEMUA'` bukan tempat pembuangan.** Dipakai hanya bila usahanya kuliner tapi jenisnya
tidak disebut jelas. Usaha non-kuliner **ditolak**, bukan dilempar ke `SEMUA` — kepadatan
restoran tidak mengatakan apa pun tentang peluang laundry atau barbershop (§6.6).

**4. Daftar `TIPE_3` dibangun dinamis dari `getTipe3Values()`, tidak pernah diketik manual.**
Versi lama berkas skema memuat placeholder empat nilai karangan berkapitalisasi judul
(`'Restoran Padang'`, `'Warung Nasi'`, `'Kedai Kopi'`, `'Restoran Cepat Saji'`). Sensus yang
sebenarnya berisi 24 nilai HURUF KAPITAL, dan dua di antara empat itu tidak ada sama sekali.
Kalau daftar itu dipakai, Gemini dipaksa mengeluarkan kategori yang tidak akan pernah cocok
dengan kunci `competitor_counts`, dan alurnya putus di `/api/score` dengan 400.

**5. `confidence` TIDAK masuk rumus skor.** Hanya untuk UI menampilkan konfirmasi penafsiran.
Angka ini penilaian model tentang dirinya sendiri dan cenderung menumpuk di rentang sempit —
uji nyata mengembalikan `1` untuk kalimat sesederhana "warung nasi padang". **Jangan dipakai
memblokir apa pun.** Sinyal faktual yang lebih andal: `harga_sumber` dan `tipe_3 = 'SEMUA'`.

**6. `harga_target` selalu terisi, tidak pernah `null`.** Alurnya one-shot, tidak ada layar
tanya balik. Bila pengguna tidak menyebut harga, AI memperkirakannya dan `harga_sumber` diisi
`'perkiraan'` — UI wajib menampilkan tawaran koreksi ("Harga tidak disebutkan, kami perkirakan
Rp25.000 dari jenis usaha. Ubah?").

**7. `generateObject` sengaja tidak dipakai** — instruksi tim. Struktur dipaksa lewat prompt
sistem, lalu keluaran Gemini divalidasi manual dengan Zod (`CLAUDE.md` #6: output AI wajib
divalidasi Zod sebelum dipakai).

**8. Belum ada rate limiting.** `middleware.ts` belum dibuat. Kuota Gemini berlaku per project,
bukan per kunci — seluruh pengunjung berbagi satu kuota. Wajib ada sebelum endpoint ini dibuka
ke publik, bukan blocker demo internal.
