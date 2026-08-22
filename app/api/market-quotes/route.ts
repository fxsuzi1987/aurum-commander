import { NextResponse } from "next/server";
import { getGoldQuote } from "@/lib/market-data/gold-feed";
import { getMockQuotes } from "@/lib/market-data/mock-feed";

// Live Markets panel data: one real row (gold, isLive:true) plus the demo
// rows (isLive:false) for indices/crypto we have no real feed for. The
// client is responsible for rendering the isLive flag as a visible badge —
// never presenting demo rows as if they were live.
export const dynamic = "force-dynamic";

export async function GET() {
  const [gold, mock] = await Promise.all([getGoldQuote(), Promise.resolve(getMockQuotes(Date.now()))]);
  const quotes = gold ? [gold, ...mock] : mock;
  return NextResponse.json({ quotes }, { headers: { "Cache-Control": "no-store" } });
}
