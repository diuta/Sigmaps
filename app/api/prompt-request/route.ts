import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { geminiFlashLite } from '@/lib/ai/gemini'
import { PromptRequestSchema } from '@/lib/schemas/prompt-request'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = PromptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
  }

  try {
    const { text } = await generateText({
      model: geminiFlashLite,
      prompt: parsed.data.teks,
    })

    return NextResponse.json({ data: { text } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
