"use client";

const BAR_COUNT = 28;

export function VoiceCommandBar({ active, greeting }: { active: boolean; greeting: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-2">
      <div className="text-xs font-display tracking-[0.25em] text-[var(--color-ink-500)]">AURUM VOICE COMMAND</div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-[3px]">
          {Array.from({ length: BAR_COUNT / 2 }).map((_, i) => (
            <span
              key={`l-${i}`}
              className="w-[2.5px] rounded-full bg-[var(--color-blue-400)]/60"
              style={{
                height: 6 + ((i * 7) % 18),
                animation: active ? `waveBar 1s ease-in-out ${(i % 5) * 0.08}s infinite` : "none",
                opacity: active ? 1 : 0.35,
              }}
            />
          ))}
        </div>

        <button
          type="button"
          title="Voice input isn't wired up yet — type below for now."
          aria-disabled="true"
          className="flex h-12 w-12 flex-shrink-0 cursor-not-allowed items-center justify-center rounded-full border-2 border-[var(--color-blue-400)]/50 bg-[var(--color-blue-400)]/10 text-[var(--color-blue-300)] shadow-[0_0_20px_rgba(90,180,234,0.25)]"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <rect x="9" y="3" width="6" height="11" rx="3" stroke="currentColor" strokeWidth="1.6" />
            <path d="M5 11a7 7 0 0 0 14 0M12 18v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex items-center gap-[3px]">
          {Array.from({ length: BAR_COUNT / 2 }).map((_, i) => (
            <span
              key={`r-${i}`}
              className="w-[2.5px] rounded-full bg-[var(--color-blue-400)]/60"
              style={{
                height: 6 + (((BAR_COUNT / 2 - i) * 7) % 18),
                animation: active ? `waveBar 1s ease-in-out ${(i % 5) * 0.08}s infinite` : "none",
                opacity: active ? 1 : 0.35,
              }}
            />
          ))}
        </div>
      </div>
      <div className="text-[13px] text-[var(--color-ink-300)]">{greeting}</div>
    </div>
  );
}
