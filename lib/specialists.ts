// Specialists Aurum can call. Right now there's exactly one — the Obsidian
// Desk gold paper-trading pipeline — reached over plain HTTP the same way
// the browser dashboard reads it: GET /api/state on the deployed desk.
// Everything else in the blueprint's 74-agent roster is not built yet;
// adding a new specialist means adding one function here plus one tool
// entry in lib/aurum.ts, per the blueprint's "minimum agents needed,
// fixed jobs" principle.

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
