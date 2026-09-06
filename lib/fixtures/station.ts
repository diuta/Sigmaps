/** 🟡 FASE DUMMY — ringkasan kawasan saat belum ada rencana usaha. */

export interface AreaCompositionRow {
  label: string;
  jumlah: number;
}

export interface StationOverview {
  area_id: string;
  /** Keluaran AI — kategori yang belum banyak di kawasan itu. */
  kategori_jarang: readonly string[];
  ringkasan_ai: string;
  komposisi: readonly AreaCompositionRow[];
}

/**
 * Keyed per area_id. Baru satu kawasan yang punya isi contoh, jadi stasiun lain
 * menampilkan keadaan kosong yang jujur alih-alih memakai angka Juanda.
 */
export const STATION_OVERVIEWS: Record<string, StationOverview> = {
  st_juanda: {
    area_id: "st_juanda",
    kategori_jarang: ["Kedai kopi", "Bakery", "Minuman kekinian"],
    ringkasan_ai:
      "Kawasan ini didominasi pedagang kaki lima dan warung makan tradisional. Tempat nongkrong modern dengan harga menengah belum banyak terisi, sementara kepadatan pejalan kaki di sekitar stasiun tergolong tinggi.",
    komposisi: [
      { label: "Kaki lima", jumlah: 47 },
      { label: "Restoran", jumlah: 22 },
      { label: "Warung", jumlah: 21 },
      { label: "Fast food", jumlah: 6 },
      { label: "Kafe", jumlah: 4 },
    ],
  },
};
