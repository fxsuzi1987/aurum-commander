import { NextRequest, NextResponse } from "next/server";
import { runAurumTurn } from "@/lib/aurum";
import { hasAnthropicKey } from "@/lib/llm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!hasAnthropicKey()) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set — Aurum can't think yet. Add it in your host's environment variables." },
      { status: 200 }
    );
  }
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Empty message." }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: "That message is too long — keep it under 4000 characters." }, { status: 400 });
  }

  try {
    const result = await runAurumTurn(message);
    return NextResponse.json({ reply: result.reply, toolsUsed: result.toolsUsed, remembered: result.rememberedNote });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Aurum hit an error: ${msg}` }, { status: 200 });
  }
}
