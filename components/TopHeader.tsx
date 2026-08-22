"use client";

import { useEffect, useState } from "react";

const WAVE_COUNT = 10;

export function TopHeader({
  onMenuClick,
  onSubmit,
  sending,
}: {
  onMenuClick: () => void;
  onSubmit: (text: string) => void;
  sending: boolean;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const [query, setQuery] = useState("");
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now?.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" }) ?? "--:--:--";
  const date = now?.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) ?? "";

  const submit = () => {
    const text = query.trim();
    if (!text || sending) return;
    onSubmit(text);
    setQuery("");
  };

  return (
    <header className="relative z-20 flex items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-void-2)]/70 px-6 py-3.5 backdrop-blur">
      <div className="flex flex-shrink-0 items-center gap-4">
        <button aria-label="Menu" onClick={onMenuClick} className="icon-btn">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
        <div className="hidden items-baseline gap-3 lg:flex">
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
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-2)]/60 px-4 py-2 focus-within:border-[var(--color-border-gold)]">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-[var(--color-gold-400)]">
          <path
            d="M8 1l1.2 4L13 6l-3.8 1L8 11l-1.2-4L3 6l3.8-1L8 1z"
            fill="currentColor"
          />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
          placeholder="Ask Aurum anything…"
          className="min-w-0 flex-1 bg-transparent text-[13px] text-[var(--color-ink-100)] placeholder:text-[var(--color-ink-500)] focus:outline-none"
        />
        <div className="hidden items-center gap-[2px] sm:flex" aria-hidden="true">
          {Array.from({ length: WAVE_COUNT }).map((_, i) => (
            <span
              key={i}
              className="w-[2px] rounded-full bg-[var(--color-blue-400)]/50"
              style={{
                height: 4 + ((i * 5) % 12),
                animation: sending ? `waveBar 1s ease-in-out ${(i % 4) * 0.08}s infinite` : "none",
              }}
            />
          ))}
        </div>
        <button
          type="button"
          title="Voice input isn't wired up yet — type instead."
          aria-disabled="true"
          className="flex h-6 w-6 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-full text-[var(--color-ink-500)]"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <div className="hidden text-right md:block">
          <div className="font-mono text-sm text-[var(--color-ink-100)] tabular-nums">{time}</div>
          <div className="text-[10px] tracking-wide text-[var(--color-ink-500)]">{date.toUpperCase()}</div>
        </div>

        <div className="relative">
          <button aria-label="Notifications" onClick={() => setBellOpen((v) => !v)} className="icon-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 10a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 14 6 10z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M9.5 18a2.5 2.5 0 0 0 5 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {bellOpen && (
            <div className="dropdown-panel right-0 top-11 w-56">
              <div className="px-2 py-1.5 text-[10px] tracking-wider text-[var(--color-ink-500)]">NOTIFICATIONS</div>
              <div className="rounded-lg px-2.5 py-3 text-[12px] text-[var(--color-ink-500)]">
                No notifications yet — nothing here alerts you automatically.
              </div>
            </div>
          )}
        </div>

        <button aria-label="Settings" onClick={onMenuClick} className="icon-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
            <path
              d="M19.4 13.5a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.04 1.56V19.5a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.04H4.5a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.56-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34H10.5a1.7 1.7 0 0 0 1.04-1.56V4.5a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.04 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.56 1.04h.09a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.56 1.04z"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <div className="flex items-center gap-2.5 border-l border-[var(--color-border)] pl-3">
          <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-[var(--color-blue-400)]/60 bg-[var(--color-panel-2)] text-[var(--color-ink-300)]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.6" />
              <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--color-void-2)] bg-[var(--color-bull)]" />
          </div>
          <div className="hidden sm:block">
            <div className="text-[12px] font-semibold tracking-wide text-[var(--color-ink-100)]">AURUM MASTER</div>
            <div className="text-[10px] text-[var(--color-ink-500)]">System Owner</div>
          </div>
        </div>
      </div>
    </header>
  );
}
