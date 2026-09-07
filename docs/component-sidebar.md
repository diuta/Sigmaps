# components/sidebar/*

Sidebar adalah seluruh antarmuka non-peta SIGMAPS: tempat user menulis rencana usaha
(Business Brief), tempat hasil skor ditampilkan, dan tempat katalog properti kawasan dibaca.
Peta hanya menggambar; semua teks, angka, dan peringatan ada di sini.

Tiga belas komponen, satu file satu tanggung jawab:

| File | Perannya |
|---|---|
| `Sidebar.tsx` | Wadah overlay + tombol buka/tutup + pemegang state alur (`draft`, `submitted`, `editing`, `override`) |
| `BriefSection.tsx` | Bagian atas: menukar kotak ketik ↔ ringkasan brief |
| `BusinessBriefInput.tsx` | Textarea + chip contoh + tombol kirim |
| `SubmittedBrief.tsx` | Brief yang sudah dikirim, tampak nonaktif, tombol "Ubah" |
| `OutputSection.tsx` | Bagian bawah: memilih panel mana yang tampil |
| `StationNoBriefPanel.tsx` | Kawasan diklik di peta tapi brief belum diisi |
| `ScoredPanel.tsx` | Panel hasil: peringkat, komponen skor, sentimen, properti |
| `RankStrip.tsx` | Deretan tombol angka 1..n untuk pindah peringkat |
| `ScoreComponentBar.tsx` | Satu bar komponen (D/C/S) + kalimat penjelas |
| `AreaInsightBlock.tsx` | Ringkasan AI Community Activity |
| `PropertyList.tsx` | Kartu unit Properti Go — presentational, datanya dari pemanggil |
| `UnrankableNotice.tsx` | Daftar kawasan yang tidak dinilai |
| `PriceAssumptionNotice.tsx` | Peringatan harga hasil perkiraan AI |
| `StaleOutputNotice.tsx` | Hasil di bawah masih milik brief sebelumnya |

## Cara pakai

Sidebar dipasang sekali di `app/page.tsx`, tanpa props:

```tsx
<BriefResultProvider>      {/* wajib: Sidebar & StationLayer sama-sama baca hasil brief */}
  <main className="flex h-screen w-screen">
    <Sidebar />            {/* overlay `fixed` di kiri — tidak memakan lebar peta */}
    <div className="flex-1"> <BaseMap>…</BaseMap> </div>
  </main>
</BriefResultProvider>
```

### Dua keadaan sidebar — dan kenapa ia melayang di atas peta

Sidebar adalah **overlay** (`fixed inset-y-0 left-0 z-50`), bukan kolom di sebelah peta.
Terbuka = `translate-x-0`, tertutup = `-translate-x-full`; satu tombol tab menempel di tepi
kanannya dan ikut bergeser, sehingga saat tertutup tombolnya berhenti di tepi kiri layar.
Perilakunya sama di semua ukuran layar; lebar layar hanya menentukan keadaan awal (di bawah
768px halaman dibuka dengan panel tertutup), dan sejak pengguna menekan tombolnya, pilihan
pengguna (`override`) yang menang.

⚠️ **Bentuk overlay ini bukan pilihan estetis, ia memperbaiki bug nyata.** Versi sebelumnya
adalah kolom yang menganimasikan `width`, dan `components/map/BaseMap.tsx` memasang
`ResizeObserver` yang memanggil `map.resize()` pada **setiap** perubahan ukuran kontainer —
jadi selama 200ms animasi, canvas MapLibre di-resize dan digambar ulang belasan kali: peta
terlihat berkedip. Dengan `fixed`, sidebar keluar dari flex row `app/page.tsx` sehingga
pembungkus peta **selalu** selebar layar penuh, `ResizeObserver` tidak pernah terpanggil saat
toggle, dan yang beranimasi hanya `transform` (murni compositor). **Jangan** mengembalikannya
jadi lebar yang dianimasikan, dan jangan menutup panel dengan `hidden`/unmount — keduanya
membawa balik flicker atau memanggil ulang Gemini (lihat gotcha di bawah).

Data tidak dioper lewat props dari halaman — tiap komponen membaca context yang ia butuhkan
([docs/hooks.md](hooks.md)):

| Komponen | Membaca |
|---|---|
| `Sidebar`, `OutputSection` | `useBriefResult()` (intent, skor, loading, error) |
| `OutputSection`, `StationNoBriefPanel`, `ScoredPanel` | `useSelectedStation()` |
| `ScoredPanel` | `useStations()`, `useCommunitySentiment()` |
| `PropertyList` | `useProperties(stationId)` |

### Alur state (semuanya di `Sidebar.tsx`)

```
draft        : teks yang sedang diketik
submitted    : teks brief yang hasilnya sedang tampil (null = belum pernah kirim)
editing      : penyunting terbuka walau sudah ada hasil
override     : pilihan buka/tutup pengguna (null = ikut lebar layar)
```

Kawasan peringkat yang sedang dibuka (`activeAreaId`) dipegang `ScoredPanel`, bukan di sini —
hanya panel itu yang memakainya.

- Kirim brief → `submitBrief(teks)` (POST `/api/prompt-request` lalu POST `/api/score`) →
  `submitted` diisi, `editing` ditutup.
- Klik "Ubah" → `draft` diisi ulang dari `submitted`, `editing` dibuka. Hasil **tidak** dihapus:
  ia hanya diredupkan (opacity 65%) dan diberi `StaleOutputNotice`, supaya user bisa
  membandingkan sambil mengetik ulang.
- Label tombol ikut keadaan: `Nilai kawasan` → `Menilai...` → `Nilai ulang kawasan`.

### Tiga keadaan `OutputSection`

| Keadaan | Yang tampil |
|---|---|
| Belum ada brief, belum ada stasiun dipilih | tidak ada apa-apa (hanya bagian brief) |
| Stasiun diklik di peta, brief belum dinilai | `StationNoBriefPanel` (nama kawasan + ajakan menulis rencana + `PropertyList`) |
| Brief sudah dinilai | `ScoredPanel` (didahului `PriceAssumptionNotice` bila perlu) |

### Isi `ScoredPanel` — dua tab

```
breadcrumb · RankStrip · nama kawasan + skor besar      ← selalu tampil, di atas tab
────────────────────────────────────────────────────
[ Skor ] [ Unit properti (7) ]
────────────────────────────────────────────────────
tab "Skor" : 3 × ScoreComponentBar → AreaInsightBlock → UnrankableNotice
tab "Unit" : PropertyList
```

Dua tab karena keduanya menjawab pertanyaan berbeda: skor menjawab *"kawasan ini bagus atau
tidak?"*, daftar unit menjawab *"apa yang sebenarnya bisa saya sewa di sini?"*. Identitas
kawasan (nama, skor, `RankStrip`) sengaja di **atas** tab supaya berpindah tab tidak pernah
menghilangkan konteks kawasan mana yang sedang dibuka.

**Jumlah unit wajib ada di label tab** (`Unit properti (7)`, `(0)` saat kosong). Tanpa angka
itu, keadaan "kawasan skor tinggi tapi nol properti" tersembunyi di balik satu klik, padahal
PRD menuntutnya terlihat sebagai empty state eksplisit — bukan panel kosong yang terlihat
seperti bug. Ini bukan kasus teoretis: pada data sekarang, 3 dari 5 kawasan teratas punya nol
properti, termasuk peringkat #2 (skor 79,3).

Blok sentimen AI berada di **tab skor**, bukan tab unit — ia konteks tentang kawasan,
pertanyaan yang sama dengan skor. `UnrankableNotice` juga di tab skor, karena ia menjawab
"kenapa kawasan lain tidak ada di peringkat".

`StationNoBriefPanel` sengaja **tanpa** tab: di sana hanya ada satu hal untuk ditampilkan, jadi
tab-bar berisi satu tab cuma derau.

**Hanya `TOP_N` (5, konstanta di `ScoredPanel.tsx`) kawasan teratas yang ditampilkan**, walau `/api/score` mengembalikan
semua kawasan yang dapat diperingkat (di data sekarang: 11).

Kalimat di tiap bar datang dari [lib/scoring/explanations.ts](lib-scoring-explanations.md),
bukan dari AI. Bar `demand` juga menerima dua tambahan: klausa tarikan-ke-netral
(`explainNeutralPull`) dan penanda rentang nilai seluruh kawasan (`observedRange`) — penanda
rentang sengaja digambar **di atas** isian bar, karena kalau di belakang ia selalu tertutup.

## Perilaku wajib (`context/context-mvp.md` §2 Langkah 2) dan komponen yang memenuhinya

| Kondisi | Komponen | Catatan |
|---|---|---|
| `harga_sumber = 'perkiraan'` | `PriceAssumptionNotice` | Menyebut angka perkiraannya + tombol "Ubah rencana". Inferensi yang terlihat & bisa disunting itu sah |
| `tipe_3 = 'SEMUA'` | ❌ **belum ada** | Lihat Batasan/gotcha |
| Kawasan tanpa skor | `UnrankableNotice` (+ label pin di peta) | Dihitung frontend, bukan dikirim backend. Tampil sebagai ringkasan `<details>` yang tertutup di bagian paling bawah |
| Usaha non-kuliner | `Sidebar` (blok `error`) | `/api/prompt-request` balas 400, pesannya ditampilkan apa adanya |
| `confidence` rendah | — | Sengaja tidak memblokir apa pun (§6.6) |

## Aturan warna (jangan ditukar)

- `--color-opportunity` (emerald): **hanya** untuk keluaran deterministik — angka skor dan bar
  D/C/S.
- `--color-accent` (ultramarine): **hanya** untuk keluaran AI — `AreaInsightBlock`.
- `--color-warning` (amber): peringatan/keterbatasan data.
- `--color-pin` (tangerine): properti.

Pemisahan ini yang membuat user bisa tahu, tanpa membaca label, mana angka yang direproduksi
mesin dan mana kalimat yang ditulis model.

## Dependency/prasyarat

- Provider `SelectedStationProvider` dan `BriefResultProvider` wajib membungkus `Sidebar`.
- Token CSS di `app/globals.css` (`--color-*`, `--space-*`, `--radius-*`, `--motion-*`, kelas
  `.t-*`). **Jangan hardcode hex atau ukuran font** — lihat [docs/fe/DESIGN.md](fe/DESIGN.md).
- Endpoint `/api/prompt-request`, `/api/score`, `/api/properties`, `/api/community-sentiment`.

## Batasan/gotcha

- **Sidebar dilarang memanggil `map.flyTo()` atau meng-import apa pun dari `components/map/`.**
  Untuk memindahkan kamera, ia menulis `setSelectedStation(...)`; `BaseMap` yang bereaksi
  (`docs/fe/ARCHITECTURE.md` §4.1). `ScoredPanel.selectArea()` adalah contoh polanya.
- **Notice `tipe_3 = 'SEMUA'` belum diimplementasikan.** `context-mvp.md` §2 mewajibkan UI
  memberi tahu bahwa penilaian kompetisi memakai seluruh kategori kuliner; sekarang nilai
  `'SEMUA'` lewat tanpa keterangan apa pun ke user. `intent.tipe_3` sudah tersedia di
  `useBriefResult()`, jadi ini tinggal ditambahkan — bukan hal yang terhalang data.
- **Ukuran tombol tab (24×48px) ditulis langsung di `Sidebar.tsx`, bukan jadi token di
  `app/globals.css`.** Pengecualian sadar dari aturan "semua ukuran lewat token": file token
  itu zona rekan (`docs/fe/ARCHITECTURE.md` §5) yang sedang dikerjakan di branch lain, dan
  menambah satu baris di sana berarti konflik merge yang harus dia selesaikan. Angkat jadi
  token setelah kedua branch bertemu.
- **Stasiun terpilih bisa tertutup panel.** Karena sidebar kini menumpang di atas peta,
  `map.flyTo()` di `BaseMap` memusatkan stasiun ke tengah **seluruh** lebar peta, termasuk
  bagian yang tertutup sidebar. Perbaikannya `flyTo({ padding: { left: … } })` — ada di
  `BaseMap.tsx` (zona rekan), jadi diangkat saat kedua branch bertemu, bukan sekarang.
- **Satu kontainer scroll saja, dan itu kolom sidebar.** `PropertyList` dulu punya
  `max-h-[420px] overflow-y-auto` sendiri di dalam kolom sidebar yang juga bisa di-scroll. Dua
  kontainer scroll bertumpuk di panel 380px terasa rusak halus di trackpad: daftar dalam
  menelan event roda, lalu halaman melompat begitu daftar itu mentok. Jangan menambahkan
  `overflow`/`max-h` baru di dalam sidebar — kalau sebuah daftar terasa terlalu panjang,
  pisahkan jadi tab, jangan diberi scroll sendiri.
- **`useProperties` dipanggil pemanggil, bukan `PropertyList`.** Label tab butuh
  `properties.length`, dan memanggil hook yang sama dua kali berarti dua permintaan
  `/api/properties` untuk stasiun yang sama. Karena itu `PropertyList` menerima
  `properties` + `loading` sebagai props, dan tiap tampilan (`ScoredPanel`,
  `StationNoBriefPanel`) memanggil hook itu tepat sekali.
- **Pilihan tab tidak pernah direset otomatis** — tidak saat pengguna berpindah peringkat, dan
  tidak saat brief baru dinilai. Kalau ia sedang membandingkan unit antar peringkat, dilempar
  balik ke tab skor tiap kali berpindah lebih buruk daripada tidak punya tab sama sekali.
- **`TOP_N` memotong tampilan, bukan data.** Di `ScoredPanel`, `allRanked` (seluruh kawasan
  berskor) dan `rankedAreas` (`allRanked.slice(0, TOP_N)`) adalah dua hal berbeda, dan dua
  hitungan **wajib** memakai `allRanked`: daftar `unrankableStations` — kalau memakai daftar
  yang sudah dipotong, kawasan peringkat 6 ke bawah salah dilabeli "data belum cukup" padahal
  justru dinilai — dan `demandObservedRange`, yang menggambarkan rentang seluruh kawasan
  dinilai, bukan lima teratas.
- **Isi panel tetap ter-mount saat sidebar ditutup** (digeser keluar layar dengan `transform`,
  bukan `hidden` maupun unmount). Melepas `OutputSection` membuat `useCommunitySentiment`
  memanggil Gemini lagi setiap sidebar dibuka; `/api/community-sentiment` belum punya cache dan
  kuotanya dipakai bersama seluruh pengunjung. Jangan "merapikan" jadi `{open && <OutputSection />}`,
  dan jangan pakai `hidden` — `display:none` mematikan animasi transform-nya.
- **`is_rankable` tidak pernah datang dari `/api/score` dalam keadaan `false`.** Endpoint hanya
  mengirim kawasan rankable, jadi daftar "data belum cukup" di `UnrankableNotice` dihitung
  dengan mengurangi `useStations()` dengan `scoreResult.areas`. Konsekuensinya notice itu
  **tidak** bisa menampilkan `n_observations` — datanya memang tidak dikirim. Komentar di
  `types/scoring/index.ts` yang menulis "semua kawasan termasuk `is_rankable=false` dikirim"
  sudah tidak sesuai kode; jangan dijadikan acuan.
- **`ScoredPanel` menyetel ulang peringkat aktif ke #1 saat `scoreResult` berganti**, dilakukan
  langsung saat render (pola resmi React "adjusting state when a prop changes"), bukan lewat
  `useEffect`. Jangan "diperbaiki" jadi efek — tidak ada efek samping di luar React di situ.
- **`PropertyList` memakai `station_id`**, dan `StationNoBriefPanel` mengopernya dari
  `selectedStation.area_id`. Ini hanya benar selama relasi kawasan↔stasiun 1:1 di MVP
  (`context-mvp.md` §6.7). Kalau isokron 5 menit dihidupkan lagi, dua field ini berpisah dan
  pemanggilan itu harus diperbaiki.
- **Dilarang menampilkan luas, harga, atau kontak pemilik** di kartu properti — kolomnya
  memang tidak ada di Properti Go. Jangan ditambahkan "jaga-jaga".
- `PropertyList` memakai `<img>` biasa (bukan `next/image`) dengan `eslint-disable` — foto
  berasal dari domain MAPID yang belum didaftarkan di `next.config.ts`.
