# components/sidebar/*

Sidebar adalah seluruh antarmuka non-peta SIGMAPS: tempat user menulis rencana usaha
(Business Brief), tempat hasil skor ditampilkan, dan tempat katalog properti kawasan dibaca.
Peta hanya menggambar; semua teks, angka, dan peringatan ada di sini.

Komponen-komponen sidebar, satu file satu tanggung jawab:

| File | Perannya |
|---|---|
| `Sidebar.tsx` | Wadah overlay + tombol buka/tutup + pemegang state alur (`draft`, `submitted`, `editing`, `override`) |
| `BriefSection.tsx` | Bagian atas: menukar kotak ketik ↔ ringkasan brief |
| `BusinessBriefInput.tsx` | Textarea + chip contoh + tombol kirim |
| `SubmittedBrief.tsx` | Brief yang sudah dikirim, tampak nonaktif, tombol "Ubah" |
| `OutputSection.tsx` | Bagian bawah: memilih panel mana yang tampil |
| `StationNoBriefPanel.tsx` | Kawasan diklik di peta tapi brief belum diisi — gambaran kawasan + `PropertyList` |
| `ScoredPanel.tsx` | Panel hasil: peringkat, komponen skor, sentimen, properti |
| `ExportPdfButton.tsx` | Tombol "Unduh PDF" — render ringkasan rencana usaha lewat [lib/pdf](lib-pdf-business-plan.md) |
| `RankStrip.tsx` | Deretan tombol angka 1..n untuk pindah peringkat |
| `ScoreComponentBar.tsx` | Satu bar komponen (D/C/S) + kalimat penjelas |
| `AreaInsightBlock.tsx` | Ringkasan AI Community Activity |
| `AreaGapBlock.tsx` | Chip "Kategori yang belum banyak di sini" — **isinya masih dummy** |
| `AiLoadingBlock.tsx` | Skeleton berdenyut selagi menunggu keluaran AI |
| `PropertyList.tsx` | Kartu unit Properti Go yang bisa diklik — presentational, datanya dari pemanggil |
| `PropertyDetail.tsx` | Halaman detail satu unit + tombol kembali |
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
| `ScoredPanel`, `StationNoBriefPanel` | `useProperties(stationId)` — hasilnya dioper ke `PropertyList` |

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

### Empat keadaan `OutputSection`

| Keadaan | Yang tampil |
|---|---|
| Belum ada brief, belum ada stasiun dipilih | tidak ada apa-apa (hanya bagian brief) |
| Stasiun diklik di peta, brief belum dinilai | `StationNoBriefPanel` (nama kawasan + ajakan menulis rencana + `AreaGapBlock` + `AreaInsightBlock` + `PropertyList`) |
| Brief sudah dinilai | `ScoredPanel` (didahului `PriceAssumptionNotice` bila perlu) |
| Satu unit properti diklik | `PropertyDetail` — mengambil alih **seluruh** panel hasil |

### Alur daftar → detail → kembali

Klik kartu unit membuka `PropertyDetail`, yang menggantikan seluruh panel hasil: header
kawasan, `RankStrip`, dan tab bar ikut hilang, sehingga tombol "Kembali" cuma punya satu arti.
Bagian rencana usaha di atasnya tetap.

`OutputSection` yang memegang unit terpilih (`detail`); `ScoredPanel` dan
`StationNoBriefPanel` hanya meneruskan `onSelectProperty(unit, stationName)` ke
`PropertyList` dan tidak tahu ada halaman detail sama sekali. Nama kawasan ikut dioper karena
breadcrumb detail membutuhkannya, dan `selectedStation` belum tentu terisi (kawasan #1 tampil
tanpa pengguna pernah mengkliknya).

Isi halaman detail persis apa yang ada di Properti Go: kategori (judul), badge Siap
Sewa/Siap Jual, alamat, dan dua foto (`foto_tampak_depan`, `foto_spanduk`) — plus satu kalimat
yang menyatakan terbuka bahwa harga, luas, dan kontak memang tidak dicatat dataset. Kalimat
itu bukan basa-basi: tanpa itu, halaman detail properti tanpa harga terbaca seperti data yang
gagal dimuat.

Aturan aksesibilitas yang mengikat di alur ini (hasil `ui-ux-pro-max`, severity High):

- Kartu daftar adalah **`<button>` sungguhan**, bukan `<li>` ber-`onClick` — bisa difokus
  keyboard dan punya cincin fokus (`focus-visible:outline-2`).
- Fokus **berpindah ke judul unit** saat detail terbuka, dan **kembali ke kartu asalnya**
  (`#unit-<id>`) saat ditutup.
- Foto memesan ruangnya lewat `aspect-[4/3]`, jadi layout tidak melompat saat foto termuat.

### Isi `ScoredPanel` — dua tab

```
breadcrumb · RankStrip · nama kawasan + skor besar + [Unduh PDF]  ← selalu tampil, di atas tab
────────────────────────────────────────────────────
[ Skor ] [ Unit properti (7) ]
────────────────────────────────────────────────────
tab "Skor" : 3 × ScoreComponentBar → AreaInsightBlock → UnrankableNotice
tab "Unit" : PropertyList
```

`ExportPdfButton` dipasang di header, **di luar dua tab** — isi PDF-nya menggabungkan konten
kedua tab (skor kawasan aktif + daftar propertinya) sekaligus Top 5 ranking, jadi tombolnya
tidak boleh terasa "milik" salah satu tab saja. Lihat
[lib-pdf-business-plan.md](lib-pdf-business-plan.md) untuk isi dokumennya.

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

`StationNoBriefPanel` sengaja **tanpa** tab: semua isinya menjawab satu pertanyaan yang sama
("kawasan ini seperti apa?"), jadi tab-bar cuma derau.

### Gambaran kawasan sebelum brief

Sejak 8 September 2026, `StationNoBriefPanel` tidak lagi hanya berisi daftar properti. Urutannya:
breadcrumb → nama kawasan → `AreaGapBlock` → `AreaInsightBlock` → `PropertyList`. Alasannya, saat
itulah user memutuskan kawasan mana yang layak ditulis rencananya — kalau tidak ada gambaran apa
pun, keputusan itu diambil tanpa dasar.

- `AreaInsightBlock` di sini memakai hook yang sama dengan `ScoredPanel`
  (`useCommunitySentiment(area_id)`), jadi **tidak ada endpoint baru**. Konsekuensinya: tiap klik
  pin stasiun memicu satu panggilan Gemini, karena endpoint itu belum punya cache. Lihat
  [api-community-sentiment.md](../context/api-community-sentiment.md).
- Blok hanya dirender kalau `ringkasan` tidak kosong; saat `error`, panel **tidak menampilkan apa
  pun** — kegagalan AI tidak boleh menghalangi daftar properti.
- ⚠️ **`AreaGapBlock` masih dummy.** Isinya `DUMMY_KATEGORI_JARANG` yang diekspor dari file
  komponennya sendiri, bukan data. Rencana sumber aslinya: field `kategori_jarang` yang menumpang
  panggilan Gemini yang sudah ada di `/api/community-sentiment` (bukan titik sentuh AI ketiga),
  divalidasi ke daftar `tipe3_values`. Perubahan itu ada di `app/api/`, `lib/ai/`, dan
  `types/sentiment/` — di luar zona sidebar, jadi ditunda.
- Blok **"Isi kawasan sekarang"** (jumlah pedagang per kategori) yang ada di mockup **tidak
  dibuat**: tidak ada view/tabel yang menyimpan komposisi pedagang per kawasan.
  `properti_go_by_station` hanya punya `kategori_properti` (jenis properti yang disewakan, bukan
  jenis pedagang) dan `scored_areas` hanya menyimpan komponen 0–1 + `n_observations`.

**Maksimal lima kawasan teratas yang tampil, dan pemotongannya dilakukan server**
(`app/api/score/route.ts`) — `ScoredPanel` merender apa adanya isi `scoreResult.areas`.
Konstanta `TOP_N` yang dulu ada di komponen ini sudah dihapus.

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

## Menunggu AI

Ada tiga masa tunggu AI di sidebar, dan ketiganya memakai komponen yang sama,
`AiLoadingBlock` — skeleton berdenyut sebentuk dengan `AreaInsightBlock` (border kiri accent +
tiga batang abu-abu + "AI sedang menulis..."). Bentuknya sengaja menyerupai hasil akhirnya
supaya ruangnya sudah dipesan: begitu teks AI datang, isi di bawahnya tidak melompat.

| Tempat | Menunggu |
|---|---|
| `StationNoBriefPanel` | `useCommunitySentiment` — gambaran kawasan sebelum brief |
| `ScoredPanel` (tab skor) | `useCommunitySentiment` — gambaran kawasan peringkat yang aktif |
| `OutputSection` | `useBriefResult` — `/api/prompt-request` lalu `/api/score` |

Catatan implementasi:

- **`OutputSection` menerima prop `loading`** dari `Sidebar`, dan penanda tunggunya dirender di
  **atas** isi yang sudah ada, bukan menggantikannya — selama menunggu, user tetap bisa membaca
  kawasan yang sedang dilihatnya, dan hasil lama yang sudah tidak cocok sudah diredupkan lewat
  mekanisme `stale`.
- **Early-return `OutputSection` ikut mengecek `loading`**
  (`if (!scored && !selectedStation && !loading) return null`). Pada penilaian pertama belum ada
  stasiun terpilih maupun skor, jadi tanpa pengecekan itu komponennya keluar duluan dan penanda
  tunggu tidak pernah sempat tampil.
- **Denyutnya `animate-pulse` bawaan Tailwind**, bukan keyframes baru — `app/globals.css` zona
  rekan dan tidak disentuh. Aturan `prefers-reduced-motion` di sana sudah berlaku ke `*`, jadi
  denyutnya otomatis mati untuk yang memintanya.
- **Saat AI gagal (`error`), tidak ada yang dirender.** Kegagalan ringkasan tidak boleh
  menghalangi daftar properti atau bar skor.

---

## Aturan warna (jangan ditukar)

- `--color-opportunity` (emerald): **hanya** untuk keluaran deterministik — angka skor dan bar
  D/C/S.
- `--color-accent` (ultramarine): **hanya** untuk keluaran AI — `AreaInsightBlock`, `AreaGapBlock`,
  `AiLoadingBlock`.
- `--color-warning` (amber): peringatan/keterbatasan data.
- `--color-pin` (tangerine): properti.

Pemisahan ini yang membuat user bisa tahu, tanpa membaca label, mana angka yang direproduksi
mesin dan mana kalimat yang ditulis model.

## Dependency/prasyarat

- Provider `SelectedStationProvider` dan `BriefResultProvider` wajib membungkus `Sidebar`.
- Token CSS di `app/globals.css` (`--color-*`, `--space-*`, `--radius-*`, `--motion-*`, kelas
  `.t-*`). **Jangan hardcode hex atau ukuran font** — lihat [docs/fe/DESIGN.md](../context/fe/DESIGN.md).
- Endpoint `/api/prompt-request`, `/api/score`, `/api/properties`, `/api/community-sentiment`.
- `ExportPdfButton` butuh `@react-pdf/renderer` (dependency npm) dan
  `lib/pdf/businessPlanDocument.tsx` — lihat [lib-pdf-business-plan.md](lib-pdf-business-plan.md).

## Batasan/gotcha

- **Sidebar dilarang memanggil `map.flyTo()` atau meng-import apa pun dari `components/map/`.**
  Untuk memindahkan kamera, ia menulis `setSelectedStation(...)`; `BaseMap` yang bereaksi
  (`context/fe/ARCHITECTURE.md` §4.1). `ScoredPanel.selectArea()` adalah contoh polanya.
- **Notice `tipe_3 = 'SEMUA'` belum diimplementasikan.** `context-mvp.md` §2 mewajibkan UI
  memberi tahu bahwa penilaian kompetisi memakai seluruh kategori kuliner; sekarang nilai
  `'SEMUA'` lewat tanpa keterangan apa pun ke user. `intent.tipe_3` sudah tersedia di
  `useBriefResult()`, jadi ini tinggal ditambahkan — bukan hal yang terhalang data.
- **Ukuran tombol tab (24×48px) ditulis langsung di `Sidebar.tsx`, bukan jadi token di
  `app/globals.css`.** Pengecualian sadar dari aturan "semua ukuran lewat token": file token
  itu zona rekan (`context/fe/ARCHITECTURE.md` §5) yang sedang dikerjakan di branch lain, dan
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
- **Jangan menyimpulkan apa pun dari ketiadaan sebuah kawasan di `scoreResult.areas`.**
  Isinya cuma Top 5; kawasan peringkat 6 ke bawah tetap dinilai, hanya tidak dikirim. Karena
  itu `demandObservedRange` di sini menggambarkan rentang **lima kawasan teratas**, bukan
  seluruh kawasan dinilai — batasan yang diterima sebagai konsekuensi pemotongan di server.
- **Panel hasil tetap ter-mount saat halaman detail terbuka** (disembunyikan `hidden`, bukan
  dilepas). Melepasnya mereset pilihan tab `ScoredPanel` — kembali dari detail harus mendarat
  lagi di tab "Unit properti", bukan "Skor" — dan membuat `useCommunitySentiment` memanggil
  Gemini sekali lagi. Ini juga yang membuat pengembalian fokus ke `#unit-<id>` bisa bekerja:
  elemennya masih ada di DOM.
- **Brief baru menutup halaman detail.** Kalau `scoreResult` berganti selagi detail terbuka,
  `OutputSection` menutupnya — daftar di baliknya sudah berganti kawasan, jadi "Kembali" akan
  mendarat di hasil yang lain.
- **Isi panel tetap ter-mount saat sidebar ditutup** (digeser keluar layar dengan `transform`,
  bukan `hidden` maupun unmount). Melepas `OutputSection` membuat `useCommunitySentiment`
  memanggil Gemini lagi setiap sidebar dibuka; `/api/community-sentiment` belum punya cache dan
  kuotanya dipakai bersama seluruh pengunjung. Jangan "merapikan" jadi `{open && <OutputSection />}`,
  dan jangan pakai `hidden` — `display:none` mematikan animasi transform-nya.
- **Daftar "data belum cukup" dibaca dari `/api/stations`, bukan dari selisih terhadap
  `/api/score`.** `UnrankableNotice` diisi dengan memfilter `feature.properties.is_rankable === false`
  milik `useStations()`. Perbandingan `=== false` disengaja: `null` berarti pipeline skoring
  belum jalan untuk kawasan itu, bukan datanya kurang — dua kondisi yang tidak boleh
  disamakan. Konsekuensinya notice itu **tidak** bisa menampilkan `n_observations`; datanya
  memang tidak ada di `/api/stations`.
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
- **`ScoredPanel` menerima prop baru `brief` (teks rencana usaha)**, dioper dari `Sidebar` lewat
  `OutputSection` — satu-satunya konsumennya adalah `ExportPdfButton`. Jangan dipakai untuk
  render lain di `ScoredPanel`; kalau butuh menampilkan teks brief, itu tugas `SubmittedBrief`.
