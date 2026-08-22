"use client";

import { useEffect, useRef } from "react";

export interface ConnectionStatus {
  label: string;
  connected: boolean;
  detail: string;
}

/** Slide-in panel behind the header's hamburger button. Shows real connection
 * status for every data source this app can use — pulled from the same env
 * flags the rest of the dashboard already reads, never invented — plus a
 * couple of links to the project's own docs. No fake settings toggles: if
 * a control isn't wired to anything real yet, it doesn't appear here. */
export function SideMenu({
  open,
  onClose,
  connections,
}: {
  open: boolean;
  onClose: () => void;
  connections: ConnectionStatus[];
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open, onClose]);

  if (!open) return null;

  const connectedCount = connections.filter((c) => c.connected).length;

  return (
    <div className="fixed inset-0 z-40" style={{ background: "rgb(5 6 10 / 0.5)", animation: "var(--animate-fade-in)" }}>
      <div
        ref={panelRef}
        className="glass-panel glass-panel-gold absolute left-0 top-0 h-full w-[300px] overflow-y-auto p-5"
        style={{ animation: "var(--animate-menu-in)" }}
      >
        <div className="mb-1 font-display text-sm tracking-[0.2em] text-[var(--color-gold-300)]">AURUM</div>
        <div className="mb-6 text-[10px] tracking-[0.15em] text-[var(--color-ink-500)]">SYSTEM MENU</div>

        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-[10px] tracking-wider text-[var(--color-ink-500)]">
            <span>DATA SOURCES</span>
            <span className="font-mono">
              {connectedCount}/{connections.length} CONNECTED
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            {connections.map((c) => (
              <div
                key={c.label}
                title={c.detail}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)]/50 px-2.5 py-2"
              >
                <span className="text-[12px] text-[var(--color-ink-300)]">{c.label}</span>
                <span className={c.connected ? "tag-live" : "tag-demo"} style={{ padding: "1px 6px" }}>
                  {c.connected ? "LIVE" : "OFF"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="mb-2 text-[10px] tracking-wider text-[var(--color-ink-500)]">LINKS</div>
          <a
            href="https://github.com/fxsuzi1987/aurum-commander"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-lg px-2.5 py-2 text-[12px] text-[var(--color-ink-300)] transition-colors hover:bg-[var(--color-panel-2)]/60 hover:text-[var(--color-gold-300)]"
          >
            Source on GitHub
            <span className="text-[var(--color-ink-500)]">↗</span>
          </a>
        </div>

        <p className="text-[10px] leading-relaxed text-[var(--color-ink-700)]">
          Everything above reflects real configuration state — nothing here is a placeholder toggle. Add or change keys in
          your deployment&rsquo;s environment variables to flip a source LIVE.
        </p>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-lg border border-[var(--color-border)] py-2 text-[11px] tracking-wide text-[var(--color-ink-500)] transition-colors hover:border-[var(--color-border-gold)] hover:text-[var(--color-gold-300)]"
        >
          Close
        </button>
      </div>
    </div>
  );
}
