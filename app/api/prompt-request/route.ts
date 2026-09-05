import { NextResponse } from 'next/server'
import { parseIntent } from '@/lib/ai/parseIntent'
import { PromptRequestSchema } from '@/lib/schemas/prompt-request'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = PromptRequestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Input tidak valid' }, { status: 400 })
  }

  try {
    const intent = await parseIntent(parsed.data.prompt)
    return NextResponse.json({ data: intent })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Gagal memproses permintaan' }, { status: 500 })
  }
}
