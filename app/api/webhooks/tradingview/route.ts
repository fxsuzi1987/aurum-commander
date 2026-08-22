import { NextResponse } from "next/server";
import { saveTradingViewSignal, loadTradingViewSignal, type TradingViewSignal } from "@/lib/store";

// Receives alerts from a TradingView Pine Script strategy/indicator the
// user builds themselves (TradingView webhooks require a paid TradingView
// plan — Essential or higher — this app doesn't do anything to enable
// that). TradingView can't send custom headers on most plans, so auth is
// a shared secret in the URL query string instead.
//
// Point the TradingView alert's "Webhook URL" at:
//   https://<your-app>.vercel.app/api/webhooks/tradingview?secret=<TRADINGVIEW_WEBHOOK_SECRET>
//
// and set the alert's "Message" to JSON, e.g.:
//   {"symbol": "{{ticker}}", "side": "{{strategy.order.action}}", "price": {{close}},
//    "sl": <your stop level>, "tp": <your target level>, "message": "{{strategy.order.comment}}"}
//
// Aurum never computes or edits these numbers — this is the user's own
// TradingView strategy talking, stored and shown exactly as received.
export const dynamic = "force-dynamic";

function numOrNull(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return null;
}

function strOrNull(v: unknown): string | null {
  return typeof v === "string" && v.trim() !== "" ? v : null;
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");
  const expected = process.env.TRADINGVIEW_WEBHOOK_SECRET;

  if (!expected) {
    return NextResponse.json({ error: "TRADINGVIEW_WEBHOOK_SECRET isn't configured on this app yet." }, { status: 503 });
  }
  if (!secret || secret !== expected) {
    return NextResponse.json({ error: "Invalid or missing secret." }, { status: 401 });
  }

  const bodyText = await req.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = JSON.parse(bodyText);
  } catch {
    parsed = null;
  }

  const signal: TradingViewSignal = {
    symbol: (strOrNull(parsed?.symbol) ?? "UNKNOWN").toUpperCase(),
    side: (strOrNull(parsed?.side) ?? strOrNull(parsed?.action) ?? "UNKNOWN").toUpperCase(),
    price: numOrNull(parsed?.price),
    stopLoss: numOrNull(parsed?.sl ?? parsed?.stopLoss),
    takeProfit: numOrNull(parsed?.tp ?? parsed?.takeProfit),
    message: strOrNull(parsed?.message) ?? (parsed ? null : bodyText.slice(0, 500)),
    receivedAt: new Date().toISOString(),
  };

  await saveTradingViewSignal(signal);

  return NextResponse.json({ ok: true, stored: signal });
}

/** Dashboard-facing read of the latest stored signal for a symbol — no
 * secret required to read (only to write), same as every other GET route
 * in this app. */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const symbol = (searchParams.get("symbol") ?? "XAUUSD").toUpperCase();
  const signal = await loadTradingViewSignal(symbol);
  return NextResponse.json(
    { symbol, configured: Boolean(process.env.TRADINGVIEW_WEBHOOK_SECRET), signal },
    { headers: { "Cache-Control": "no-store" } }
  );
}
