// Deterministic technical-setup engine. Given real candles and a real
// current price, computes a BUY/SELL/NO_SETUP call with an entry, stop
// loss, and take profit — every number here comes from arithmetic on real
// data, never from an LLM guessing a plausible-looking price. This is
// technical analysis, not investment advice: results can be wrong, and
// nothing here should be read as a personalized recommendation.
//
// Method (kept deliberately simple and explainable):
//  - Trend: 20-period EMA vs 50-period EMA on closes.
//  - Structure: the recent swing high/low over a lookback window.
//  - Volatility: Wilder's ATR(14) on true range.
//  - Stop: whichever is further from entry — the structure level (just
//    beyond the recent swing, so normal noise doesn't clip it) or a
//    1.5x-ATR volatility buffer. Using the wider of the two avoids a stop
//    so tight it's likely to be hit by noise rather than a real reversal.
//  - Target: a fixed reward:risk multiple of the resulting stop distance.
//  - No setup: if the trend is flat/choppy (EMAs too close together
//    relative to ATR), this returns NO_SETUP rather than forcing a call.

import type { Candle } from "../market-data/types";

export type TradeSide = "BUY" | "SELL" | "NO_SETUP";
export type TrendReading = "uptrend" | "downtrend" | "choppy";

export interface TradeSetup {
  side: TradeSide;
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  trend: TrendReading;
  basis: string;
  atr: number | null;
}

const REWARD_RISK_RATIO = 2; // fixed 1:2 risk:reward for the target
const ATR_PERIOD = 14;
const EMA_FAST = 20;
const EMA_SLOW = 50;
const SWING_LOOKBACK = 30;
const ATR_STOP_MULTIPLE = 1.5;
// EMA separation smaller than this fraction of ATR counts as "no clear trend".
const CHOPPY_THRESHOLD_ATR_FRACTION = 0.3;

function ema(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values[0];
  for (let i = 0; i < values.length; i++) {
    prev = i === 0 ? values[0] : values[i] * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

function atr(candles: Candle[], period: number): number[] {
  const trueRanges: number[] = candles.map((c, i) => {
    if (i === 0) return c.high - c.low;
    const prevClose = candles[i - 1].close;
    return Math.max(c.high - c.low, Math.abs(c.high - prevClose), Math.abs(c.low - prevClose));
  });
  // Wilder's smoothing.
  const out: number[] = [];
  let prev = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = 0; i < trueRanges.length; i++) {
    if (i < period) {
      out.push(NaN);
      continue;
    }
    prev = i === period ? prev : (prev * (period - 1) + trueRanges[i]) / period;
    out.push(prev);
  }
  return out;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Computes a trade setup from real OHLC candles (oldest-first) and a real
 * current price. Candles should have at least ~60 bars for EMA50 + ATR14
 * to be meaningful; fewer than that degrades to NO_SETUP.
 */
export function computeTradeSetup(candles: Candle[], currentPrice: number): TradeSetup {
  if (candles.length < EMA_SLOW + 5) {
    return {
      side: "NO_SETUP",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
      trend: "choppy",
      basis: `Not enough history for a reliable read (${candles.length} candles, need at least ${EMA_SLOW + 5}).`,
      atr: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const emaFast = ema(closes, EMA_FAST);
  const emaSlow = ema(closes, EMA_SLOW);
  const atrSeries = atr(candles, ATR_PERIOD);

  const lastFast = emaFast[emaFast.length - 1];
  const lastSlow = emaSlow[emaSlow.length - 1];
  const lastAtr = atrSeries[atrSeries.length - 1];

  if (!Number.isFinite(lastAtr) || lastAtr <= 0) {
    return {
      side: "NO_SETUP",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
      trend: "choppy",
      basis: "Couldn't compute a usable volatility (ATR) reading from the available candles.",
      atr: null,
    };
  }

  const emaGap = lastFast - lastSlow;
  const isChoppy = Math.abs(emaGap) < lastAtr * CHOPPY_THRESHOLD_ATR_FRACTION;
  const trend: TrendReading = isChoppy ? "choppy" : emaGap > 0 ? "uptrend" : "downtrend";

  const lookback = candles.slice(-SWING_LOOKBACK);
  const swingHigh = Math.max(...lookback.map((c) => c.high));
  const swingLow = Math.min(...lookback.map((c) => c.low));

  if (trend === "choppy") {
    return {
      side: "NO_SETUP",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
      trend,
      basis: `EMA${EMA_FAST}/EMA${EMA_SLOW} are too close together relative to current volatility (ATR ${round2(
        lastAtr
      )}) — no clean trend to trade. Recent range: ${round2(swingLow)}–${round2(swingHigh)}.`,
      atr: round2(lastAtr),
    };
  }

  const entry = currentPrice;

  if (trend === "uptrend") {
    const structureStop = swingLow - lastAtr * 0.1;
    const volStop = entry - lastAtr * ATR_STOP_MULTIPLE;
    const stopLoss = Math.min(structureStop, volStop);
    if (stopLoss >= entry) {
      return {
        side: "NO_SETUP",
        entry: null,
        stopLoss: null,
        takeProfit: null,
        riskRewardRatio: null,
        trend,
        basis: "Uptrend detected, but the current price is already below the computed stop level — setup isn't clean right now.",
        atr: round2(lastAtr),
      };
    }
    const riskDistance = entry - stopLoss;
    const takeProfit = entry + riskDistance * REWARD_RISK_RATIO;
    return {
      side: "BUY",
      entry: round2(entry),
      stopLoss: round2(stopLoss),
      takeProfit: round2(takeProfit),
      riskRewardRatio: REWARD_RISK_RATIO,
      trend,
      basis: `Uptrend (EMA${EMA_FAST} above EMA${EMA_SLOW}). Stop placed below the recent swing low (${round2(
        swingLow
      )}) with a ${ATR_STOP_MULTIPLE}×ATR volatility buffer. Target set at a fixed ${REWARD_RISK_RATIO}:1 reward:risk.`,
      atr: round2(lastAtr),
    };
  }

  // downtrend
  const structureStop = swingHigh + lastAtr * 0.1;
  const volStop = entry + lastAtr * ATR_STOP_MULTIPLE;
  const stopLoss = Math.max(structureStop, volStop);
  if (stopLoss <= entry) {
    return {
      side: "NO_SETUP",
      entry: null,
      stopLoss: null,
      takeProfit: null,
      riskRewardRatio: null,
      trend,
      basis: "Downtrend detected, but the current price is already above the computed stop level — setup isn't clean right now.",
      atr: round2(lastAtr),
    };
  }
  const riskDistance = stopLoss - entry;
  const takeProfit = entry - riskDistance * REWARD_RISK_RATIO;
  return {
    side: "SELL",
    entry: round2(entry),
    stopLoss: round2(stopLoss),
    takeProfit: round2(takeProfit),
    riskRewardRatio: REWARD_RISK_RATIO,
    trend,
    basis: `Downtrend (EMA${EMA_FAST} below EMA${EMA_SLOW}). Stop placed above the recent swing high (${round2(
      swingHigh
    )}) with a ${ATR_STOP_MULTIPLE}×ATR volatility buffer. Target set at a fixed ${REWARD_RISK_RATIO}:1 reward:risk.`,
    atr: round2(lastAtr),
  };
}
