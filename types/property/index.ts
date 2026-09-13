/**
 * types/property/index.ts
 * Kontrak request/response /api/properties (tabel properti_go Supabase).
 * Sumber: context/context-mvp.md §2 Langkah 4
 */

// ---------------------------------------------------------------------------
// Response
// ---------------------------------------------------------------------------

export interface PropertyUnit {
  id: string;
  station_id?: string | null;
  /** e.g. "Kuliner", "Ritel", "Jasa" */
  kategori_properti: string;
  /** "Sewa" | "Jual" */
  jenis_properti: string;
  alamat: string;
  /** URL foto tampak depan — bisa null jika tidak ada */
  foto_tampak_depan: string | null;
  /** URL foto spanduk — bisa null jika tidak ada */
  foto_spanduk: string | null;
  /**
   * Nomor WhatsApp pemilik/pengelola properti, diambil via OCR dari foto_spanduk.
   * Format DB: +62xxxxxxxxxx (sudah ber-kode negara). null = foto tidak ada / OCR di bawah threshold.
   */
  contact_number?: string | null;
  /** WGS-84, dibutuhkan PropertyLayer untuk render marker */
  lat: number;
  lng: number;
  /**
   * Rute jalan kaki properti → stasiun aktif, hasil batch etl/hitung_rute.py (OSRM foot),
   * dibaca dari tabel rute_properti lewat view properti_go_by_station.
   * null/undefined = belum dihitung — tampilkan tanpa jarak, bukan galat.
   */
  jarak_jalan_m?: number | null;
  waktu_jalan_s?: number | null;
  /** GeoJSON LineString rute; digambar RouteLayer saat properti dipilih */
  rute?: { type: "LineString"; coordinates: [number, number][] } | null;
}

/**
 * ⛔ KOLOM YANG DILARANG DITAMPILKAN:
 *    - Harga sewa / jual         (tidak ada di properti_go)
 *    - Luas bangunan / tanah     (tidak ada di properti_go)
 *    - Harga sewa / jual         (tidak ada, jangan tambah)
 *    - Luas bangunan / tanah     (tidak ada, jangan tambah)
 *    - contact_number             SUDAH ADA di kolom properti_go.contact_number — aman ditampilkan
 *
 * Properti Go tidak menyimpan kolom-kolom itu.
 * Jangan buat field baru untuk menampungnya.
 */
