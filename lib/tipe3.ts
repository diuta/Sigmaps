import { supabaseServer } from '@/lib/supabase/server'

// Sumber tunggal daftar TIPE_3 — dibaca dari view `tipe3_values` (supabase/views.sql:
// `select distinct tipe_3 from katalog_restoran order by tipe_3`), BUKAN diketik manual
// (context/context-mvp.md §6.8b). "SEMUA" ditambahkan di pemanggil, bukan di sini, karena
// bukan nilai asli tabel.

type Cache = { values: string[]; expiresAt: number }
let cache: Cache | null = null

// katalog_restoran adalah sensus statis (dikumpulkan Q4 2023, tidak bertambah lagi — lihat
// context/dokumentasi-erd-mvp.md bagian 4), jadi TTL longgar aman dipakai cuma untuk
// menghindari query berulang tiap request, bukan untuk kejar kesegaran data.
const CACHE_TTL_MS = 10 * 60 * 1000

export async function getTipe3Values(): Promise<string[]> {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.values
  }

  const { data, error } = await supabaseServer.from('tipe3_values').select('tipe_3').order('tipe_3')

  if (error) {
    throw new Error(`Gagal mengambil TIPE_3_VALUES dari Supabase: ${error.message}`)
  }

  const values = (data ?? []).map((row) => row.tipe_3 as string)
  cache = { values, expiresAt: Date.now() + CACHE_TTL_MS }
  return values
}
