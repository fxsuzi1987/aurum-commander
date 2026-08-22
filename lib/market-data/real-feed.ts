// Real market data via Twelve Data's free API (https://twelvedata.com).
// Every function here returns null — never a fabricated number — if
// TWELVE_DATA_API_KEY isn't set or the request fails. Callers must show
// "not connected" / the specific error, never silently fall back to demo
// data dressed up as real.
//
// Indices (S&P 500, NASDAQ, Dow) use their most liquid tracking ETF —
// SPY / QQQ / DIA — because raw index tickers need a paid Twelve Data
// tier. These are real, live-traded prices, just the ETF's price, not the
// index's own value, and every label built from TICKERS below says "via
// SPY" etc. so that distinction stays visible in the UI.

import type { Candle } from "./types";

const BASE = "https://api.twelvedata.com";

export type RealSymbol = "XAUUSD" | "SPX" | "IXIC" | "DJI";

const TICKERS: Record<RealSymbol, { ticker: string; label: string }> = {
  XAUUSD: { ticker: "XAU/USD", label: "Gold / XAUUSD" },
  SPX: { ticker: "SPY", label: "S&P 500 (via SPY)" },
  IXIC: { ticker: "QQQ", label: "NASDAQ-100 (via QQQ)" },
  DJI: { ticker: "DIA", label: "Dow Jones (via DIA)" },
};

export function hasRealMarketData(): boolean {
  return Boolean(process.env.TWELVE_DATA_API_KEY);
}

export function realSymbolLabel(symbol: RealSymbol): string {
  return TICKERS[symbol].label;
}

interface RealFetchResult<T> {
  ok: boolean;
  data: T | null;
  error: string | null;
}

export async function fetchRealQuote(symbol: RealSymbol): Promise<RealFetchResult<{ price: number; updatedAt: string }>> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return { ok: false, data: null, error: "TWELVE_DATA_API_KEY isn't set." };
  const { ticker } = TICKERS[symbol];
  const url = `${BASE}/price?symbol=${encodeURIComponent(ticker)}&apikey=${key}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data.status === "error") {
      return { ok: false, data: null, error: data?.message ?? `Twelve Data returned HTTP ${res.status}.` };
    }
    const price = Number(data.price);
    if (!Number.isFinite(price)) return { ok: false, data: null, error: "Twelve Data returned no usable price." };
    return { ok: true, data: { price, updatedAt: new Date().toISOString() }, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : String(err) };
  }
}

export async function fetchRealCandles(
  symbol: RealSymbol,
  interval: "1h" | "4h" | "1day" = "1h",
  outputsize = 120
): Promise<RealFetchResult<Candle[]>> {
  const key = process.env.TWELVE_DATA_API_KEY;
  if (!key) return { ok: false, data: null, error: "TWELVE_DATA_API_KEY isn't set." };
  const { ticker } = TICKERS[symbol];
  const url = `${BASE}/time_series?symbol=${encodeURIComponent(ticker)}&interval=${interval}&outputsize=${outputsize}&apikey=${key}`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    if (!res.ok || data.status === "error" || !Array.isArray(data.values)) {
      return { ok: false, data: null, error: data?.message ?? `Twelve Data returned HTTP ${res.status}.` };
    }
    const candles: Candle[] = data.values
      .map((v: { datetime: string; open: string; high: string; low: string; close: string }) => ({
        time: Math.floor(new Date(v.datetime).getTime() / 1000),
        open: Number(v.open),
        high: Number(v.high),
        low: Number(v.low),
        close: Number(v.close),
      }))
      .filter((c: Candle) => Number.isFinite(c.open) && Number.isFinite(c.high) && Number.isFinite(c.low) && Number.isFinite(c.close))
      .reverse(); // Twelve Data returns newest-first; the setup engine and chart both want oldest-first
    if (candles.length < 20) {
      return { ok: false, data: null, error: `Only got ${candles.length} candles back — too few for a reliable technical read.` };
    }
    return { ok: true, data: candles, error: null };
  } catch (err) {
    return { ok: false, data: null, error: err instanceof Error ? err.message : String(err) };
  }
}
