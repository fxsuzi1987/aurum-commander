import { NextResponse } from "next/server";
import { loadHistory, usingPersistentStore } from "@/lib/store";
import { hasAnthropicKey } from "@/lib/llm";
import { hasGoldDeskUrl, hasRealTradeSetupData } from "@/lib/specialists";
import { HISTORY_WINDOW } from "@/lib/config";

export const dynamic = "force-dynamic";

export async function GET() {
  const [history, persistent] = await Promise.all([loadHistory(HISTORY_WINDOW), usingPersistentStore()]);
  return NextResponse.json({
    history,
    env: {
      hasAnthropicKey: hasAnthropicKey(),
      hasGoldDeskUrl: hasGoldDeskUrl(),
      persistentStore: persistent,
      hasRealMarketData: hasRealTradeSetupData(),
      webhookConfigured: Boolean(process.env.TRADINGVIEW_WEBHOOK_SECRET),
    },
  });
}
