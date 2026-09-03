/**
 * Kolom yang tersedia di Properti Go — context-mvp.md §2 Langkah 4.
 * ⛔ DILARANG tambahkan luas, harga, atau kontak pemilik: kolom itu tidak ada.
 */
export interface PropertyUnit {
  id: string;
  kategori_properti: string;
  jenis_properti: "Sewa" | "Jual";
  alamat: string;
  foto_tampak_depan: string | null;
}
