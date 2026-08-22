"use client";

function deriveSentiment(judge: { call: string; confidence: number } | null): { score: number; label: string } {
  if (!judge) return { score: 50, label: "NEUTRAL" };
  const call = judge.call.toUpperCase();
  if (call.includes("BUY") || call === "LONG") return { score: Math.round(50 + judge.confidence * 50), label: "BULLISH" };
  if (call.includes("SELL") || call === "SHORT") return { score: Math.round(50 - judge.confidence * 50), label: "BEARISH" };
  return { score: 50, label: "NEUTRAL" };
}

export function MarketSentimentPanel({
  judge,
  updatedAt,
}: {
  judge: { call: string; confidence: number } | null;
  updatedAt: string | null;
}) {
  const { score, label } = deriveSentiment(judge);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color = label === "BULLISH" ? "var(--color-bull)" : label === "BEARISH" ? "var(--color-bear)" : "var(--color-ink-500)";

  return (
    <div className="glass-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">MARKET SENTIMENT</div>
        <span className="text-[10px] text-[var(--color-ink-500)]">derived from latest judge call</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative h-24 w-24 flex-shrink-0">
          <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
            <circle cx="40" cy="40" r={radius} fill="none" stroke="var(--color-border)" strokeWidth="7" />
            <circle
              cx="40"
              cy="40"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 0.6s ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-xl tabular-nums text-[var(--color-ink-100)]">{score}</span>
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold tracking-wide" style={{ color }}>
            {label}
          </div>
          <div className="mt-1 text-[10px] text-[var(--color-ink-500)]">
            {updatedAt ? `Last updated: ${new Date(updatedAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}` : "No cycle yet"}
          </div>
        </div>
      </div>
    </div>
  );
}
