import { NextResponse } from "next/server";
import {
  parseIntent,
  NonCulinaryError,
  IntentValidationError,
  GeminiUnavailableError,
} from "@/lib/ai/parseIntent";
import { PromptRequestSchema } from "@/lib/schemas/prompt-request";
import { getTipe3Values } from "@/lib/tipe3";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = PromptRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Input tidak valid" }, { status: 400 });
  }

  let tipe3Values: string[];
  try {
    tipe3Values = await getTipe3Values();
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar kategori usaha" },
      { status: 503 },
    );
  }

  try {
    const intent = await parseIntent(parsed.data.prompt, tipe3Values);
    return NextResponse.json({ data: intent });
  } catch (error) {
    if (error instanceof NonCulinaryError) {
      return NextResponse.json(
        { error: "Usaha yang disebut bukan usaha kuliner" },
        { status: 400 },
      );
    }
    if (error instanceof IntentValidationError) {
      console.error(error);
      return NextResponse.json(
        { error: "Gagal memahami hasil AI, coba ulangi dengan kalimat lain" },
        { status: 422 },
      );
    }
    if (error instanceof GeminiUnavailableError) {
      console.error(error);
      return NextResponse.json(
        { error: "Layanan AI sedang tidak tersedia, coba lagi nanti" },
        { status: 503 },
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "Gagal memproses permintaan" },
      { status: 500 },
    );
  }
}
