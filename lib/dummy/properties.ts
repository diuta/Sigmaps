/**
 * lib/dummy/properties.ts
 * 🟡 FASE DUMMY — hapus file ini saat /api/properties siap.
 *
 * PropertyUnit[] per station_id.
 * Shape identik dengan types/property.ts — swap ke real fetch tanpa refactor.
 *
 * ⛔ Tidak ada harga, luas, atau kontak — sesuai aturan context-mvp §2 Langkah 4.
 * Foto menggunakan placeholder URL (ganti dengan Supabase Storage URL nanti).
 */

import type { PropertyUnit } from "@/types/property";

const PLACEHOLDER_FOTO =
  "https://placehold.co/400x300/e2e8f0/94a3b8?text=Foto+Belum+Tersedia";

export const DUMMY_PROPERTIES: Record<string, PropertyUnit[]> = {
  st_bni_city: [
    {
      id: "prop-bnc-001",
      kategori_properti: "Kuliner",
      jenis_properti: "Sewa",
      alamat: "Jl. Jend. Sudirman Kav. 1, Karet Tengsin, Jakarta Pusat",
      foto_tampak_depan: PLACEHOLDER_FOTO,
      foto_spanduk: null,
      lat: -6.2017,
      lng: 106.8219,
    },
    {
      id: "prop-bnc-002",
      kategori_properti: "Kuliner",
      jenis_properti: "Sewa",
      alamat: "Ruko Sudirman Park Blok B No. 3, Jakarta Pusat",
      foto_tampak_depan: PLACEHOLDER_FOTO,
      foto_spanduk: PLACEHOLDER_FOTO,
      lat: -6.2014,
      lng: 106.8215,
    },
    {
      id: "prop-bnc-003",
      kategori_properti: "Ritel",
      jenis_properti: "Jual",
      alamat: "Gedung Menara Sudirman Lt. G, Jl. Jend. Sudirman, Jakarta",
      foto_tampak_depan: null,
      foto_spanduk: PLACEHOLDER_FOTO,
      lat: -6.2021,
      lng: 106.8222,
    },
  ],

  st_manggarai: [
    {
      id: "prop-mgr-001",
      kategori_properti: "Kuliner",
      jenis_properti: "Sewa",
      alamat: "Jl. Manggarai Utara III No. 12, Manggarai, Jakarta Selatan",
      foto_tampak_depan: PLACEHOLDER_FOTO,
      foto_spanduk: null,
      lat: -6.2094,
      lng: 106.8504,
    },
    {
      id: "prop-mgr-002",
      kategori_properti: "Kuliner",
      jenis_properti: "Sewa",
      alamat: "Ruko Pasar Manggarai Blok A No. 7, Jakarta Selatan",
      foto_tampak_depan: PLACEHOLDER_FOTO,
      foto_spanduk: PLACEHOLDER_FOTO,
      lat: -6.2101,
      lng: 106.8498,
    },
  ],

  st_sudirman: [
    {
      id: "prop-sdr-001",
      kategori_properti: "Kuliner",
      jenis_properti: "Sewa",
      alamat: "Plaza Semanggi Lt. 2 No. 34, Jl. Gatot Subroto, Jakarta",
      foto_tampak_depan: PLACEHOLDER_FOTO,
      foto_spanduk: null,
      lat: -6.2026,
      lng: 106.8239,
    },
    {
      id: "prop-sdr-002",
      kategori_properti: "Jasa",
      jenis_properti: "Sewa",
      alamat: "Wisma GKBI Lt. 1, Jl. Jend. Sudirman No. 28, Jakarta",
      foto_tampak_depan: null,
      foto_spanduk: null,
      lat: -6.2019,
      lng: 106.8235,
    },
  ],

  // st_karet: is_rankable=false → /api/properties tidak dipanggil untuk kawasan ini.
  // Tapi kalau dipanggil, tetap kembalikan array kosong.
  st_karet: [],
};
