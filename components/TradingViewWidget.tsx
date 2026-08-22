"use client";

import { useEffect, useRef } from "react";

// TradingView's free official embeddable chart widget — no API key, no
// login, no TradingView account link needed (that isn't something a
// server-side app can do; TradingView has no public API for a personal
// account's own data). This is real, professional live-market charting,
// straight from TradingView's own feed. It's display-only: nothing here
// feeds the buy/sell setup engine, which runs on lib/strategy/setup-engine.ts
// against real candles pulled separately.

const SYMBOL_MAP: Record<string, string> = {
  XAUUSD: "TVC:GOLD",
  SPX: "TVC:SPX",
  IXIC: "TVC:IXIC",
  DJI: "TVC:DJI",
};

export function TradingViewWidget({ symbol = "XAUUSD" }: { symbol?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = "";

    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    container.appendChild(widgetDiv);

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: SYMBOL_MAP[symbol] ?? SYMBOL_MAP.XAUUSD,
      interval: "60",
      timezone: "Etc/UTC",
      theme: "dark",
      style: "1",
      locale: "en",
      backgroundColor: "rgba(10, 13, 20, 1)",
      gridColor: "rgba(148, 163, 184, 0.06)",
      hide_top_toolbar: false,
      hide_legend: false,
      allow_symbol_change: false,
      support_host: "https://www.tradingview.com",
    });
    container.appendChild(script);

    return () => {
      container.innerHTML = "";
    };
  }, [symbol]);

  return (
    <div className="tradingview-widget-container h-full w-full" ref={containerRef} />
  );
}
