"use client";

import { useMemo, useState } from "react";
import type { InstrumentQuote, MarketCategory } from "@/lib/market-data/types";
import { Sparkline } from "./Sparkline";

const TABS: { id: MarketCategory; label: string }[] = [
  { id: "indices", label: "INDICES" },
  { id: "commodities", label: "COMMODITIES" },
  { id: "forex", label: "FOREX" },
  { id: "crypto", label: "CRYPTO" },
];

function fmtPrice(n: number) {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function LiveMarketsPanel({ quotes }: { quotes: InstrumentQuote[] }) {
  const [tab, setTab] = useState<MarketCategory>("commodities");
  const inCategory = useMemo(() => quotes.filter((q) => q.category === tab), [quotes, tab]);
  const featured = inCategory[0];
  const rest = inCategory.slice(1);

  return (
    <div className="glass-panel glass-panel-gold p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">LIVE MARKETS</div>
          <div className="text-[10px] tracking-wider text-[var(--color-ink-500)]">GLOBAL OVERVIEW</div>
        </div>
      </div>

      <div className="mb-3 flex gap-1 border-b border-[var(--color-border)] pb-2 text-[11px] font-mono tracking-wide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-2 py-1 transition-colors ${
              tab === t.id
                ? "bg-[var(--color-gold-400)]/12 text-[var(--color-gold-300)]"
                : "text-[var(--color-ink-500)] hover:text-[var(--color-ink-300)]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!featured ? (
        <div className="py-6 text-center text-xs text-[var(--color-ink-500)]">No instruments in this category yet.</div>
      ) : (
        <>
          <div className="mb-3">
            <div className="mb-1 flex items-center gap-2 text-xs text-[var(--color-ink-300)]">
              {featured.displayName}
              <span className={featured.isLive ? "tag-live" : "tag-demo"}>{featured.isLive ? "LIVE" : "DEMO"}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl tabular-nums text-[var(--color-ink-100)]">{fmtPrice(featured.price)}</span>
              <span className={`font-mono text-xs tabular-nums ${featured.change >= 0 ? "text-[var(--color-bull)]" : "text-[var(--color-bear)]"}`}>
                {featured.change >= 0 ? "+" : ""}
                {fmtPrice(featured.change)} ({featured.changePct >= 0 ? "+" : ""}
                {featured.changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="mt-2">
              <Sparkline points={featured.sparkline} positive={featured.change >= 0} width={280} height={64} />
            </div>
          </div>

          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {rest.map((q) => (
                <div key={q.symbol} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/50 p-2.5">
                  <div className="mb-1 flex items-center justify-between text-[10px] text-[var(--color-ink-500)]">
                    <span>{q.displayName}</span>
                    <span className={q.isLive ? "tag-live" : "tag-demo"} style={{ padding: "1px 6px" }}>
                      {q.isLive ? "LIVE" : "DEMO"}
                    </span>
                  </div>
                  <div className="font-mono text-sm tabular-nums text-[var(--color-ink-100)]">{fmtPrice(q.price)}</div>
                  <div className={`font-mono text-[10px] tabular-nums ${q.changePct >= 0 ? "text-[var(--color-bull)]" : "text-[var(--color-bear)]"}`}>
                    {q.changePct >= 0 ? "+" : ""}
                    {q.changePct.toFixed(2)}%
                  </div>
                  <Sparkline points={q.sparkline} positive={q.changePct >= 0} width={90} height={24} />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
