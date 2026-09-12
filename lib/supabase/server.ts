import { createClient } from '@supabase/supabase-js'

if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL belum diset di environment variable')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY belum diset di environment variable')
}

// Satu-satunya titik pembuatan client Supabase sisi server (CLAUDE.md #5) — pakai service
// role key, melewati RLS. Jangan buat createClient() baru di file lain.
export const supabaseServer = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})
