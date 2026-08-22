import { NextResponse } from "next/server";
import { getMockCandles } from "@/lib/market-data/mock-feed";
import { fetchGoldDeskSummary } from "@/lib/specialists";
import type { Timeframe } from "@/lib/market-data/types";

// Candlestick series for the Live Trading chart. We have no historical OHLC
// feed for any instrument (the gold desk only exposes current spot), so
// every series here is synthetic. For XAUUSD it's anchored to the real
// current price so it doesn't visually contradict the live number shown
// above the chart; for everything else it's anchored to the mock feed's
// own base. The client must render a DEMO badge on the chart regardless of
// which instrument is selected — none of this is a real price history.
export const dynamic = "force-dynamic";

const VALID_TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol") ?? "XAUUSD";
  const tfParam = searchParams.get("timeframe") ?? "5m";
  const timeframe = (VALID_TIMEFRAMES as string[]).includes(tfParam) ? (tfParam as Timeframe) : "5m";

  let anchorPrice: number | undefined;
  if (symbol === "XAUUSD") {
    const summary = await fetchGoldDeskSummary();
    anchorPrice = summary.gold?.price;
  }

  const candles = getMockCandles(symbol, timeframe, 120, anchorPrice);
  return NextResponse.json(
    { symbol, timeframe, candles, isLive: false },
    { headers: { "Cache-Control": "no-store" } }
  );
}
