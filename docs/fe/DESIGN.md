# DESIGN-SYSTEM.md — SIGMAPS WebGIS Specifications

Dokumen acuan baku spesifikasi teknis desain dan antarmuka untuk tim perancang dan *frontend developer* (Clement & Caca) selama proses *vibe coding* SIGMAPS MVP.

---

### 1. Canvas & Structural Layout

* **Base Desktop Canvas:** `1440px × 900px`

* **Sidebar Kanan Tunggal (Right-Aligned Singular Sidebar):** `380px` (Fixed Width, Full Height `100vh`)


* **Area Kanvas Peta (Map Viewport):** Sisa area layar responsif (`calc(100vw - 380px)`)


* **Z-Index Layering:**
* Base Map: `z-0`
* Map Polygons (Isochrone): `z-10`

* Map Property Markers: `z-20`

* Map Station Markers: `z-30`

* Map Tooltip / Hover Cards: `z-40`
* Right Sidebar Container: `z-50`




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

Font Family: `'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif`

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



---

### 6. Component Blueprint: Singular Right Sidebar

Sidebar kanan menampung transisi vertikal dari mode input ke mode hasil penelusuran.

```text
┌────────────────────────────────────────┐
│ [SIGMAPS]              Status: Jakarta │
├────────────────────────────────────────┤
│ ▼ BUSINESS BRIEF                       │
│ ┌────────────────────────────────────┐ │
│ │ Textarea (min-h: 80px, bg: white)  │ │
│ └────────────────────────────────────┘ │
│ [Suggestion Pills: "Kedai Kopi", ...]  │
│ [Button: "NILAI KAWASAN" (#0F172A)]    │
├────────────────────────────────────────┤
│ (State Setelah Submit: Brief Melipat)  │
│ ┌────────────────────────────────────┐ │
│ │ 🔍 BRIEF AKTIF              [Ubah] │ │
│ │ [KAFE DAN RESTO] [Target: Rp18.000]│ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ HASIL REKOMENDASI KAWASAN              │
│ ┌────────────────────────────────────┐ │
│ │ #1 STASIUN TANAH ABANG   Skor 78.3 │ │
│ │ Permintaan (D)       [===   ] 0.52 │ │
│ │ Ruang Kompetisi (C)  [===== ] 0.92 │ │
│ │ Kesesuaian Harga (S) [====  ] 0.75 │ │
│ └────────────────────────────────────┘ │
├────────────────────────────────────────┤
│ (Saat Stasiun Dipilih: Panel Detail)   │
│ [ Tab 1: Sentimen AI ] [ Tab 2: Unit ] │
│                                        │
│ • Konten Tab 1: Ringkasan narasi       │
│   Community Activity sekitar stasiun   │
│                                        │
│ • Konten Tab 2: Kartu Unit Properti    │
│   (Thumbnail 64px, Kategori, Alamat)   │
│   *Strict: No Price, No Size, No Phone │
└────────────────────────────────────────┘

```

---

### 7. Tailwind Utility Cheat-Sheet (Untuk Vibe Coding)

* **Sidebar Container:** `w-[380px] h-screen bg-slate-50 border-l border-slate-200 flex flex-col p-4 overflow-y-auto z-50`

* **Textarea Input:** `w-full p-3 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-700`
* **Execute Button:** `w-full py-2.5 bg-slate-900 hover:bg-blue-800 text-white font-semibold rounded-lg text-sm transition-colors`
* **Badge Parameter Zod:** `inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100`

* **Top 5 Card:** `p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-600 transition-all cursor-pointer shadow-sm`

* **Property Marker (Normal):** `w-3 h-3 bg-orange-500 border-[1.5px] border-white rounded-full shadow-sm`

* **Property Marker (Hover):** `w-[18px] h-[18px] bg-orange-600 border-2 border-white rounded-full shadow-lg transition-transform`