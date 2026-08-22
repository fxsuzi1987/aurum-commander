"use client";

type Account = { balance: number; equity: number; currency: string; brokerConnected: boolean } | null;

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

const QUICK_ACTIONS: { label: string; prompt: string; icon: React.ReactNode }[] = [
  {
    label: "Optimize Portfolio",
    prompt: "Look at my current demo portfolio and positions and tell me how you'd think about optimizing it.",
    icon: (
      <>
        <circle cx="12" cy="12" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 5v7l5 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
  },
  {
    label: "Scan Markets",
    prompt: "Scan what you can see across gold and the US indices right now and tell me what stands out.",
    icon: <path d="M4 18V9M9 18V5M14 18v-7M19 18V3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />,
  },
  {
    label: "Risk Analysis",
    prompt: "Give me a risk analysis of my current demo positions and any open trade setups.",
    icon: (
      <path
        d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    ),
  },
  {
    label: "Generate Report",
    prompt: "Put together a short status report covering the gold desk, current trade setups, and portfolio.",
    icon: (
      <path
        d="M6 3h9l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1zM14 3v4h4M8 12h8M8 16h5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    ),
  },
];

export function StatsBar({
  account,
  positionCount,
  onAskAurum,
  onQuickAction,
  connectedCount,
  totalSources,
  lastResponseMs,
}: {
  account: Account;
  positionCount: number;
  onAskAurum: () => void;
  onQuickAction: (prompt: string) => void;
  connectedCount: number;
  totalSources: number;
  lastResponseMs: number | null;
}) {
  const pnl = account ? account.equity - account.balance : 0;
  const pnlPositive = pnl >= 0;

  return (
    <div className="glass-panel flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <Stat label="Portfolio Value" tag="DEMO">
            <span className="font-mono text-base tabular-nums text-[var(--color-ink-100)]">{account ? fmtMoney(account.equity) : "—"}</span>
          </Stat>
          <Stat label="Open P&L" tag="DEMO">
            <span className={`font-mono text-base tabular-nums ${pnlPositive ? "text-[var(--color-bull)]" : "text-[var(--color-bear)]"}`}>
              {pnlPositive ? "+" : ""}
              {fmtMoney(pnl)}
            </span>
          </Stat>
          <Stat label="Open Positions">
            <span className="font-mono text-base tabular-nums text-[var(--color-ink-100)]">{positionCount}</span>
          </Stat>
          <Stat label="Trading Mode">
            <span className="rounded-full border border-[var(--color-warn)]/30 bg-[var(--color-warn)]/8 px-2 py-0.5 font-mono text-[11px] tracking-wide text-[var(--color-warn)]">
              DEMO — NO REAL BROKER
            </span>
          </Stat>
          <Stat label="Data Sources">
            <span className="font-mono text-base tabular-nums text-[var(--color-ink-100)]">
              {connectedCount}/{totalSources}
            </span>
          </Stat>
          <Stat label="Last Response">
            <span className="font-mono text-base tabular-nums text-[var(--color-ink-100)]">
              {lastResponseMs !== null ? `${(lastResponseMs / 1000).toFixed(1)}s` : "—"}
            </span>
          </Stat>
        </div>

        <button
          onClick={onAskAurum}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border-gold)] bg-[var(--color-gold-400)]/10 px-3.5 py-2 text-[12px] font-medium tracking-wide text-[var(--color-gold-300)] transition-colors hover:bg-[var(--color-gold-400)]/16"
        >
          Ask Aurum
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M4 2l4 4-4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-border)] pt-3">
        <span className="mr-1 text-[10px] tracking-wider text-[var(--color-ink-500)]">QUICK ACTIONS</span>
        {QUICK_ACTIONS.map((a) => (
          <button
            key={a.label}
            onClick={() => onQuickAction(a.prompt)}
            title={`Ask Aurum: "${a.prompt}"`}
            className="flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/50 px-2.5 py-1.5 text-[11px] text-[var(--color-ink-300)] transition-colors hover:border-[var(--color-border-gold)] hover:text-[var(--color-gold-300)]"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              {a.icon}
            </svg>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, tag, children }: { label: string; tag?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--color-ink-500)]">
        {label}
        {tag && <span className="rounded border border-[var(--color-warn)]/25 px-1 text-[8px] text-[var(--color-warn)]">{tag}</span>}
      </div>
      {children}
    </div>
  );
}
