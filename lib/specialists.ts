// Specialists Aurum can call. Right now there's exactly one — the Obsidian
// Desk gold paper-trading pipeline — reached over plain HTTP the same way
// the browser dashboard reads it: GET /api/state on the deployed desk.
// Everything else in the blueprint's 74-agent roster is not built yet;
// adding a new specialist means adding one function here plus one tool
// entry in lib/aurum.ts, per the blueprint's "minimum agents needed,
// fixed jobs" principle.

import type { GoldDeskSummary } from "./types";
import { fetchRealCandles, fetchRealQuote, hasRealMarketData, realSymbolLabel, type RealSymbol } from "./market-data/real-feed";
import { computeTradeSetup } from "./strategy/setup-engine";

export function hasGoldDeskUrl(): boolean {
  return Boolean(process.env.OBSIDIAN_DESK_URL);
}

export async function checkGoldDeskStatus(): Promise<string> {
  const base = process.env.OBSIDIAN_DESK_URL;
  if (!base) {
    return "The gold desk isn't connected yet — OBSIDIAN_DESK_URL isn't set, so I have no way to reach it.";
  }
  const url = base.replace(/\/$/, "") + "/api/state";
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    return `Couldn't reach the gold desk at ${url}: ${err instanceof Error ? err.message : String(err)}`;
  }
  if (!res.ok) {
    return `Gold desk responded with HTTP ${res.status} — it may be down or misconfigured.`;
  }
  const data = await res.json();
  const state = data.state;
  const portfolio = data.portfolio;
  if (!state) {
    return "The gold desk is reachable but hasn't run a cycle yet, so there's no decision or position to report.";
  }
  const equity = portfolio ? (portfolio.cash + portfolio.realizedPnl).toFixed(2) : "unknown";
  const position = portfolio?.position
    ? `${portfolio.position.side} ${portfolio.position.size.toFixed(3)} oz @ ${portfolio.position.entryPrice.toFixed(2)}`
    : "flat, no open position";
  const judge = state.judge ? `${state.judge.call} (${(state.judge.confidence * 100).toFixed(0)}% confidence)` : "no decision this cycle";
  const gold = state.gold ? `${state.gold.price} ${state.gold.currency} as of ${state.gold.updatedAt}` : "unknown";
  return [
    `Last cycle ran at ${state.ranAt} (${state.cycleId}).`,
    `Gold spot: ${gold}.`,
    `Paper equity: $${equity} (started at $${portfolio?.startingEquity ?? "unknown"}).`,
    `Position: ${position}.`,
    `Latest judge call: ${judge}.`,
    state.error ? `Note: the last cycle reported an error: ${state.error}` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Structured (non-prose) version of the same call, for the dashboard's
 * Trading panels. Pulls real confidence numbers straight off the pipeline's
 * agent list — nothing here is invented or defaulted to a placeholder value.
 * Any field the pipeline didn't produce this cycle comes back null so the UI
 * can render "—" instead of a fabricated number.
 */
export async function fetchGoldDeskSummary(): Promise<GoldDeskSummary> {
  const base = process.env.OBSIDIAN_DESK_URL;
  if (!base) {
    return {
      connected: false,
      error: "OBSIDIAN_DESK_URL isn't set.",
      cycleId: null,
      ranAt: null,
      gold: null,
      confluence: { macro: null, technical: null, news: null, risk: null },
      judge: null,
      portfolio: null,
      cycleError: null,
    };
  }
  const url = base.replace(/\/$/, "") + "/api/state";
  let res: Response;
  try {
    res = await fetch(url, { cache: "no-store" });
  } catch (err) {
    return {
      connected: false,
      error: `Couldn't reach the gold desk: ${err instanceof Error ? err.message : String(err)}`,
      cycleId: null,
      ranAt: null,
      gold: null,
      confluence: { macro: null, technical: null, news: null, risk: null },
      judge: null,
      portfolio: null,
      cycleError: null,
    };
  }
  if (!res.ok) {
    return {
      connected: false,
      error: `Gold desk responded with HTTP ${res.status}.`,
      cycleId: null,
      ranAt: null,
      gold: null,
      confluence: { macro: null, technical: null, news: null, risk: null },
      judge: null,
      portfolio: null,
      cycleError: null,
    };
  }
  const data = await res.json();
  const state = data.state;
  const portfolio = data.portfolio;
  if (!state) {
    return {
      connected: true,
      error: null,
      cycleId: null,
      ranAt: null,
      gold: null,
      confluence: { macro: null, technical: null, news: null, risk: null },
      judge: null,
      portfolio: portfolio
        ? { equity: portfolio.cash + portfolio.realizedPnl, startingEquity: portfolio.startingEquity, position: null }
        : null,
      cycleError: null,
    };
  }
  const agents: Array<{ id: string; confidence: number | null }> = Array.isArray(state.agents) ? state.agents : [];
  const findConfidence = (id: string): number | null => agents.find((a) => a.id === id)?.confidence ?? null;
  return {
    connected: true,
    error: null,
    cycleId: state.cycleId ?? null,
    ranAt: state.ranAt ?? null,
    gold: state.gold
      ? {
          price: state.gold.price,
          currency: state.gold.currency,
          updatedAt: state.gold.updatedAt,
          source: state.gold.source,
        }
      : null,
    confluence: {
      macro: findConfidence("macro"),
      technical: findConfidence("technical"),
      news: findConfidence("news"),
      risk: findConfidence("risk-engine"),
    },
    judge: state.judge
      ? { call: state.judge.call, confidence: state.judge.confidence, reasoning: state.judge.reasoning }
      : null,
    portfolio: portfolio
      ? {
          equity: portfolio.cash + portfolio.realizedPnl,
          startingEquity: portfolio.startingEquity,
          position: portfolio.position
            ? {
                side: portfolio.position.side,
                size: portfolio.position.size,
                entryPrice: portfolio.position.entryPrice,
              }
            : null,
        }
      : null,
    cycleError: state.error ?? null,
  };
}

export function hasRealTradeSetupData(): boolean {
  return hasRealMarketData();
}

const TRADE_SETUP_SYMBOLS: Record<string, RealSymbol> = {
  GOLD: "XAUUSD",
  XAUUSD: "XAUUSD",
  XAU: "XAUUSD",
  "S&P500": "SPX",
  SP500: "SPX",
  SPX: "SPX",
  NASDAQ: "IXIC",
  IXIC: "IXIC",
  DOW: "DJI",
  DOWJONES: "DJI",
  DJI: "DJI",
};

/**
 * Rule-based buy/sell setup with entry/SL/TP for gold or a US index, for
 * the chat agent. Every number comes straight out of computeTradeSetup()
 * on real candles — the LLM only gets to phrase the answer, never invent
 * or adjust a level. Returns a plain-language answer plus an explicit
 * "not connected" / error message when real data isn't available, so the
 * model can never fill the gap with a plausible-sounding guess.
 */
export async function getTradeSetupText(symbolInput: string): Promise<string> {
  const key = symbolInput.trim().toUpperCase().replace(/[\s/]/g, "");
  const symbol = TRADE_SETUP_SYMBOLS[key] ?? "XAUUSD";
  const displayName = realSymbolLabel(symbol);

  if (!hasRealMarketData()) {
    return `Real market data isn't connected yet, so I can't compute a live setup for ${displayName}. Add TWELVE_DATA_API_KEY (free at twelvedata.com) to turn this on.`;
  }

  const candlesResult = await fetchRealCandles(symbol, "1h", 120);
  if (!candlesResult.ok || !candlesResult.data) {
    return `Couldn't get real candles for ${displayName}: ${candlesResult.error ?? "unknown error"}.`;
  }

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
    return `Couldn't get a current price for ${displayName}: ${priceError ?? "unknown error"}.`;
  }

  const setup = computeTradeSetup(candlesResult.data, currentPrice);

  if (setup.side === "NO_SETUP") {
    return `${displayName} at ${currentPrice.toFixed(2)}: no clean setup right now. ${setup.basis} This is technical analysis, not financial advice.`;
  }

  return [
    `${displayName} — ${setup.side} setup at ${currentPrice.toFixed(2)}:`,
    `Entry ${setup.entry}, Stop Loss ${setup.stopLoss}, Take Profit ${setup.takeProfit} (${setup.riskRewardRatio}:1 reward:risk).`,
    setup.basis,
    "This is rule-based technical analysis on real price data, not financial advice — I'm not a licensed advisor and this can be wrong.",
  ].join(" ");
}
