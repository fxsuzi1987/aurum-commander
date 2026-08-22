// Market-structure / strategy-engine types. Phase 1 defines the shape only
// — the actual break-and-retest, range, and multi-timeframe detection logic
// (spec phases 3-5) isn't implemented yet. Anything using these types today
// should treat values as DEMO placeholders, not computed signals, until
// those phases land.

export type TrendState = "strong_bullish" | "bullish" | "range" | "bearish" | "strong_bearish";
export type MarketRegime = "trend" | "range" | "transition" | "high_volatility";
export type AgentStatus = "active" | "standby" | "blocked";

export interface MarketStructureSnapshot {
  symbol: string;
  trend: TrendState;
  regime: MarketRegime;
  momentum: number | null; // -1..1, null until the momentum engine exists
  volatility: number | null; // null until the volatility engine exists
  nearestSupport: number | null;
  nearestResistance: number | null;
  updatedAt: string;
}

export interface TradingAgentState {
  id: "market-structure" | "trend-engine" | "risk-manager" | "trade-executor" | "news-watch" | "position-manager";
  label: string;
  status: AgentStatus;
  detail: string;
}
