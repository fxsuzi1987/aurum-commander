"use client";

import type { TradingAgentState } from "@/lib/strategy/types";

function statusClass(status: TradingAgentState["status"]) {
  if (status === "active") return "text-[var(--color-bull)] border-[var(--color-bull)]/30 bg-[var(--color-bull)]/5";
  if (status === "blocked") return "text-[var(--color-bear)] border-[var(--color-bear)]/30 bg-[var(--color-bear)]/5";
  return "text-[var(--color-ink-500)] border-[var(--color-ink-700)] bg-transparent";
}

export function AurumCore({
  thinking,
  systemStatus,
  agents,
}: {
  thinking: boolean;
  systemStatus: string;
  agents: TradingAgentState[];
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 select-none">
      <div className="flex items-center gap-2 font-display text-sm tracking-[0.2em] text-[var(--color-gold-300)]">
        AURUM CORE
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-blue)] bg-[var(--color-blue-400)]/5 px-2 py-0.5 text-[10px] font-mono tracking-wider text-[var(--color-blue-300)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-blue-400)] animate-pulse-dot" />
          ACTIVE
        </span>
      </div>
      <div className="-mt-2 text-xs text-[var(--color-ink-500)]">Central AI Processor</div>

      <div className="relative h-56 w-56 sm:h-64 sm:w-64">
        {/* radiating beams */}
        <div className="absolute left-1/2 top-1/2 h-px w-[220%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--color-blue-400)]/50 to-transparent" />
        <div className="absolute left-1/2 top-1/2 h-[220%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-[var(--color-blue-400)]/35 to-transparent" />

        {/* rings */}
        <div className="absolute inset-0 rounded-full border border-[var(--color-border-blue)] animate-ring-spin-slow [border-style:dashed]" />
        <div className="absolute inset-5 rounded-full border border-[var(--color-border-gold)] animate-ring-spin-slower" />
        <div className="absolute inset-11 rounded-full border border-[var(--color-blue-400)]/25" />

        {/* glow + mark */}
        <div
          className={`absolute inset-16 rounded-full bg-[radial-gradient(circle,var(--color-gold-300),var(--color-gold-400)_55%,transparent_78%)] blur-[2px] ${
            thinking ? "animate-core-think" : "animate-core-breathe"
          }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-display text-6xl font-semibold"
            style={{
              background: "linear-gradient(180deg, var(--color-gold-100), var(--color-gold-600))",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              textShadow: "0 0 24px rgb(212 175 90 / 0.35)",
            }}
          >
            A
          </span>
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-2)]/60 px-3 py-1 text-[11px] font-mono tracking-wider">
        <span className="text-[var(--color-ink-500)]">SYSTEM STATUS</span>
        <span className="flex items-center gap-1.5 text-[var(--color-bull)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-bull)] animate-pulse-dot" />
          {systemStatus}
        </span>
      </div>

      <div className="mt-2 flex max-w-xl flex-wrap items-center justify-center gap-1.5">
        {agents.map((a) => (
          <span
            key={a.id}
            title={a.detail}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono tracking-wide ${statusClass(a.status)}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full bg-current ${a.status === "active" ? "animate-pulse-dot" : ""}`} />
            {a.label}
          </span>
        ))}
      </div>
    </div>
  );
}
