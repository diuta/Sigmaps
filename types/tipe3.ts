/**
 * types/tipe3.ts
 * Kategori kuliner (TIPE_3) — dipakai lintas fitur (prompt-request DAN score),
 * jadi sengaja tidak ditaruh di salah satu folder fitur (types/prompt-request/
 * atau types/scoring/) supaya tidak terkesan "milik" satu fitur saja.
 *
 * ⚠️ Nilainya HANYA diketahui saat runtime dari getTipe3Values() (lib/tipe3),
 * yang membaca view `tipe3_values` di Supabase — BUKAN daftar tetap yang diketik
 * manual di sini. Makanya ini `string`, bukan union literal seperti sebelumnya
 * (lihat riwayat bug: sempat salah jadi `""` lalu sempat berupa union hardcode
 * 6 kategori yang sudah basi begitu kategori baru masuk ke Supabase).
 */
export type Tipe3 = string;
