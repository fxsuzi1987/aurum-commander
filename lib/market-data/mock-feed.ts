import type { Candle, InstrumentQuote, MarketCategory, Timeframe } from "./types";

// Simulated instruments only — this app has exactly one real feed (gold,
// via lib/specialists.ts / the Obsidian Desk pipeline). Everything here is
// isLive: false and must render with a visible DEMO DATA label wherever
// it's shown, per the honesty rule: never let simulated data look real.
const INSTRUMENTS: { symbol: string; displayName: string; category: MarketCategory; base: number }[] = [
  { symbol: "S&P500", displayName: "S&P 500", category: "indices", base: 6400 },
  { symbol: "NASDAQ", displayName: "NASDAQ", category: "indices", base: 22500 },
  { symbol: "DOWJONES", displayName: "Dow Jones", category: "indices", base: 43500 },
  { symbol: "BTCUSD", displayName: "BTC/USD", category: "crypto", base: 96000 },
];

function seededWalk(base: number, points: number, volatilityPct: number, seed: number): number[] {
  let v = base;
  const out: number[] = [];
  let s = seed;
  const rand = () => {
    // Simple deterministic PRNG (mulberry32) so sparklines don't jump on
    // every render/poll — seeded by symbol so each instrument is stable
    // within a request.
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < points; i++) {
    v = v * (1 + (rand() - 0.5) * volatilityPct);
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

function hashSeed(symbol: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < symbol.length; i++) h = (h * 31 + symbol.charCodeAt(i)) | 0;
  return h;
}

/** Demo quotes for the Live Markets panel, minus gold (that's the real feed). */
export function getMockQuotes(nowMs: number): InstrumentQuote[] {
  // nowMs buckets the walk into ~1-minute steps so the sparkline updates
  // visibly on poll but stays stable within a single render.
  const bucket = Math.floor(nowMs / 60000);
  return INSTRUMENTS.map((inst) => {
    const walk = seededWalk(inst.base, 24, 0.004, hashSeed(inst.symbol, bucket));
    const first = walk[0];
    const last = walk[walk.length - 1];
    const change = Math.round((last - first) * 100) / 100;
    return {
      symbol: inst.symbol,
      displayName: inst.displayName,
      category: inst.category,
      price: last,
      change,
      changePct: Math.round((change / first) * 10000) / 100,
      sparkline: walk,
      isLive: false,
    };
  });
}

/**
 * Demo candlestick series. For gold specifically, callers should pass
 * `anchorPrice` (the real current spot from the gold desk) so the synthetic
 * history at least ends near the real number instead of drifting off to an
 * unrelated hardcoded base — the chart is still fabricated history and must
 * be labeled DEMO wherever it's shown, but it shouldn't visually contradict
 * the real price displayed next to it.
 */
export function getMockCandles(symbol: string, timeframe: Timeframe, count = 120, anchorPrice?: number): Candle[] {
  const inst = INSTRUMENTS.find((i) => i.symbol === symbol);
  const base = anchorPrice ?? inst?.base ?? INSTRUMENTS[0].base;
  const stepSeconds = timeframeToSeconds(timeframe);
  const nowSec = Math.floor(Date.now() / 1000);
  const walk = seededWalk(base, count + 1, 0.003, hashSeed(symbol, stepSeconds));
  const candles: Candle[] = [];
  for (let i = 0; i < count; i++) {
    const open = walk[i];
    const close = walk[i + 1];
    const high = Math.max(open, close) * (1 + Math.random() * 0.0008);
    const low = Math.min(open, close) * (1 - Math.random() * 0.0008);
    candles.push({
      time: nowSec - (count - i) * stepSeconds,
      open: round2(open),
      high: round2(high),
      low: round2(low),
      close: round2(close),
    });
  }
  return candles;
}

function timeframeToSeconds(tf: Timeframe): number {
  const map: Record<Timeframe, number> = { "1m": 60, "5m": 300, "15m": 900, "1h": 3600, "4h": 14400, "1d": 86400 };
  return map[tf];
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
