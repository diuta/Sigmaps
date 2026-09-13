import { supabaseServer } from '@/lib/supabase/server'

type Cache = { values: string[]; expiresAt: number }
let cache: Cache | null = null

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
