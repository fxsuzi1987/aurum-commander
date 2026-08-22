export type MarketCategory = "indices" | "commodities" | "forex" | "crypto";

export interface InstrumentQuote {
  symbol: string;
  displayName: string;
  category: MarketCategory;
  price: number;
  change: number;
  changePct: number;
  sparkline: number[]; // recent relative price points, oldest first
  /** true = real live feed (gold desk only, for now); false = simulated. */
  isLive: boolean;
}

export interface Candle {
  time: number; // unix seconds, required by lightweight-charts
  open: number;
  high: number;
  low: number;
  close: number;
}

export type Timeframe = "1m" | "5m" | "15m" | "1h" | "4h" | "1d";
