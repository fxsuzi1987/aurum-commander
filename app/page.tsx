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

function Pill({ label, tone }: { label: string; tone: string }) {
  return (
    <span className={`pill pill-${tone}`}>
      <span className="pill-dot" />
      {label}
    </span>
  );
}

export default function Page() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [env, setEnv] = useState<HistoryResponse["env"] | null>(null);
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

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

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
    <div className="shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark" />
          <div>
            <div className="brand-name">AURUM COMMANDER</div>
            <div className="brand-tag">Sujan&rsquo;s personal command center</div>
          </div>
        </div>
        <div className="status-pills">
          {env && !env.hasAnthropicKey && <Pill label="No Anthropic key" tone="critical" />}
          {env && !env.hasGoldDeskUrl && <Pill label="Gold desk not connected" tone="warn" />}
          {env && !env.persistentStore && <Pill label="No persistent memory" tone="warn" />}
          {env && env.hasGoldDeskUrl && <Pill label="Gold desk connected" tone="good" />}
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
            {m.role === "assistant" && <div className="msg-meta">Aurum</div>}
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="msg msg-aurum">
            <div className="msg-meta">Aurum</div>
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
  );
}
