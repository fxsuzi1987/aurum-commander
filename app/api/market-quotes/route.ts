import { NextResponse } from "next/server";
import { getGoldQuote } from "@/lib/market-data/gold-feed";
import { getMockQuotes } from "@/lib/market-data/mock-feed";
import { fetchRealQuotesBatch, hasRealMarketData, realSymbolLabel, type RealQuoteSummary, type RealSymbol } from "@/lib/market-data/real-feed";
import type { InstrumentQuote } from "@/lib/market-data/types";

// Live Markets panel data: gold (always real when the gold desk is
// connected) plus, when TWELVE_DATA_API_KEY is set, real index quotes for
// S&P 500 / NASDAQ / Dow (via their SPY/QQQ/DIA ETFs — see real-feed.ts).
// Forex and crypto have no real feed wired anywhere in this app yet, so
// those stay demo. Any index Twelve Data didn't return falls back to its
// demo row rather than showing a stale or fabricated number — the client
// renders isLive as a visible LIVE/DEMO badge either way.
export const dynamic = "force-dynamic";

const INDEX_SYMBOLS: { real: RealSymbol; mockSymbol: string }[] = [
  { real: "SPX", mockSymbol: "S&P500" },
  { real: "IXIC", mockSymbol: "NASDAQ" },
  { real: "DJI", mockSymbol: "DOWJONES" },
];

export async function GET() {
  const mock = getMockQuotes(Date.now());
  const mockBySymbol = new Map(mock.map((q) => [q.symbol, q]));

  const [gold, realIndices] = await Promise.all([
    getGoldQuote(),
    hasRealMarketData()
      ? fetchRealQuotesBatch(INDEX_SYMBOLS.map((i) => i.real))
      : Promise.resolve({} as Partial<Record<RealSymbol, RealQuoteSummary>>),
  ]);

  const indices: InstrumentQuote[] = INDEX_SYMBOLS.map(({ real, mockSymbol }) => {
    const live = realIndices[real];
    if (live) {
      return {
        symbol: mockSymbol,
        displayName: realSymbolLabel(real),
        category: "indices",
        price: live.price,
        change: live.change,
        changePct: live.changePct,
        sparkline: [live.price], // no history endpoint called here (keeps this to one Twelve Data request) — a single point renders as a flat line, not a fabricated trend
        isLive: true,
      };
    }
    return mockBySymbol.get(mockSymbol)!; // Twelve Data didn't cover this one right now — show the labeled demo row instead
  });

  const crypto = mock.filter((q) => q.category === "crypto");

  const quotes = [...(gold ? [gold] : []), ...indices, ...crypto];
  return NextResponse.json({ quotes }, { headers: { "Cache-Control": "no-store" } });
}
