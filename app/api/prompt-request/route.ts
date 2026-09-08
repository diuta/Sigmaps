import { NextResponse } from 'next/server'
import { PromptRequestSchema } from '@/lib/schemas/prompt-request'
import { getTipe3Values } from '@/lib/tipe3'
import {
  parseIntent,
  NonCulinaryError,
  IntentValidationError,
  GeminiUnavailableError,
} from '@/lib/ai/parseIntent'

// Titik sentuh AI #3 — mengubah kalimat bebas Business Brief jadi parameter
// terstruktur (context/context-mvp.md §2 Langkah 2, §6.6).
//
// Route ini sengaja tipis (CLAUDE.md bagian 2 aturan 2): validasi -> panggil
// lib/ai/parseIntent -> format respons. Seluruh logika prompt, penanganan galat,
// dan validasi Zod atas keluaran Gemini ada di lib/, bukan di sini.
//
// AI hanya menyiapkan MASUKAN. Skor tetap dihitung deterministik di
// lib/scoring — kalimat yang benar untuk PRD: parameter yang sama selalu
// menghasilkan skor yang sama, bukan "AI tidak pernah dipanggil".
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

  // Daftar TIPE_3 dibaca dari view `tipe3_values`, BUKAN diketik manual. Nilainya
  // harus cocok persis (huruf kapital semua) dengan kunci `competitor_counts`,
  // kalau tidak pencarian pesaing selalu bernilai 0 dan C seragam 0,333 —
  // skornya tetap keluar dan terlihat wajar padahal salah.
  let tipe3Values: string[]
  try {
    tipe3Values = await getTipe3Values()
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal mengambil daftar kategori usaha' }, { status: 503 })
  }

  try {
    const intent = await parseIntent(parsed.data.teks, tipe3Values)
    return NextResponse.json({ data: intent })
  } catch (error) {
    // Tiga kelas galat ini WAJIB dibedakan dengan `instanceof`, bukan ditangkap
    // sebagai Error generik — kode statusnya berbeda dan UI membedakan
    // penanganannya (tabel kode galat, context/context-mvp.md §6.8b).
    if (error instanceof NonCulinaryError) {
      // 'SEMUA' bukan tempat pembuangan: kepadatan restoran tidak mengatakan
      // apa pun tentang peluang laundry atau barbershop (§6.6).
      return NextResponse.json(
        { error: 'Hanya usaha kuliner yang didukung' },
        { status: 400 }
      )
    }
    if (error instanceof IntentValidationError) {
      return NextResponse.json(
        { error: 'Permintaan tidak dapat ditafsirkan' },
        { status: 422 }
      )
    }
    if (error instanceof GeminiUnavailableError) {
      // Kuota Gemini berlaku per project, bukan per kunci — seluruh pengunjung
      // berbagi satu kuota. Peta, /api/stations, dan /api/score tetap jalan
      // tanpa endpoint ini (degradasi anggun).
      return NextResponse.json(
        { error: 'Layanan AI sedang penuh, gunakan filter manual' },
        { status: 503 }
      )
    }

    console.error(error)
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
