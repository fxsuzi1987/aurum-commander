import { NextResponse } from "next/server";
import { fetchRealCandles, fetchRealQuote, hasRealMarketData, realSymbolLabel, type RealSymbol } from "@/lib/market-data/real-feed";
import { fetchGoldDeskSummary } from "@/lib/specialists";
import { computeTradeSetup } from "@/lib/strategy/setup-engine";

// Real buy/sell/SL/TP setups — see lib/strategy/setup-engine.ts for the
// method. Everything here is either real live data or an explicit "not
// connected" / error state; nothing is ever demo-fabricated, because a
// fake number here could get mistaken for a real trade signal.
export const dynamic = "force-dynamic";

const VALID_SYMBOLS: RealSymbol[] = ["XAUUSD", "SPX", "IXIC", "DJI"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbolParam = searchParams.get("symbol") ?? "XAUUSD";
  const symbol = (VALID_SYMBOLS as string[]).includes(symbolParam) ? (symbolParam as RealSymbol) : "XAUUSD";
  const displayName = realSymbolLabel(symbol);

  if (!hasRealMarketData()) {
    return NextResponse.json(
      {
        symbol,
        displayName,
        connected: false,
        error: "Real market data isn't connected. Add TWELVE_DATA_API_KEY (free at twelvedata.com) to your environment variables to turn this on.",
        setup: null,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const candlesResult = await fetchRealCandles(symbol, "1h", 120);
  if (!candlesResult.ok || !candlesResult.data) {
    return NextResponse.json(
      { symbol, displayName, connected: true, error: candlesResult.error ?? "Couldn't fetch real candles.", setup: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  // Gold uses the existing live gold-desk price (already shown elsewhere on
  // the dashboard as the LIVE number) so there's one consistent real price
  // for XAUUSD across the whole app, not two slightly different "real"
  // quotes. Everything else uses Twelve Data's own quote.
  let currentPrice: number | null = null;
  let priceError: string | null = null;
  if (symbol === "XAUUSD") {
    const goldSummary = await fetchGoldDeskSummary();
    currentPrice = goldSummary.gold?.price ?? null;
    if (currentPrice === null) priceError = goldSummary.error ?? "Gold desk has no current price.";
  } else {
    const quoteResult = await fetchRealQuote(symbol);
    currentPrice = quoteResult.data?.price ?? null;
    if (!quoteResult.ok) priceError = quoteResult.error;
  }

  if (currentPrice === null) {
    return NextResponse.json(
      { symbol, displayName, connected: true, error: priceError ?? "No current price available.", setup: null },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const setup = computeTradeSetup(candlesResult.data, currentPrice);

  return NextResponse.json(
    { symbol, displayName, connected: true, error: null, currentPrice, setup, generatedAt: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } }
  );
}
