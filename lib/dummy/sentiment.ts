/**
 * lib/dummy/sentiment.ts
 * 🟡 FASE DUMMY — hapus file ini saat /api/community-sentiment siap.
 *
 * CommunitySentimentResponse per station_id.
 * Shape identik dengan types/api.ts CommunitySentimentResponse.
 *
 * Teks ringkasan ditulis sebagai jika sudah diproses Gemini:
 * - Tanpa nama user, profil, atau foto personal (sudah di-strip)
 * - Berdasarkan tema laporan Community Activity (kebersihan, parkir, keramaian, dll)
 * - Nada netral-positif, tidak berlebihan
 */

import type { CommunitySentimentResponse } from "@/types/api";

export const DUMMY_SENTIMENT: Record<string, CommunitySentimentResponse> = {
  st_bni_city: {
    ringkasan:
      "Kawasan BNI City mendapat respons positif dari komunitas sekitar. " +
      "Mayoritas laporan menyoroti tingginya lalu lintas pejalan kaki " +
      "pada jam makan siang (11.00–13.00) dan sore hari (17.00–19.00). " +
      "Beberapa laporan menyebut kurangnya pilihan warung makan terjangkau " +
      "di sekitar gedung perkantoran, yang menjadi peluang bagi pelaku usaha kuliner. " +
      "Tidak ada keluhan signifikan terkait keamanan atau kebersihan area.",
    n_laporan: 18,
  },

  st_manggarai: {
    ringkasan:
      "Area sekitar Stasiun Manggarai dikenal sebagai titik transit yang sibuk. " +
      "Laporan komunitas banyak menyebut kepadatan penumpang yang konsisten " +
      "sepanjang hari kerja, dengan puncak pagi (06.00–08.30) dan sore (16.30–19.00). " +
      "Terdapat beberapa laporan tentang kondisi trotoar yang perlu perbaikan, " +
      "namun kegiatan jual-beli di sekitar stasiun dinilai aktif. " +
      "Potensi usaha kuliner cepat saji atau minuman dinilai baik oleh warga.",
    n_laporan: 24,
  },

  st_sudirman: {
    ringkasan:
      "Kawasan Sudirman memiliki komunitas pekerja kantoran yang dominan. " +
      "Laporan menunjukkan tingginya permintaan tempat makan yang bersih dan nyaman " +
      "dengan rentang harga menengah ke atas (di atas Rp40.000/porsi). " +
      "Persaingan usaha kuliner di area ini disebut cukup ketat oleh beberapa laporan, " +
      "terutama di jam makan siang. Namun volume pembeli yang besar " +
      "tetap memberikan ruang bagi pendatang baru yang menawarkan konsep berbeda.",
    n_laporan: 31,
  },

  // st_karet: is_rankable=false → sentiment tidak diminta. Tapi tetap sediakan fallback.
  st_karet: {
    ringkasan:
      "Data komunitas untuk kawasan Karet belum cukup untuk menghasilkan ringkasan yang representatif.",
    n_laporan: 2,
  },
};
