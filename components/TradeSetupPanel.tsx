"use client";

import { useEffect, useState } from "react";

type Symbol = "XAUUSD" | "SPX" | "IXIC" | "DJI";

const SYMBOLS: { id: Symbol; label: string }[] = [
  { id: "XAUUSD", label: "GOLD" },
  { id: "SPX", label: "S&P 500" },
  { id: "IXIC", label: "NASDAQ" },
  { id: "DJI", label: "DOW" },
];

interface TradeSetup {
  side: "BUY" | "SELL" | "NO_SETUP";
  entry: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  riskRewardRatio: number | null;
  trend: "uptrend" | "downtrend" | "choppy";
  basis: string;
  atr: number | null;
}

interface TradeSetupResponse {
  symbol: Symbol;
  displayName: string;
  connected: boolean;
  error: string | null;
  currentPrice?: number;
  setup: TradeSetup | null;
  generatedAt?: string;
}

interface TradingViewSignal {
  symbol: string;
  side: string;
  price: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  message: string | null;
  receivedAt: string;
}

interface TradingViewSignalResponse {
  symbol: string;
  configured: boolean;
  signal: TradingViewSignal | null;
}

function fmt(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function sideColor(side: TradeSetup["side"]) {
  if (side === "BUY") return "var(--color-bull)";
  if (side === "SELL") return "var(--color-bear)";
  return "var(--color-ink-500)";
}

export function TradeSetupPanel() {
  const [symbol, setSymbol] = useState<Symbol>("XAUUSD");
  const [data, setData] = useState<TradeSetupResponse | null>(null);
  const [tvData, setTvData] = useState<TradingViewSignalResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/trade-setup?symbol=${symbol}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    fetch(`/api/webhooks/tradingview?symbol=${symbol}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) setTvData(json);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const setup = data?.setup ?? null;

  return (
    <div className="glass-panel glass-panel-gold p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">TRADE SETUP</div>
          <div className="text-[10px] tracking-wider text-[var(--color-ink-500)]">RULE-BASED TECHNICAL LEVELS</div>
        </div>
        <span className={data?.connected ? "tag-live" : "tag-demo"}>{data?.connected ? "LIVE DATA" : "NOT CONNECTED"}</span>
      </div>

      <div className="mb-3 flex gap-1 border-b border-[var(--color-border)] pb-2 text-[11px] font-mono tracking-wide">
        {SYMBOLS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSymbol(s.id)}
            className={`rounded-md px-2 py-1 transition-colors ${
              symbol === s.id
                ? "bg-[var(--color-gold-400)]/12 text-[var(--color-gold-300)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-300)]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading && !data ? (
        <div className="py-6 text-center text-xs text-[var(--color-ink-500)]">Loading…</div>
      ) : !data?.connected ? (
        <div className="rounded-lg border border-[var(--color-warn)]/25 bg-[var(--color-warn)]/5 p-3 text-[12px] leading-relaxed text-[var(--color-ink-300)]">
          {data?.error ?? "Real market data isn't connected yet."}
        </div>
      ) : data.error || !setup ? (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/50 p-3 text-[12px] leading-relaxed text-[var(--color-ink-300)]">
          {data.error ?? "No setup available right now."}
        </div>
      ) : (
        <>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-[11px] text-[var(--color-ink-500)]">{data.displayName}</div>
              <div className="font-mono text-xl tabular-nums text-[var(--color-ink-100)]">
                {data.currentPrice !== undefined ? fmt(data.currentPrice) : "—"}
              </div>
            </div>
            <span
              className="rounded-full border px-3 py-1 text-[12px] font-semibold tracking-wide"
              style={{ color: sideColor(setup.side), borderColor: sideColor(setup.side) }}
            >
              {setup.side === "NO_SETUP" ? "NO SETUP" : setup.side}
            </span>
          </div>

          {setup.side === "NO_SETUP" ? (
            <p className="text-[12px] leading-relaxed text-[var(--color-ink-500)]">{setup.basis}</p>
          ) : (
            <>
              <div className="mb-3 grid grid-cols-3 gap-2 text-center text-[10px] text-[var(--color-ink-500)]">
                <div>
                  <div className="uppercase tracking-wide">Entry</div>
                  <div className="font-mono text-[13px] text-[var(--color-ink-100)] tabular-nums">{fmt(setup.entry!)}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Stop Loss</div>
                  <div className="font-mono text-[13px] tabular-nums text-[var(--color-bear)]">{fmt(setup.stopLoss!)}</div>
                </div>
                <div>
                  <div className="uppercase tracking-wide">Take Profit</div>
                  <div className="font-mono text-[13px] tabular-nums text-[var(--color-bull)]">{fmt(setup.takeProfit!)}</div>
                </div>
              </div>
              <div className="mb-2 text-[10px] tracking-wide text-[var(--color-ink-500)]">
                Reward:Risk {setup.riskRewardRatio}:1 · ATR {setup.atr}
              </div>
              <p className="text-[12px] leading-relaxed text-[var(--color-ink-300)]">{setup.basis}</p>
            </>
          )}

          <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-ink-700)]">
            Computed from technical rules on real price data. Not financial advice — Aurum isn&rsquo;t a licensed advisor, and this can
            be wrong. Use your own judgment before acting on it.
          </p>
        </>
      )}

      <div className="mt-4 border-t border-[var(--color-border)] pt-3">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[10px] tracking-wider text-[var(--color-ink-500)]">YOUR TRADINGVIEW STRATEGY</div>
          {tvData?.signal && (
            <span className="tag-live">
              {new Date(tvData.signal.receivedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        {!tvData?.configured ? (
          <p className="text-[11px] leading-relaxed text-[var(--color-ink-700)]">
            Not set up — add TRADINGVIEW_WEBHOOK_SECRET, then point a TradingView alert&rsquo;s webhook at this app to see your own
            strategy&rsquo;s signals here.
          </p>
        ) : !tvData.signal ? (
          <p className="text-[11px] leading-relaxed text-[var(--color-ink-700)]">Webhook is live — no alert received yet.</p>
        ) : (
          <div className="text-[12px] leading-relaxed text-[var(--color-ink-300)]">
            <span className="font-semibold" style={{ color: tvData.signal.side.includes("BUY") || tvData.signal.side.includes("LONG") ? "var(--color-bull)" : tvData.signal.side.includes("SELL") || tvData.signal.side.includes("SHORT") ? "var(--color-bear)" : "var(--color-ink-100)" }}>
              {tvData.signal.side}
            </span>{" "}
            {tvData.signal.price !== null && `@ ${fmt(tvData.signal.price)} `}
            {tvData.signal.stopLoss !== null && `· SL ${fmt(tvData.signal.stopLoss)} `}
            {tvData.signal.takeProfit !== null && `· TP ${fmt(tvData.signal.takeProfit)}`}
            {tvData.signal.message && <div className="mt-1 text-[11px] text-[var(--color-ink-500)]">{tvData.signal.message}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
