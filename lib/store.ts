import { Redis } from "@upstash/redis";
import type { ChatMessage, MemoryEntry } from "./types";
import { SESSION_ID } from "./config";

const HISTORY_KEY = `aurum:${SESSION_ID}:history`; // list, newest first
const MEMORY_KEY = `aurum:${SESSION_ID}:memory`; // list, newest first
const TV_SIGNALS_KEY = `aurum:${SESSION_ID}:tv-signals`; // hash, symbol -> latest signal JSON
const MAX_HISTORY = 200;
const MAX_MEMORY = 300;

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  // Accept either naming convention: UPSTASH_REDIS_REST_* (what Upstash's
  // own docs use, and what this app's .env.example documents) or
  // KV_REST_API_* (what Vercel's own "Upstash for Redis" marketplace
  // integration names them by default when connected through the Vercel
  // dashboard). Same REST protocol either way.
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  redis = new Redis({ url, token });
  return redis;
}

// In-memory fallback so local `next dev` works before Upstash is configured.
// Resets on every cold start in a real serverless deployment — set
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN for real persistence.
const mem: { history: ChatMessage[]; memory: MemoryEntry[]; tvSignals: Record<string, TradingViewSignal> } = {
  history: [],
  memory: [],
  tvSignals: {},
};

// A signal received from the user's own TradingView Pine Script alert
// webhook (see app/api/webhooks/tradingview/route.ts). This is NOT
// computed by Aurum — it's whatever the user's own TradingView
// strategy/indicator sent. Stored and shown as-is, clearly attributed.
export interface TradingViewSignal {
  symbol: string;
  side: string; // whatever TradingView sent, e.g. "BUY" / "SELL" / "LONG" / "SHORT"
  price: number | null;
  stopLoss: number | null;
  takeProfit: number | null;
  message: string | null;
  receivedAt: string; // ISO
}

export async function saveTradingViewSignal(signal: TradingViewSignal): Promise<void> {
  const r = getRedis();
  if (!r) {
    mem.tvSignals[signal.symbol] = signal;
    return;
  }
  await r.hset(TV_SIGNALS_KEY, { [signal.symbol]: JSON.stringify(signal) });
}

export async function loadTradingViewSignal(symbol: string): Promise<TradingViewSignal | null> {
  const r = getRedis();
  if (!r) return mem.tvSignals[symbol] ?? null;
  const raw = await r.hget<string>(TV_SIGNALS_KEY, symbol);
  if (!raw) return null;
  return typeof raw === "string" ? JSON.parse(raw) : (raw as unknown as TradingViewSignal);
}

export async function usingPersistentStore(): Promise<boolean> {
  return getRedis() !== null;
}

export async function pushMessage(msg: ChatMessage): Promise<void> {
  const r = getRedis();
  if (!r) {
    mem.history.unshift(msg);
    mem.history = mem.history.slice(0, MAX_HISTORY);
    return;
  }
  await r.lpush(HISTORY_KEY, JSON.stringify(msg));
  await r.ltrim(HISTORY_KEY, 0, MAX_HISTORY - 1);
}

/** Returns messages oldest-first (ready to feed straight into the model). */
export async function loadHistory(limit: number): Promise<ChatMessage[]> {
  const r = getRedis();
  let newestFirst: ChatMessage[];
  if (!r) {
    newestFirst = mem.history.slice(0, limit);
  } else {
    const raw = await r.lrange<string>(HISTORY_KEY, 0, limit - 1);
    newestFirst = raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s));
  }
  return newestFirst.slice().reverse();
}

export async function pushMemory(entry: MemoryEntry): Promise<void> {
  const r = getRedis();
  if (!r) {
    mem.memory.unshift(entry);
    mem.memory = mem.memory.slice(0, MAX_MEMORY);
    return;
  }
  await r.lpush(MEMORY_KEY, JSON.stringify(entry));
  await r.ltrim(MEMORY_KEY, 0, MAX_MEMORY - 1);
}

/** Returns memory entries oldest-first. */
export async function loadMemory(limit: number): Promise<MemoryEntry[]> {
  const r = getRedis();
  let newestFirst: MemoryEntry[];
  if (!r) {
    newestFirst = mem.memory.slice(0, limit);
  } else {
    const raw = await r.lrange<string>(MEMORY_KEY, 0, limit - 1);
    newestFirst = raw.map((s) => (typeof s === "string" ? JSON.parse(s) : s));
  }
  return newestFirst.slice().reverse();
}
