import type { PropertyUnit } from "@/types/property";

/**
 * 🟡 FASE DUMMY — katalog Properti Go dalam isokron stasiun.
 * Empat field per unit. Tidak ada luas, harga, atau kontak pemilik.
 * Dipakai untuk daftar di sidebar (bukan pin peta), jadi lat/lng tidak perlu.
 */
export type PropertyListItem = Pick<
  PropertyUnit,
  "id" | "kategori_properti" | "jenis_properti" | "alamat" | "foto_tampak_depan"
>;

export const PROPERTIES: readonly PropertyListItem[] = [
  {
    id: "pg_001",
    kategori_properti: "Ruko",
    jenis_properti: "Sewa",
    alamat: "Jl. Ir. H. Juanda No. 12, Jakarta Pusat",
    foto_tampak_depan: null,
  },
  {
    id: "pg_002",
    kategori_properti: "Kios",
    jenis_properti: "Sewa",
    alamat: "Jl. Veteran I No. 4, Jakarta Pusat",
    foto_tampak_depan: null,
  },
  {
    id: "pg_003",
    kategori_properti: "Tempat usaha",
    jenis_properti: "Sewa",
    alamat: "Jl. Pos No. 2, Pasar Baru, Jakarta Pusat",
    foto_tampak_depan: null,
  },
  {
    id: "pg_004",
    kategori_properti: "Ruko",
    jenis_properti: "Jual",
    alamat: "Jl. Samanhudi No. 31, Jakarta Pusat",
    foto_tampak_depan: null,
  },
  {
    id: "pg_005",
    kategori_properti: "Kios",
    jenis_properti: "Sewa",
    alamat: "Jl. Kebon Sirih Timur No. 8, Jakarta Pusat",
    foto_tampak_depan: null,
  },
  {
    id: "pg_006",
    kategori_properti: "Tempat usaha",
    jenis_properti: "Sewa",
    alamat: "Jl. Batu Tulis Raya No. 17, Jakarta Pusat",
    foto_tampak_depan: null,
  },
];

export const PROPERTIES_FOOTNOTE =
  "Properti Go tidak menyediakan data luas, harga, maupun kontak pemilik, jadi ketiganya tidak ditampilkan di sini.";
