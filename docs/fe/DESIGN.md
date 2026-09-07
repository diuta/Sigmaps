# DESIGN-SYSTEM.md — SIGMAPS WebGIS Specifications

Dokumen acuan baku spesifikasi teknis desain dan antarmuka untuk tim perancang dan *frontend developer* (Clement & Caca) selama proses *vibe coding* SIGMAPS MVP.

---

> 🔄 **Disinkronkan dengan kode 7 September 2026.** Perubahan utama dari versi sebelumnya:
> sidebar berada di **kiri** (bukan kanan), ditambah token motion, `--sidebar-width`, kelas
> tipografi `.t-*`, spesifikasi `LayerPanel`, dan varian popup properti. Definisi token yang
> benar-benar dipakai ada di `app/globals.css`.

---

### 1. Canvas & Structural Layout

* **Base Desktop Canvas:** `1440px × 900px`

* **Sidebar Kiri Tunggal (Left-Aligned Singular Sidebar):** panel **melayang** di atas peta —
`fixed inset-y-0 left-0`, lebar `min(--sidebar-width, 100vw)` (380px), tinggi penuh,
`border-r`, latar `--color-surface-muted`, isi panel `overflow-y-auto`
    * *Catatan:* versi dokumen sebelumnya menetapkan sidebar di kanan (`border-l`).
      Implementasi menaruhnya di kiri dan **itu yang berlaku** — keputusan 7 September 2026.

* **Buka/tutup:** `translate-x-0` ↔ `-translate-x-full`, transisi `--motion-base` +
`--ease-out`. **Yang dianimasikan wajib `transform`, bukan `width`** — menganimasikan lebar
membuat kontainer peta ikut menyusut bertahap, dan `ResizeObserver` di `BaseMap` memanggil
`map.resize()` di tiap langkahnya sehingga peta berkedip. Lihat `docs/component-sidebar.md`.

* **Tombol tab buka/tutup:** `24×48px`, menempel di **tepi kanan sidebar, rata tengah
vertikal** (`absolute left-full top-1/2 -translate-y-1/2`), sudut kanan membulat
(`rounded-r`), border kiri dilepas supaya menyatu dengan panel, `elevation-subtle`, ikon `‹`
(tutup) / `›` (buka). Karena menempel pada sidebar, ia ikut bergeser saat panel keluar layar
dan berhenti persis di tepi kiri layar — **selalu** terlihat di kedua keadaan.

* **Breakpoint `768px`** hanya menentukan keadaan awal: di bawah 768px halaman dibuka dengan
panel tertutup supaya peta terlihat lebih dulu. Setelah pengguna menekan tombol, pilihannya
yang menang. Tidak ada perbedaan bentuk antara desktop dan mobile.


* **Area Kanvas Peta (Map Viewport):** **selalu selebar layar penuh** (`flex-1` tanpa saingan,
karena sidebar `fixed` keluar dari alur). Sidebar menumpanginya di `z-50`; bagian peta di balik
panel tetap dirender, hanya tertutup.


* **Z-Index Layering:**
* Base Map: `z-0`
* Map Polygons (Isochrone): `z-10`

* Map Property Markers: `z-20`

* Map Station Markers: `z-30`

* Map Tooltip / Hover Cards, Panel Tampilan Peta (`LayerPanel`), Dev Tools: `z-40`
* Left Sidebar Container: `z-50`




---

### 2. Design Tokens & Color Palette

#### A. Brand & Spatial Accents

* **Primary Brand (`Cobalt Metro`):** `#1E40AF` | Hover: `#1D4ED8` | Active: `#172554`
* *Penerapan:* Tombol eksekusi utama, *border stroke* poligon isokron 10 menit, dan pin stasiun aktif di peta.




* **Intelligence & Parameter Accent (`Electric Ultramarine`):** `#4F46E5` | Surface: `#EEF2FF`
* *Penerapan:* Badge ranking (#1–#5), pill ekstraksi Zod (`tipe_3`), dan bar nilai kompetisi ($C$).




* **Opportunity & Scoring (`Neon Emerald`):** `#10B981` | Surface: `#ECFDF5` | Text: `#065F46`
* *Penerapan:* Angka skor tinggi (80–100), pilar permintaan ($D$), dan status tag "Siap Sewa".




* **Property Pin Accent (`Warm Tangerine`):** `#F97316` | Hover: `#EA580C` | Surface: `#FFF7ED`
* *Penerapan:* Seluruh titik sebaran unit properti di peta dan aksen kartu katalog.




* **System Warning (`Amber Orange`):** `#F59E0B` | Surface: `#FEF3C7` | Text: `#92400E`
* *Penerapan:* Label koreksi harga perkiraan default (`harga_sumber = perkiraan`).





#### B. Neutrals & Surface Colors

* **Base Surface:** `#FFFFFF` (Latar belakang container kartu dan input)


* **Secondary Surface (Muted Canvas):** `#F8FAFC` (Latar sidebar dan list container)


* **Border Lines:** `#E2E8F0` (Garis pemisah kartu 1px solid)


* **Muted / Non-Rankable:** `#94A3B8` (Pin stasiun `is_rankable = false` dan ikon netral)


* **Base Typography:** `#0F172A` (Warna teks utama, kontras tinggi)


* **Sub-headline Text:** `#64748B` (Keterangan sekunder, alamat, dan label parameter)



---

### 3. Typography System (Plus Jakarta Sans)

Font Family: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif` — dimuat lewat
`next/font/google` di `app/layout.tsx` sebagai `--font-jakarta`.

Ketujuh token di bawah **sudah tersedia sebagai kelas utilitas** di `app/globals.css`; pakai
kelasnya, jangan menulis ulang `text-[13px] leading-[18px] font-normal` di komponen:
`.t-display-score` · `.t-heading-1` · `.t-heading-2` · `.t-body` · `.t-button` · `.t-tabular` ·
`.t-micro`. (`.t-micro` default-nya `font-semibold`; untuk keterangan sekunder yang tidak perlu
tebal, tambahkan `font-normal`.)

| Token Style | Font Size | Line Height | Weight | Tracking / Letter Spacing | Penggunaan Elemen |
| --- | --- | --- | --- | --- | --- |
| `display-score` | `28px` | `36px` | `700` (Bold) | `-0.02em` | Nilai skor stasiun (contoh: **78.3**)

 |
| `heading-1` | `18px` | `24px` | `700` (Bold) | `-0.01em` | Judul sidebar, Nama stasiun terpilih

 |
| `heading-2` | `15px` | `20px` | `600` (SemiBold) | `normal` | Nama properti, sub-header ranking

 |
| `body-default` | `13px` | `18px` | `400` (Regular) | `normal` | Narasi sentimen Community Activity, alamat

 |
| `button-label` | `13px` | `16px` | `600` (SemiBold) | `+0.01em` | Tombol cari / nilai kawasan, tab bar

 |
| `data-tabular` | `12px` | `16px` | `500` (Medium) | `normal` (Tabular) | Angka dekomposisi komponen ($D, C, S$)

 |
| `micro-badge` | `11px` | `14px` | `600` (SemiBold) | `+0.02em` | Pill Zod, tag ketersediaan, nomor ranking

 |

---

### 4. Spacing, Radius, & Elevation Tokens

* **Spacing Grid (4px Base Scale):**
* `space-xs`: `4px`
* `space-sm`: `8px`
* `space-md`: `12px`
* `space-lg`: `16px`
* `space-xl`: `24px`


* **Corner Radius:**
* Buttons & Cards: `8px` (`rounded-lg`)
* Input Area & Tooltips: `8px` (`rounded-lg`)
* Chips & Pills: `9999px` (`rounded-full`)


* **Shadows & Elevation:**
* `elevation-subtle` (Cards): `0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)`
* `elevation-float` (Hover Tooltips & Drawer): `0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)`


* **Layout:**
* `--sidebar-width`: `380px` (satu-satunya sumber lebar sidebar — jangan tulis `w-[380px]` lagi di komponen)


* **Motion** (tidak ada di versi dokumen sebelumnya, ditambahkan mengikuti `app/globals.css`):
* `--motion-fast`: `120ms` — hover, tekan tombol, toggle
* `--motion-base`: `200ms` — transisi opasitas panel (mis. hasil yang diredupkan saat brief disunting)
* `--motion-slow`: `320ms` — pengisian bar komponen skor
* `--ease-out`: `cubic-bezier(0.16, 1, 0.3, 1)`
* Animasi masuk: `motion-rise-in` (panel hasil), `motion-pop-in` (panel melayang)
* Bar skor dianimasikan dengan `transform: scaleX()`, **bukan** `width` — animasi lebar memicu
  layout tiap frame



---

### 5. In-Map Geospatial Layer Specifications

#### A. Simpul Stasiun (Station Markers)

* **Ukuran Pin:** `36px × 44px` (Bentuk Shield/Teardrop dengan ujung runcing bawah)
* **Stasiun Terpilih / Aktif:**
* Warna: `Cobalt Metro` (`#1E40AF`) dengan piktogram transit warna putih murni (`#FFFFFF`, `18px`)


* Border: `1.5px` solid `#FFFFFF`
* Outer Glow: `0 0 0 4px rgba(30, 64, 175, 0.20)`


* **Stasiun Belum Cukup Data (`is_rankable = false`):**
* Warna: `Cool Slate` (`#94A3B8`) dengan piktogram abu-abu gelap, tanpa *glow*



* **Label Teks Bawah Pin:** Pill putih (`#FFFFFF`, opacity `95%`), padding `2px 8px`, border radius `4px`, font `micro-badge` (`#0F172A`).

#### B. Titik Properti Sekitar (Nearby Property Markers)

* **Hit Target Aksesibilitas:** Minimum `44px × 44px` area sentuh transparan (*Apple HIG standard*).
* **State Normal (Idle):**
* Lingkaran geometris murni `12px` diameter.
* Warna: `Warm Tangerine` (`#F97316`), border `1.5px` solid `#FFFFFF` (tanpa garis hitam tebal).




* **State Hover:**
* Membesar menjadi `18px` diameter.
* Warna: `#EA580C`, border `2px` solid `#FFFFFF`, bayangan: `0 4px 12px rgba(234, 88, 12, 0.35)`.


* **State Active / Selected:**
* Lingkaran konsentris `20px`: pusat oranye `#EA580C`, gap cincin putih `2px`, cincin halo terluar oranye transparan `4px`.



#### C. Poligon Isokron (10-Minute Walk Reach)

* **Cakupan:** Hanya poligon jalan kaki **10 menit** stasiun terpilih (tanpa isokron 5 menit dan tanpa grid heksagon H3).


* **Border Stroke:** `Cobalt Metro` (`#1E40AF`), ketebalan `2px` solid.


* **Polygon Fill:** `#1E40AF` dengan tingkat transparansi/opacity `12%` agar jaringan jalan basemap tetap terbaca jelas.
* **Inner Core Fill:** `#1E40AF` opacity `8%` (hanya digambar bila datanya menyediakan feature `inner-core`).
* ⚠️ Poligon yang tampil sekarang masih **sintetis** dari `lib/map/isochrone-generator.ts`, bukan
isokron jaringan jalan MAPID — lihat `docs/component-map-layers.md`.

#### D. Panel Tampilan Peta (`LayerPanel`)

* **Posisi:** melayang di pojok **kanan bawah** area peta (`z-40`), dibuka lewat tombol
"Tampilan peta"; panel `280px`, `elevation-float`, animasi `motion-pop-in`.
* **Isi, hanya tiga hal:** daftar centang visibilitas layer, penggeser opasitas (20–100%, langkah 5),
dan pemilih peta dasar (Jalan / Terang / Gelap / Satelit, grid 2 kolom).
* **Batas tegas:** panel ini **hanya mengatur tampilan peta**. Tidak ada keterangan asal data,
tidak ada penjelasan komponen skor, tidak ada filter analisis di sini.
* ⚠️ Komponennya sudah ada tapi **belum dipasang** di `app/page.tsx`.

#### E. Popup Unit Properti

Tiga varian yang bisa dipilih saat pengembangan (`usePropertyPopupConfig`), tema terang/gelap:

* `sleek` — pil horizontal ±215–250px: thumbnail kotak 52px + judul + badge "Siap Sewa"/"Siap Jual" (default).
* `slender-detail` — `sleek` + satu baris alamat ringkas.
* `vertical-card` — kartu vertikal, foto di atas.

Badge memakai emerald untuk Sewa dan biru untuk Jual. **Tetap berlaku: tanpa harga, tanpa luas,
tanpa kontak.**

---

### 6. Component Blueprint: Singular Left Sidebar

Sidebar kiri menampung transisi vertikal dari mode input ke mode hasil penelusuran. Bagian
rencana (atas) dan bagian hasil (bawah) berdiri sendiri: membuka penyunting rencana hanya
**meredupkan** bagian hasil (opacity 65%), tidak melepasnya dari layar.

```text
            TERTUTUP                        TERBUKA
┌─────────────────────────────┐   ┌───────────┬─────────────────────┐
│                             │   │ RENCANA   │                     │
│                             │   │ USAHA     │   peta utuh di      │
│[›]      PETA (utuh)         │   │ ...     [‹]   bawah panel       │
│                             │   │           │                     │
└─────────────────────────────┘   └───────────┴─────────────────────┘
 tombol tab menempel di tepi       panel melayang di atas peta;
 kiri layar, rata tengah           lebar peta tidak pernah berubah
```

```text
┌────────────────────────────────────────┐
│ ▼ RENCANA USAHA                        │
│ ┌────────────────────────────────────┐ │
│ │ Textarea (bg: surface)             │ │
│ └────────────────────────────────────┘ │
│ [Chip contoh: "Kedai kopi kecil", ...] │
│ [Button: "Nilai kawasan"]              │
├────────────────────────────────────────┤
│ (Setelah dikirim: brief jadi ringkasan │
│  yang sengaja tampak nonaktif + [Ubah])│
├────────────────────────────────────────┤
│ ⚠ Harga tidak Anda sebutkan, kami      │
│   perkirakan Rp25.000  [Ubah rencana]  │
├────────────────────────────────────────┤
│ Peringkat › Tanah Abang                │
│ [1][2][3][4][5]   ← RankStrip, maks 5  │
│ TANAH ABANG                       78.3 │
│ Peringkat 1 dari 5 · 28 pengamatan     │
├────────────────────────────────────────┤
│ ┌Skor┐ Unit properti (7)   ← tab bar   │
│ ══════                                 │
│                                        │
│ TAB "SKOR":                            │
│ Permintaan            Bobot 0,25  0,53 │
│ [████▌ ‖   ‖              ]            │
│ "Tingkat keramaian ... di tengah."     │
│                                        │
│ Ruang kompetisi       Bobot 0,50  0,93 │
│ [█████████▌               ]            │
│ Kecocokan segmen harga Bobot 0,25 0,75 │
│ [███████▌                 ]            │
│                                        │
│ ▎Gambaran kawasan            (AI)      │
│  Ringkasan Community Activity...       │
│                                        │
│ › 32 kawasan tidak dinilai   ← tenang, │
│                        tertutup bawaan │
│                                        │
│ TAB "UNIT PROPERTI (7)":               │
│ 7 unit dari Properti Go, tidak ikut    │
│ menentukan skor                        │
│ [foto][foto]   grid 2 kolom            │
│ [foto][foto]   *tanpa harga/luas/kontak│
└────────────────────────────────────────┘
```

Catatan bentuk yang mengikat:

* **Bar komponen memakai warna `Neon Emerald`** (deterministik). Blok "Gambaran kawasan" adalah
satu-satunya elemen ber-`Electric Ultramarine` di sidebar, karena hanya itu keluaran AI.
* Dua garis (`‖`) pada bar Permintaan menandai rentang nilai di seluruh kawasan, digambar **di
atas** isian bar — kalau di belakang, ia selalu tertutup rapat oleh isian.
* **Dua tab: "Skor" dan "Unit properti (n)".** Identitas kawasan (breadcrumb, `RankStrip`,
nama, angka skor) berada di **atas** tab bar dan selalu terlihat. Tab aktif ditandai garis
bawah 2px `Cobalt Metro`; tab non-aktif memakai `--color-text-sub`.
    * **Jumlah unit wajib ikut di label tab**, termasuk `(0)`. Tanpa angka itu, keadaan
      "skor tinggi, nol properti" tersembunyi di balik satu klik padahal PRD menuntutnya
      terlihat sebagai empty state eksplisit.
    * Label ini **berbeda** dari rancangan awal dokumen ini ("Sentimen AI" dan "Unit"):
      ringkasan sentimen ikut ke tab **Skor**, karena ia konteks tentang kawasan — pertanyaan
      yang sama dengan skor, dan isinya pendek.
    * Pilihan tab dipertahankan saat pengguna berpindah peringkat.
* **Hanya satu kontainer scroll**, yaitu kolom sidebar. Jangan memberi `max-h` +
`overflow-y-auto` pada daftar di dalamnya (daftar properti pernah punya itu dan menghasilkan
scroll bersarang yang menelan event roda trackpad).
* **Maksimal 5 kawasan** di `RankStrip` dan panel hasil, walau `/api/score` mengembalikan lebih.
* **"Kawasan tidak dinilai" bukan peringatan.** Tanpa latar amber, tanpa kartu: teks kecil
`--color-muted` di paling bawah, memakai `<details>` bawaan peramban dan tertutup secara
bawaan. Amber tetap dipakai untuk hal yang menuntut perhatian (harga perkiraan, hasil basi,
galat) dan untuk penjelasan di `StationNoBriefPanel` ketika pengguna mengklik langsung satu
stasiun yang tidak dinilai — di situ jawabannya justru harus terbaca seketika.

---

### 7. Tailwind Utility Cheat-Sheet (Untuk Vibe Coding)

> ⚠️ Cheat-sheet di bawah memakai kelas Tailwind bawaan (`bg-slate-50`, `text-xs`) sebagai
> perkiraan cepat. Di kode, **token CSS yang dipakai** (`bg-[var(--color-surface-muted)]`,
> `t-body`, `p-[var(--space-lg)]`) — kalau keduanya berbeda, token yang menang.

* **Sidebar Container:** `w-[var(--sidebar-width)] h-screen bg-[var(--color-surface-muted)] border-r border-[var(--color-border)] flex flex-col gap-[var(--space-xl)] p-[var(--space-lg)] overflow-y-auto z-50`

* **Textarea Input:** `w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700`
* **Execute Button:** `w-full py-2.5 bg-slate-900 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-colors`
* **Badge Parameter Zod:** `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100`

* **Top 5 Card:** `p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-600 transition-all cursor-pointer shadow-sm`

* **Property Marker (Normal):** `w-3 h-3 bg-orange-500 border-[1.5px] border-white rounded-full shadow-sm`

* **Property Marker (Hover):** `w-[18px] h-[18px] bg-orange-600 border-2 border-white rounded-full shadow-lg transition-transform`