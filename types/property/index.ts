/**
 * types/property/index.ts
 * Kontrak request/response /api/properties (tabel properti_go Supabase).
 * Sumber: context/context-mvp.md §2 Langkah 4
 */

// ---------------------------------------------------------------------------
// Request
// ---------------------------------------------------------------------------

export interface PropertiesRequest {
  station_id: string; // match ke area_id di StationRanking
}

// ---------------------------------------------------------------------------
// Response
// ---------------------------------------------------------------------------

export interface PropertyUnit {
  id: string;
  /** e.g. "Kuliner", "Ritel", "Jasa" */
  kategori_properti: string;
  /** "Sewa" | "Jual" */
  jenis_properti: string;
  alamat: string;
  /** URL foto tampak depan — bisa null jika tidak ada */
  foto_tampak_depan: string | null;
  /** URL foto spanduk — bisa null jika tidak ada */
  foto_spanduk: string | null;
  /** WGS-84, dibutuhkan PropertyLayer untuk render marker */
  lat: number;
  lng: number;
}

/**
 * ⛔ KOLOM YANG DILARANG DITAMPILKAN:
 *    - Harga sewa / jual         (tidak ada di properti_go)
 *    - Luas bangunan / tanah     (tidak ada di properti_go)
 *    - Kontak pemilik / agen     (tidak ada di properti_go)
 *
 * Properti Go tidak menyimpan kolom-kolom itu.
 * Jangan buat field baru untuk menampungnya.
 */
