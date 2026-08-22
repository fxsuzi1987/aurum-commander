"use client";

import { useEffect, useState } from "react";
import type { Candle, Timeframe } from "@/lib/market-data/types";
import { LiveTradingChart } from "./LiveTradingChart";
import { TradingViewWidget } from "./TradingViewWidget";

const TIMEFRAMES: Timeframe[] = ["1m", "5m", "15m", "1h", "4h", "1d"];
type ChartSource = "demo" | "tradingview";

type GoldPrice = { price: number; currency: string; updatedAt: string; source: string } | null;

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LiveTradingPanel({ gold }: { gold: GoldPrice }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("5m");
  const [candles, setCandles] = useState<Candle[]>([]);
  const [chartSource, setChartSource] = useState<ChartSource>("tradingview");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/candles?symbol=XAUUSD&timeframe=${timeframe}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) setCandles(data.candles ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  const demoHigh = candles.length ? Math.max(...candles.map((c) => c.high)) : null;
  const demoLow = candles.length ? Math.min(...candles.map((c) => c.low)) : null;
  const demoOpen = candles[0]?.open ?? null;

  return (
    <div className="glass-panel glass-panel-blue flex h-full flex-col p-4">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">LIVE TRADING</div>
          <div className="text-[10px] tracking-wider text-[var(--color-ink-500)]">GOLD / XAUUSD</div>
        </div>
        <span className={gold ? "tag-live" : "tag-demo"}>{gold ? "LIVE" : "NO FEED"}</span>
      </div>

      {gold ? (
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-2xl tabular-nums text-[var(--color-ink-100)]">{fmt(gold.price)}</span>
            <span className="text-xs text-[var(--color-ink-500)]">{gold.currency}</span>
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-[var(--color-ink-500)]">
            {gold.source} · {new Date(gold.updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      ) : (
        <div className="mb-3 text-xs text-[var(--color-ink-500)]">Gold desk isn&rsquo;t connected — no live price to show.</div>
      )}

      <div className="mb-2 flex items-center justify-between">
        <div className="flex gap-1 text-[11px] font-mono tracking-wide">
          <button
            onClick={() => setChartSource("tradingview")}
            className={`rounded-md px-2 py-1 uppercase transition-colors ${
              chartSource === "tradingview"
                ? "bg-[var(--color-blue-400)]/12 text-[var(--color-blue-300)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-300)]"
            }`}
          >
            TradingView
          </button>
          <button
            onClick={() => setChartSource("demo")}
            className={`rounded-md px-2 py-1 uppercase transition-colors ${
              chartSource === "demo"
                ? "bg-[var(--color-gold-400)]/12 text-[var(--color-gold-300)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-300)]"
            }`}
          >
            Demo
          </button>
        </div>
        <span className={chartSource === "tradingview" ? "tag-live" : "tag-demo"}>
          {chartSource === "tradingview" ? "LIVE — TRADINGVIEW" : "DEMO CHART"}
        </span>
      </div>

      {chartSource === "demo" && (
        <div className="mb-2 flex gap-1 text-[11px] font-mono tracking-wide">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`rounded-md px-2 py-1 uppercase transition-colors ${
                timeframe === tf
                  ? "bg-[var(--color-gold-400)]/12 text-[var(--color-gold-300)]"
                  : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-300)]"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-[180px] flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/40 p-1">
        {chartSource === "tradingview" ? (
          <TradingViewWidget symbol="XAUUSD" />
        ) : candles.length > 0 ? (
          <LiveTradingChart candles={candles} />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-[var(--color-ink-500)]">Loading chart…</div>
        )}
      </div>

      {chartSource === "demo" && (
        <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--color-ink-500)] sm:grid-cols-3">
          <div>
            <div className="uppercase tracking-wide">High (demo)</div>
            <div className="font-mono text-[13px] text-[var(--color-ink-100)] tabular-nums">{demoHigh ? fmt(demoHigh) : "—"}</div>
          </div>
          <div>
            <div className="uppercase tracking-wide">Low (demo)</div>
            <div className="font-mono text-[13px] text-[var(--color-ink-100)] tabular-nums">{demoLow ? fmt(demoLow) : "—"}</div>
          </div>
          <div>
            <div className="uppercase tracking-wide">Open (demo)</div>
            <div className="font-mono text-[13px] text-[var(--color-ink-100)] tabular-nums">{demoOpen ? fmt(demoOpen) : "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
