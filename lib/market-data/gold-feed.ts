import { fetchGoldDeskSummary } from "../specialists";
import type { InstrumentQuote } from "./types";

// The one real feed in this app. Wraps the existing gold-desk pipeline
// (lib/specialists.ts) into the same InstrumentQuote shape the mock feed
// uses, so the Live Markets panel can render real and demo rows side by
// side — distinguished only by the isLive flag, never by faking a feed
// that doesn't exist.
export async function getGoldQuote(): Promise<InstrumentQuote | null> {
  const summary = await fetchGoldDeskSummary();
  if (!summary.connected || !summary.gold) return null;
  return {
    symbol: "XAUUSD",
    displayName: "Gold / XAUUSD",
    category: "commodities",
    price: summary.gold.price,
    change: 0, // the gold desk doesn't report a daily open/change — leave neutral rather than invent one
    changePct: 0,
    sparkline: [summary.gold.price], // no price history endpoint yet; a single point renders as a flat line, not a fabricated trend
    isLive: true,
  };
}
