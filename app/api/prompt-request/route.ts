import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'

export async function POST(request: Request) {
  const body = await request.json() // belom diimplement zod schema, jadi masih raw json string. todo: buat schema di lib/schema

  try {
    const { text } = await generateText({
      model: geminiFlashLite,
      prompt: body.text
    })

    return NextResponse.json({ data: { text } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
