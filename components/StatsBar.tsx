"use client";

type Account = { balance: number; equity: number; currency: string; brokerConnected: boolean } | null;

function fmtMoney(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function StatsBar({
  account,
  positionCount,
  onAskAurum,
}: {
  account: Account;
  positionCount: number;
  onAskAurum: () => void;
}) {
  const pnl = account ? account.equity - account.balance : 0;
  const pnlPositive = pnl >= 0;

  return (
    <div className="glass-panel flex flex-wrap items-center justify-between gap-4 px-5 py-3">
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
