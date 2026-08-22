"use client";

type Judge = { call: string; confidence: number; reasoning: string } | null;

export function AIInsightsPanel({
  judge,
  connected,
  onAskMore,
}: {
  judge: Judge;
  connected: boolean;
  onAskMore: (prompt: string) => void;
}) {
  return (
    <div className="glass-panel p-4">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border border-[var(--color-border-gold)] bg-[var(--color-gold-400)]/8 text-[var(--color-gold-300)]">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2l2.2 5.8L20 10l-5.8 2.2L12 18l-2.2-5.8L4 10l5.8-2.2L12 2z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div className="font-display text-sm tracking-wide text-[var(--color-gold-300)]">AI INSIGHTS</div>
        </div>
        <span className={connected ? "tag-live" : "tag-demo"}>{connected ? "LIVE ANALYSIS" : "NO FEED"}</span>
      </div>
      {judge ? (
        <>
          <p className="text-[13px] leading-relaxed text-[var(--color-ink-300)]">{judge.reasoning}</p>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] tracking-wide text-[var(--color-ink-500)]">
              {judge.call} · {Math.round(judge.confidence * 100)}% confidence
            </span>
            <button
              onClick={() => onAskMore("Walk me through the full reasoning behind the gold desk's latest call — what's it seeing?")}
              className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-gold-300)] transition-opacity hover:opacity-80"
            >
              VIEW FULL ANALYSIS
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </>
      ) : (
        <p className="text-xs text-[var(--color-ink-500)]">No analysis yet — the gold desk hasn&rsquo;t run a cycle.</p>
      )}
    </div>
  );
}
