// Specialists Aurum can call. Right now there's exactly one — the Obsidian
// Desk gold paper-trading pipeline — reached over plain HTTP the same way
// the browser dashboard reads it: GET /api/state on the deployed desk.
// Everything else in the blueprint's 74-agent roster is not built yet;
// adding a new specialist means adding one function here plus one tool
// entry in lib/aurum.ts, per the blueprint's "minimum agents needed,
// fixed jobs" principle.

import type { GoldDeskSummary } from "./types";

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
