"use client";

import { useEffect, useState } from "react";

export function TopHeader() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "--:--:--";
  const date = now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "";

  return (
    <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-void-2)]/70 px-6 py-3.5 backdrop-blur">
      <div className="flex items-center gap-4">
        <button
          aria-label="Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-ink-300)] hover:border-[var(--color-border-gold)] hover:text-[var(--color-gold-300)] transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="flex items-baseline gap-3">
          <div>
            <div
              className="font-display text-xl font-semibold tracking-[0.22em]"
              style={{
                background: "linear-gradient(180deg, var(--color-gold-100), var(--color-gold-600))",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
              }}
            >
              AURUM
            </div>
            <div className="text-[10px] tracking-[0.18em] text-[var(--color-ink-500)]">AI OPERATING SYSTEM</div>
          </div>
          <div className="hidden md:block text-[11px] tracking-[0.15em] text-[var(--color-ink-500)]">
            INTELLIGENCE. AUTOMATION. <span className="text-[var(--color-blue-300)]">WEALTH.</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-right">
          <div className="font-mono text-sm text-[var(--color-ink-100)] tabular-nums">{time}</div>
          <div className="text-[10px] tracking-wide text-[var(--color-ink-500)]">{date.toUpperCase()}</div>
        </div>
        <div className="h-9 w-9 rounded-full border-2 border-[var(--color-blue-400)]/60 bg-[var(--color-panel-2)] flex items-center justify-center text-[var(--color-ink-300)]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
            <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      </div>
    </header>
  );
}
