"use client";

type Judge = { call: string; confidence: number; reasoning: string } | null;

export function AIInsightsPanel({ judge, connected }: { judge: Judge; connected: boolean }) {
  return (
    <div className="glass-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">AI INSIGHTS</div>
        <span className={connected ? "tag-live" : "tag-demo"}>{connected ? "LIVE ANALYSIS" : "NO FEED"}</span>
      </div>
      {judge ? (
        <>
          <p className="text-[13px] leading-relaxed text-[var(--color-ink-300)]">{judge.reasoning}</p>
          <div className="mt-2 font-mono text-[10px] tracking-wide text-[var(--color-ink-500)]">
            {judge.call} · {Math.round(judge.confidence * 100)}% confidence
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--color-ink-500)]">No analysis yet — the gold desk hasn&rsquo;t run a cycle.</p>
      )}
    </div>
  );
}
