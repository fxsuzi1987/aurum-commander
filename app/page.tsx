"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  t: string;
}

interface HistoryResponse {
  history: ChatMessage[];
  env: { hasAnthropicKey: boolean; hasGoldDeskUrl: boolean; persistentStore: boolean };
}

interface GoldDeskSummary {
  connected: boolean;
  error: string | null;
  cycleId: string | null;
  ranAt: string | null;
  gold: { price: number; currency: string; updatedAt: string; source: string } | null;
  confluence: { macro: number | null; technical: number | null; news: number | null; risk: number | null };
  judge: { call: string; confidence: number; reasoning: string } | null;
  portfolio: { equity: number; startingEquity: number; position: { side: string; size: number; entryPrice: number } | null } | null;
  cycleError: string | null;
}

// The six divisions from the blueprint's agent roster. Only Trading is
// actually built — everything else stays visibly disabled rather than
// showing placeholder content, per the no-fabricated-data rule.
const DIVISIONS: { id: string; label: string; color: string; enabled: boolean }[] = [
  { id: "trading", label: "Trading", color: "#d4af5a", enabled: true },
  { id: "business", label: "Business", color: "#6fb7e8", enabled: false },
  { id: "content", label: "Content", color: "#b58ce8", enabled: false },
  { id: "money", label: "Money", color: "#6fe8a0", enabled: false },
  { id: "files", label: "Files", color: "#6fb7e8", enabled: false },
  { id: "learning", label: "Learning", color: "#d4af5a", enabled: false },
];

const GOLD_STATUS_POLL_MS = 20000;

function Pill({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`pill pill-${tone}`}>
      <span className="pill-dot" />
      {label}
    </span>
  );
}

function AgentRail({ active, onSelect }: { active: string; onSelect: (id: string) => void }) {
  return (
    <div className="agent-rail">
      {DIVISIONS.map((d) => (
        <button
          key={d.id}
          className={`rail-item ${active === d.id ? "rail-active" : ""} ${!d.enabled ? "rail-disabled" : ""}`}
          disabled={!d.enabled}
          onClick={() => d.enabled && onSelect(d.id)}
          title={d.enabled ? d.label : `${d.label} — not built yet`}
        >
          <span className="rail-icon" style={{ color: d.enabled || active === d.id ? d.color : undefined }} />
          <span className="rail-label">{d.label}</span>
          {!d.enabled && <span className="rail-badge">soon</span>}
        </button>
      ))}
    </div>
  );
}

function judgeCallClass(call: string): string {
  const c = call.toUpperCase();
  if (c.includes("BUY") || c === "LONG") return "judge-call-buy";
  if (c.includes("SELL") || c === "SHORT") return "judge-call-sell";
  return "judge-call-none";
}

function fmtPct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function ConfluenceMeter({ label, value }: { label: string; value: number | null }) {
  const pct = value === null ? 0 : Math.round(value * 100);
  return (
    <div className="meter-row">
      <span className="meter-label">{label}</span>
      <span className="meter-track">
        <span className={`meter-fill ${value === null ? "meter-empty" : ""}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="meter-value">{fmtPct(value)}</span>
    </div>
  );
}

function TradingPanels({ summary }: { summary: GoldDeskSummary | null }) {
  if (!summary) {
    return (
      <div className="trading-col">
        <div className="division-heading">TRADING DESK</div>
        <div className="panel"><div className="panel-empty">Loading gold desk status…</div></div>
      </div>
    );
  }

  if (!summary.connected) {
    return (
      <div className="trading-col">
        <div className="division-heading">TRADING DESK</div>
        <div className="panel">
          <div className="panel-title">GOLD DESK</div>
          <div className="panel-empty panel-empty-error">{summary.error ?? "The gold desk isn't reachable."}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="trading-col">
      <div className="division-heading">TRADING DESK</div>

      <div className="panel">
        <div className="panel-title">
          XAUUSD SPOT
          <span className="panel-title-glow">●</span>
        </div>
        {summary.gold ? (
          <>
            <div className="gold-price">
              {summary.gold.price.toFixed(2)}
              <span className="gold-price-currency">{summary.gold.currency}</span>
            </div>
            <div className="gold-price-meta">
              {summary.gold.source} · {fmtTime(summary.gold.updatedAt)}
            </div>
          </>
        ) : (
          <div className="panel-empty">No price yet — the pipeline hasn&rsquo;t run a cycle.</div>
        )}
      </div>

      <div className="panel">
        <div className="panel-title">CONFLUENCE</div>
        <ConfluenceMeter label="MACRO" value={summary.confluence.macro} />
        <ConfluenceMeter label="TECHNICAL" value={summary.confluence.technical} />
        <ConfluenceMeter label="NEWS" value={summary.confluence.news} />
        <ConfluenceMeter label="RISK" value={summary.confluence.risk} />
      </div>

      <div className="panel">
        <div className="panel-title">LATEST DECISION</div>
        {summary.judge ? (
          <>
            <div className={`judge-call ${judgeCallClass(summary.judge.call)}`}>
              {summary.judge.call}
              <span className="judge-confidence">{fmtPct(summary.judge.confidence)}</span>
            </div>
            <div className="judge-reasoning">{summary.judge.reasoning}</div>
            <div className="judge-cycle">
              {summary.cycleId} · {fmtTime(summary.ranAt)}
            </div>
          </>
        ) : (
          <div className="panel-empty">No decision yet this cycle.</div>
        )}
        {summary.cycleError && <div className="panel-empty panel-empty-error" style={{ marginTop: 8 }}>{summary.cycleError}</div>}
      </div>

      {summary.portfolio && (
        <div className="panel">
          <div className="panel-title">PAPER PORTFOLIO</div>
          <div className="gold-price" style={{ fontSize: 20 }}>
            {summary.portfolio.equity.toFixed(2)}
            <span className="gold-price-currency">USD</span>
          </div>
          <div className="gold-price-meta">
            started {summary.portfolio.startingEquity.toFixed(2)} ·{" "}
            {summary.portfolio.position
              ? `${summary.portfolio.position.side} ${summary.portfolio.position.size.toFixed(3)} oz @ ${summary.portfolio.position.entryPrice.toFixed(2)}`
              : "flat"}
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [env, setEnv] = useState<HistoryResponse["env"] | null>(null);
  const [goldSummary, setGoldSummary] = useState<GoldDeskSummary | null>(null);
  const [activeDivision, setActiveDivision] = useState("trading");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/history", { cache: "no-store" });
      if (!res.ok) throw new Error(`/api/history returned ${res.status}`);
      const data: HistoryResponse = await res.json();
      setMessages(data.history);
      setEnv(data.env);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const loadGoldStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/gold-status", { cache: "no-store" });
      if (!res.ok) return;
      setGoldSummary(await res.json());
    } catch {
      // Live-data panel failing quietly is fine — it just keeps showing the last good read.
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadGoldStatus();
    const interval = setInterval(loadGoldStatus, GOLD_STATUS_POLL_MS);
    return () => clearInterval(interval);
  }, [loadGoldStatus]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, sending]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    const optimistic: ChatMessage = { id: `local-${Date.now()}`, role: "user", content: text, t: new Date().toISOString() };
    setMessages((m) => [...m, optimistic]);
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
        setInput(text);
      } else {
        setMessages((m) => [
          ...m,
          { id: `local-reply-${Date.now()}`, role: "assistant", content: data.reply, t: new Date().toISOString() },
        ]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setMessages((m) => m.filter((msg) => msg.id !== optimistic.id));
      setInput(text);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="topbar-brand">
          <span className="topbar-mark" />
          <div>
            <div className="topbar-name">AURUM</div>
            <div className="topbar-tag">SUJAN COMMAND CENTER</div>
          </div>
        </div>
        <div className="topbar-status">
          <span className="system-ready">
            <span className="pulse-dot" />
            SYSTEM READY
          </span>
          {env && !env.hasAnthropicKey && <Pill label="No Anthropic key" tone="critical" />}
          {env && !env.hasGoldDeskUrl && <Pill label="Gold desk not connected" tone="warn" />}
          {env && !env.persistentStore && <Pill label="No persistent memory" tone="warn" />}
          {env && env.hasGoldDeskUrl && <Pill label="Gold desk connected" tone="good" />}
        </div>
      </div>

      <div className="main-grid">
        <AgentRail active={activeDivision} onSelect={setActiveDivision} />

        {activeDivision === "trading" ? (
          <TradingPanels summary={goldSummary} />
        ) : (
          <div className="trading-col">
            <div className="division-heading">
              {DIVISIONS.find((d) => d.id === activeDivision)?.label.toUpperCase()}
            </div>
            <div className="panel">
              <div className="panel-empty">This division isn&rsquo;t built yet — check back once it&rsquo;s wired up.</div>
            </div>
          </div>
        )}

        <div className="center-col">
          <div className="core-wrap">
            <div className={`aurum-core ${sending ? "core-thinking" : ""}`}>
              <span className="core-ring" />
              <span className="core-ring core-ring-2" />
              <span className="core-ring core-ring-3" />
              <span className="core-spire" />
              <span className="core-glow" />
            </div>
          </div>

          <div className="messages" ref={scrollRef}>
            {messages.length === 0 && !error && (
              <div className="empty-state">
                Talk to Aurum. Ask what it can do, check in on the gold desk, or just say hello — it
                remembers what matters across conversations.
              </div>
            )}
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role === "user" ? "msg-user" : "msg-aurum"}`}>
                {m.role === "assistant" && <div className="msg-meta">AURUM</div>}
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="msg msg-aurum">
                <div className="msg-meta">AURUM</div>
                <span className="typing">
                  <span />
                  <span />
                  <span />
                </span>
              </div>
            )}
            {error && <div className="msg-error">Couldn&rsquo;t send that: {error}</div>}
          </div>

          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Message Aurum…"
              rows={1}
            />
            <button className="send-btn" onClick={send} disabled={sending || !input.trim()}>
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
