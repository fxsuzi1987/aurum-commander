"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TopHeader } from "@/components/TopHeader";
import { AurumCore } from "@/components/AurumCore";
import { LiveMarketsPanel } from "@/components/LiveMarketsPanel";
import { MarketSentimentPanel } from "@/components/MarketSentimentPanel";
import { LiveTradingPanel } from "@/components/LiveTradingPanel";
import { AIInsightsPanel } from "@/components/AIInsightsPanel";
import { TradeSetupPanel } from "@/components/TradeSetupPanel";
import { VoiceCommandBar } from "@/components/VoiceCommandBar";
import { StatsBar } from "@/components/StatsBar";
import type { InstrumentQuote } from "@/lib/market-data/types";
import type { TradingAgentState } from "@/lib/strategy/types";

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

interface BrokerAccountResponse {
  account: { balance: number; equity: number; currency: string; brokerConnected: boolean };
  positions: unknown[];
  mode: string;
}

// All six modules stay "standby" honestly — none of the strategy/risk/
// execution phases (spec phases 3-12) are built yet. Marking them "active"
// would claim analysis this app isn't actually doing.
const AGENTS: TradingAgentState[] = [
  { id: "market-structure", label: "MARKET STRUCTURE", status: "standby", detail: "Not built yet — structure detection is a later phase." },
  { id: "trend-engine", label: "TREND ENGINE", status: "standby", detail: "Not built yet — trend/momentum scoring is a later phase." },
  { id: "risk-manager", label: "RISK MANAGER", status: "standby", detail: "Config defined, not yet enforced on any order." },
  { id: "trade-executor", label: "TRADE EXECUTOR", status: "standby", detail: "Demo broker can place orders, but nothing triggers it automatically yet." },
  { id: "news-watch", label: "NEWS WATCH", status: "standby", detail: "No economic calendar feed connected yet." },
  { id: "position-manager", label: "POSITION MANAGER", status: "standby", detail: "Tracks demo positions once the executor opens any." },
];

const POLL_MS = 20000;

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [env, setEnv] = useState<HistoryResponse["env"] | null>(null);
  const [goldSummary, setGoldSummary] = useState<GoldDeskSummary | null>(null);
  const [quotes, setQuotes] = useState<InstrumentQuote[]>([]);
  const [brokerAccount, setBrokerAccount] = useState<BrokerAccountResponse | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

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
      if (res.ok) setGoldSummary(await res.json());
    } catch {
      /* keep showing last good read */
    }
  }, []);

  const loadQuotes = useCallback(async () => {
    try {
      const res = await fetch("/api/market-quotes", { cache: "no-store" });
      if (res.ok) setQuotes((await res.json()).quotes ?? []);
    } catch {
      /* keep showing last good read */
    }
  }, []);

  const loadBrokerAccount = useCallback(async () => {
    try {
      const res = await fetch("/api/broker-account", { cache: "no-store" });
      if (res.ok) setBrokerAccount(await res.json());
    } catch {
      /* keep showing last good read */
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    loadGoldStatus();
    loadQuotes();
    loadBrokerAccount();
    const id = setInterval(() => {
      loadGoldStatus();
      loadQuotes();
      loadBrokerAccount();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [loadGoldStatus, loadQuotes, loadBrokerAccount]);

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

  const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
  const greeting = lastAssistant ? lastAssistant.content.slice(0, 90) + (lastAssistant.content.length > 90 ? "…" : "") : "Type below to talk to Aurum — voice arrives once this dashboard is live.";

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <TopHeader />

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
        <div className="mx-auto grid max-w-[1500px] grid-cols-1 gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)_minmax(0,340px)]">
          <div className="flex flex-col gap-4">
            <LiveMarketsPanel quotes={quotes} />
            <MarketSentimentPanel judge={goldSummary?.judge ?? null} updatedAt={goldSummary?.ranAt ?? null} />
          </div>

          <div className="flex flex-col items-center">
            <AurumCore thinking={sending} systemStatus="OPTIMAL" agents={AGENTS} />
            <div className="mt-2 w-full max-w-md">
              <VoiceCommandBar active={sending} greeting={greeting} />
            </div>

            <div className="mt-3 flex w-full max-w-lg flex-col gap-2">
              {messages.length > 0 || error ? (
                <div ref={scrollRef} className="max-h-56 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)]/50 p-3">
                  {messages.slice(-6).map((m) => (
                    <div key={m.id} className={`mb-2 text-[13px] leading-snug last:mb-0 ${m.role === "user" ? "text-[var(--color-blue-200)]" : "text-[var(--color-ink-300)]"}`}>
                      <span className="mr-1.5 font-mono text-[10px] tracking-wide text-[var(--color-ink-500)]">
                        {m.role === "user" ? "YOU" : "AURUM"}
                      </span>
                      {m.content}
                    </div>
                  ))}
                  {error && <div className="text-[12px] text-[var(--color-bear)]">Couldn&rsquo;t send that: {error}</div>}
                </div>
              ) : null}

              <div className="flex gap-2">
                <textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask Aurum anything…"
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-panel-2)] px-3 py-2.5 text-sm text-[var(--color-ink-100)] placeholder:text-[var(--color-ink-500)] focus:border-[var(--color-border-gold)] focus:outline-none"
                />
                <button
                  onClick={send}
                  disabled={sending || !input.trim()}
                  className="flex-shrink-0 rounded-lg bg-gradient-to-br from-[var(--color-gold-300)] to-[var(--color-gold-400)] px-5 text-sm font-semibold text-[#1a1206] transition-opacity disabled:opacity-40"
                >
                  Send
                </button>
              </div>

              {env && (!env.hasAnthropicKey || !env.hasGoldDeskUrl || !env.persistentStore) && (
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  {!env.hasAnthropicKey && <span className="tag-demo">No Anthropic key</span>}
                  {!env.hasGoldDeskUrl && <span className="tag-demo">Gold desk not connected</span>}
                  {!env.persistentStore && <span className="tag-demo">No persistent memory</span>}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <LiveTradingPanel gold={goldSummary?.gold ?? null} />
            <TradeSetupPanel />
            <AIInsightsPanel judge={goldSummary?.judge ?? null} connected={goldSummary?.connected ?? false} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 sm:px-6">
        <div className="mx-auto max-w-[1500px]">
          <StatsBar
            account={brokerAccount?.account ?? null}
            positionCount={brokerAccount?.positions.length ?? 0}
            onAskAurum={() => composerRef.current?.focus()}
          />
        </div>
      </div>
    </div>
  );
}
