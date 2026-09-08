# `lib/tipe3/padanan.ts` — dua tabel padanan

## Apa fungsinya

Dua daftar yang **ditempel ke dalam prompt sistem Gemini** di `lib/ai/parseIntent.ts`. Bukan
tabel database, dan tidak pernah menyentuh Supabase.

| | Isi | Menyelesaikan |
|---|---|---|
| `SINONIM_TIPE_3` | 24 kategori → kata yang wajar dipakai orang | AI mengarang nama kategori yang tidak ada di sensus |
| `HARGA_PERKIRAAN` | 24 kategori → perkiraan harga per porsi | tebakan harga berubah tiap pemanggilan |

## Cara pakai

```ts
import { daftarUntukPrompt, HARGA_DEFAULT } from '@/lib/tipe3/padanan'

const tipe3Values = await getTipe3Values()   // 24 nilai dari view tipe3_values
const daftar = daftarUntukPrompt(tipe3Values)
```

Menghasilkan teks siap tempel:

```
- "WARUNG TEGAL" (mis. warteg, warung tegal, warung nasi, warung makan, nasi rames) — perkiraan harga 15000
- "KAFE DAN RESTO" (mis. kafe, cafe, coffee shop, kedai kopi, warung kopi, ngopi, kopi susu) — perkiraan harga 25000
```

Hasilnya di `/api/prompt-request`:

```
"mau buka warteg"                 → WARUNG TEGAL    Rp 15.000  perkiraan
"mau buka kedai sushi"            → SUSHI           Rp 75.000  perkiraan
"mau buka warteg harga 12 ribu"   → WARUNG TEGAL    Rp 12.000  pengguna
```

## Dependency/prasyarat

- `getTipe3Values()` (`lib/tipe3`) — daftar kategori sah dari view `tipe3_values`.
- Tabel `katalog_restoran` terisi. Tanpa itu daftarnya kosong dan AI tidak punya pilihan.
- Tidak butuh env var. Fungsi murni, bisa dites tanpa server.

## Batasan/gotcha

**1. Kunci wajib cocok PERSIS dengan sensus**, huruf kapital semua. Terverifikasi 8 September
2026: 24 = 24, nol selisih di kedua arah terhadap
`select distinct tipe_3 from katalog_restoran`. Kalau ada yang meleset, kategori itu masuk
prompt tanpa sinonim dan tanpa harga — tidak error, cuma diam-diam kehilangan bantuan.

**2. `daftarUntukPrompt()` menyaring dari `tipe3Values`, bukan dari berkas ini.** Kategori yang
ada di berkas tapi tidak ada di database sengaja dibuang, supaya AI tidak pernah menyebut nilai
yang akan ditolak `/api/score`. Sebaliknya kategori baru di database yang belum ditambahkan ke
sini tetap muncul, hanya tanpa sinonim dan harga.

**3. Setiap angka terukur — tidak ada yang ditebak.** Kelimanya median harga nyata per format
tempat dari 175 pengamatan Menu Go DKI yang lolos pembersihan:

```
Kaki Lima/Gerobak  n=52   14.000        Kafe       n=26   22.000
Fast Food          n=19   17.000        Restoran   n=39   30.000
Warung/Tenda       n=39   20.000
```

`HARGA_DEFAULT` = 20.000, median seluruh 175 harga tanpa dipilah format — padanan yang tepat
untuk `SEMUA`, yang memang berarti "tidak menyaring kategori".

Yang tersisa sebagai penilaian tim hanyalah **menugaskan tiap kategori ke salah satu dari lima
format itu** — pertanyaan *"warteg itu formatnya warung atau restoran?"*, bukan *"warteg itu
berapa rupiah?"*. Kalimat PRD-nya: *perkiraan harga diturunkan dari median harga nyata per
format tempat pada 175 pengamatan Menu Go DKI.*

**4. Seluruh kategori premium mendarat di 30.000, dan ini batasan yang wajib diakui.** Menu Go
bukan populasi restoran — sebarannya didominasi kaki lima dan warung (Kaki Lima 47, Restoran
22, Warung 21, Fast Food 6, Kafe 4 dari sampel 100), sehingga median tertingginya berhenti di
30.000. Sushi, steak, dan masakan Eropa ikut ke sana, jauh di bawah harga sebenarnya di Jakarta.

Konsekuensinya pada rumus: untuk usaha premium, `harga_target` lebih rendah daripada niat
pengguna sesungguhnya, sehingga S menilai kawasan murah lebih cocok daripada semestinya.
**Ini pilihan sadar** — lebih baik meleset ke arah yang dapat ditelusuri daripada memakai angka
yang tidak ada dasarnya. Pengguna tetap bisa mengoreksi, karena `harga_sumber` selalu bernilai
`'perkiraan'` dan UI menawarkan penyuntingan.

**5. Tabel harga hanya dipakai kalau pengguna TIDAK menyebut harga.** Kalau menyebut, angka
penggunalah yang dipakai dan `harga_sumber` diisi `'pengguna'`. UI wajib menampilkan tawaran
koreksi saat nilainya `'perkiraan'`.

**6. Mengubah angka di sini mengubah peringkat.** `harga_target` masuk langsung ke rumus S.
Perlakukan seperti konstanta rumus lain — ubah dengan keputusan tim tertulis, jangan diam-diam.
