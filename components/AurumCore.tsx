"use client";

import type { TradingAgentState } from "@/lib/strategy/types";

function statusClass(status: TradingAgentState["status"]) {
  if (status === "active") return "text-[var(--color-bull)] border-[var(--color-bull)]/30 bg-[var(--color-bull)]/5";
  if (status === "blocked") return "text-[var(--color-bear)] border-[var(--color-bear)]/30 bg-[var(--color-bear)]/5";
  return "text-[var(--color-ink-500)] border-[var(--color-ink-700)] bg-transparent";
}

// One small icon per real agent id — kept distinct from the reference
// mockup's fictional agent names (Sentiment AI, Portfolio Optimizer, etc.):
// these six are the actual build phases from the blueprint, each honestly
// labeled "standby" until that phase exists. Reusing the mockup's names
// here would misrepresent what's actually being tracked.
const ICONS: Record<TradingAgentState["id"], React.ReactNode> = {
  "market-structure": (
    <path d="M4 18V9M9 18V5M14 18v-7M19 18V3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  ),
  "trend-engine": (
    <path d="M3 16l5-6 4 4 8-9M20 5h-4M20 5v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  ),
  "risk-manager": (
    <path
      d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
  ),
  "trade-executor": (
    <>
      <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.6" />
    </>
  ),
  "news-watch": (
    <path
      d="M4 5h13a3 3 0 0 1 3 3v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5zM8 9h8M8 12.5h8M8 16h5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  ),
  "position-manager": (
    <path
      d="M12 3l8 4-8 4-8-4 8-4zM4 12l8 4 8-4M4 16l8 4 8-4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

function AgentNode({ agent, side }: { agent: TradingAgentState; side: "left" | "right" }) {
  const card = (
    <span
      title={agent.detail}
      className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[10px] font-mono tracking-wide ${statusClass(agent.status)}`}
    >
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
        {ICONS[agent.id]}
      </svg>
      <span className="flex flex-col leading-tight">
        <span>{agent.label}</span>
        <span className={`flex items-center gap-1 text-[8px] ${agent.status === "active" ? "" : "opacity-70"}`}>
          <span className={`h-1 w-1 rounded-full bg-current ${agent.status === "active" ? "animate-pulse-dot" : ""}`} />
          {agent.status.toUpperCase()}
        </span>
      </span>
    </span>
  );

  const wire = (
    <span
      aria-hidden="true"
      className="hidden h-px flex-1 sm:block"
      style={{
        background: `linear-gradient(${side === "left" ? "90deg" : "270deg"}, currentColor, transparent)`,
        color: agent.status === "active" ? "var(--color-blue-400)" : "var(--color-ink-700)",
        opacity: agent.status === "active" ? 0.6 : 0.3,
        minWidth: 12,
      }}
    />
  );

  return (
    <div className="flex items-center gap-0">
      {side === "left" ? (
        <>
          {card}
          {wire}
        </>
      ) : (
        <>
          {wire}
          {card}
        </>
      )}
    </div>
  );
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
  const left = agents.slice(0, 3);
  const right = agents.slice(3, 6);

  return (
    <div className="flex flex-col items-center gap-3 py-4 select-none">
      <div className="flex items-center gap-2 font-display text-sm tracking-[0.2em] text-[var(--color-gold-300)]">
        AURUM CORE
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-blue)] bg-[var(--color-blue-400)]/5 px-2 py-0.5 text-[10px] font-mono tracking-wider text-[var(--color-blue-300)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-blue-400)] animate-pulse-dot" />
          ACTIVE
        </span>
      </div>
      <div className="-mt-1 text-xs text-[var(--color-ink-500)]">Central AI Processor</div>

      <div className="grid w-full max-w-2xl grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3">
        <div className="flex flex-col gap-2">
          {left.map((a) => (
            <AgentNode key={a.id} agent={a} side="left" />
          ))}
        </div>

        <div className="relative h-48 w-48 sm:h-56 sm:w-56">
          {/* orbiting particles */}
          <div className="absolute inset-0" style={{ animation: "var(--animate-orbit-slow)" }}>
            <span className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[var(--color-blue-300)] shadow-[0_0_6px_2px_rgba(90,180,234,0.6)]" style={{ ["--orbit-radius" as string]: "96px" }} />
          </div>
          <div className="absolute inset-0" style={{ animation: "var(--animate-orbit-slower)" }}>
            <span className="absolute left-1/2 top-1/2 h-1 w-1 rounded-full bg-[var(--color-gold-300)] shadow-[0_0_6px_2px_rgba(212,175,90,0.6)]" style={{ ["--orbit-radius" as string]: "78px" }} />
          </div>

          {/* radiating beams */}
          <div className="absolute left-1/2 top-1/2 h-px w-[160%] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--color-blue-400)]/50 to-transparent" />
          <div className="absolute left-1/2 top-1/2 h-[160%] w-px -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-transparent via-[var(--color-blue-400)]/35 to-transparent" />

          {/* rings */}
          <div className="absolute inset-0 rounded-full border border-[var(--color-border-blue)] animate-ring-spin-slow [border-style:dashed]" />
          <div className="absolute inset-4 rounded-full border border-[var(--color-border-gold)] animate-ring-spin-slower" />
          <div className="absolute inset-9 rounded-full border border-[var(--color-blue-400)]/25" />

          {/* glow + mark */}
          <div
            className={`absolute inset-14 rounded-full bg-[radial-gradient(circle,var(--color-gold-300),var(--color-gold-400)_55%,transparent_78%)] blur-[2px] ${
              thinking ? "animate-core-think" : "animate-core-breathe"
            }`}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-display text-5xl font-semibold sm:text-6xl"
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

        <div className="flex flex-col gap-2">
          {right.map((a) => (
            <AgentNode key={a.id} agent={a} side="right" />
          ))}
        </div>
      </div>

      <div className="mt-1 flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-panel-2)]/60 px-3 py-1 text-[11px] font-mono tracking-wider">
        <span className="text-[var(--color-ink-500)]">SYSTEM STATUS</span>
        <span className="flex items-center gap-1.5 text-[var(--color-bull)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-bull)] animate-pulse-dot" />
          {systemStatus}
        </span>
      </div>
    </div>
  );
}
