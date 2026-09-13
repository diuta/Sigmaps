import { NextResponse } from 'next/server'
import { PromptRequestSchema } from '@/lib/schemas/prompt-request'
import { getTipe3Values } from '@/lib/tipe3'
import {
  parseIntent,
  NonCulinaryError,
  IntentValidationError,
  GeminiUnavailableError,
} from '@/lib/ai/parseIntent'

// Titik sentuh AI #3 — kalimat bebas -> parameter terstruktur (§2 Langkah 2, §6.6).
// AI hanya menyiapkan masukan; skor tetap deterministik di lib/scoring.
export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body bukan JSON yang valid' }, { status: 400 })
  }

  const parsed = PromptRequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
  }

  let tipe3Values: string[]
  try {
    tipe3Values = await getTipe3Values()
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil daftar kategori usaha' }, { status: 503 })
  }

  try {
    return NextResponse.json({ data: await parseIntent(parsed.data.teks, tipe3Values) })
  } catch (error) {
    // Tiga kelas galat WAJIB dibedakan instanceof — kode statusnya berbeda dan UI
    // menanganinya berbeda (§6.8b).
    if (error instanceof NonCulinaryError) {
      return NextResponse.json({ error: 'Hanya usaha kuliner yang didukung' }, { status: 400 })
    }
    if (error instanceof IntentValidationError) {
      return NextResponse.json({ error: 'Permintaan tidak dapat ditafsirkan' }, { status: 422 })
    }
    if (error instanceof GeminiUnavailableError) {
      return NextResponse.json(
        { error: 'Layanan AI sedang penuh, gunakan filter manual' },
        { status: 503 }
      )
    }
    console.error(error)
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
