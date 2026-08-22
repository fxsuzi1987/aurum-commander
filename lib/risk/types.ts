// Risk manager configuration. Phase 1 ships sane, conservative defaults and
// the config shape only — enforcement against live/paper trades is a later
// phase. No auto lot-size scaling is enabled by default, per the spec.

export interface RiskConfig {
  startingLotSize: number;
  maxLotSize: number;
  riskPerTradePct: number;
  maxSimultaneousPositions: number;
  maxTradesPerSession: number;
  dailyLossLimitPct: number;
  dailyProfitTargetPct: number;
  maxDrawdownPct: number;
  maxSpread: number;
  maxSlippage: number;
  cooldownAfterLossesMinutes: number;
  autoLotScalingEnabled: boolean; // disabled by default, must be explicitly turned on
}

export const DEFAULT_RISK_CONFIG: RiskConfig = {
  startingLotSize: 0.01,
  maxLotSize: 0.1,
  riskPerTradePct: 1,
  maxSimultaneousPositions: 1,
  maxTradesPerSession: 5,
  dailyLossLimitPct: 3,
  dailyProfitTargetPct: 5,
  maxDrawdownPct: 10,
  maxSpread: 0.5,
  maxSlippage: 0.3,
  cooldownAfterLossesMinutes: 30,
  autoLotScalingEnabled: false,
};

export type TradingMode = "demo" | "paper" | "live";

// Live trading must never be the default and must never be reached by a
// silent switch from demo/paper — this constant exists so every reader of
// the code sees the default called out explicitly, not just left implicit.
export const DEFAULT_TRADING_MODE: TradingMode = "demo";
