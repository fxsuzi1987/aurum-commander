"use client";

import { useEffect, useRef } from "react";
import { createChart, CandlestickSeries, type IChartApi } from "lightweight-charts";
import type { Candle } from "@/lib/market-data/types";

export function LiveTradingChart({ candles }: { candles: Candle[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "transparent" },
        textColor: "#a8b0c0",
        fontFamily: "var(--font-mono)",
      },
      grid: {
        vertLines: { color: "rgba(148,163,184,0.06)" },
        horzLines: { color: "rgba(148,163,184,0.06)" },
      },
      rightPriceScale: { borderColor: "rgba(148,163,184,0.12)" },
      timeScale: { borderColor: "rgba(148,163,184,0.12)", timeVisible: true, secondsVisible: false },
      crosshair: { mode: 0 },
      height: containerRef.current.clientHeight || 260,
      width: containerRef.current.clientWidth || 400,
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#5ab4ea",
      downColor: "#d4af5a",
      borderUpColor: "#7cc8ef",
      borderDownColor: "#ecc978",
      wickUpColor: "#5ab4ea",
      wickDownColor: "#d4af5a",
    });
    series.setData(candles.map((c) => ({ time: c.time as unknown as never, open: c.open, high: c.high, low: c.low, close: c.close })));
    chart.timeScale().fitContent();
    chartRef.current = chart;

    const onResize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight });
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candles]);

  return <div ref={containerRef} className="h-full w-full" />;
}
