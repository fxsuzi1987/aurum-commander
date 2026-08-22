// News/economic-calendar lockout module. Phase 1 ships the types and a
// small set of clearly-labeled demo events — a real economic calendar feed
// (ForexFactory, TradingEconomics, etc.) is a later phase and would need
// its own API key wired through an env var, never hardcoded.

export interface NewsEvent {
  id: string;
  title: string;
  impact: "high" | "medium" | "low";
  scheduledAt: string; // ISO
  isLive: boolean; // always false until a real calendar feed is connected
}

export interface NewsLockoutConfig {
  minutesBefore: number;
  minutesAfter: number;
}

export const DEFAULT_NEWS_LOCKOUT: NewsLockoutConfig = {
  minutesBefore: 15,
  minutesAfter: 15,
};

export function isInLockout(events: NewsEvent[], config: NewsLockoutConfig, nowMs: number): NewsEvent | null {
  for (const event of events) {
    const t = new Date(event.scheduledAt).getTime();
    const start = t - config.minutesBefore * 60000;
    const end = t + config.minutesAfter * 60000;
    if (nowMs >= start && nowMs <= end) return event;
  }
  return null;
}
