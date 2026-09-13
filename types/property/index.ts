export interface PropertyUnit {
  id: string;
  station_id?: string | null;
  /** e.g. "Kuliner", "Ritel", "Jasa" */
  kategori_properti: string;
  jenis_properti: string;
  alamat: string;
  foto_tampak_depan: string | null;
  foto_spanduk: string | null;
  /**
   * Nomor WhatsApp pemilik/pengelola properti, diambil via OCR dari foto_spanduk.
   * Format DB: +62xxxxxxxxxx (sudah ber-kode negara). null = foto tidak ada / OCR di bawah threshold.
   */
  contact_number?: string | null;
  /** WGS-84, dibutuhkan PropertyLayer untuk render marker */
  lat: number;
  lng: number;
  jarak_jalan_m?: number | null;
  waktu_jalan_s?: number | null;
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
