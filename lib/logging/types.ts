// AI decision log + audit trail types. The dashboard's "AI Decision Log"
// (spec section 16) renders these — every automated decision should be
// explainable after the fact. Phase 1 defines the shape; the strategy
// engine phases populate it with real reasoning instead of demo entries.

export interface DecisionLogEntry {
  id: string;
  symbol: string;
  timeframe: string;
  t: string; // ISO
  factors: Record<string, string>; // e.g. { "4H Bias": "Bullish", "Breakout": "Confirmed" }
  decision: "long_setup_valid" | "short_setup_valid" | "trade_rejected" | "no_action";
  confidencePct: number | null;
  rejectionReason: string | null;
}

export interface AuditLogEntry {
  id: string;
  t: string; // ISO
  actor: "system" | "user";
  action: string;
  detail: string;
}
