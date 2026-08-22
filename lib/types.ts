export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  t: string; // ISO timestamp
}

export interface MemoryEntry {
  id: string;
  t: string; // ISO timestamp
  kind: "decision" | "preference" | "fact" | "open-item";
  text: string;
}

// Structured (non-prose) summary of the Obsidian Desk gold pipeline, for
// the dashboard's Trading panels. Kept separate from the plain-text
// summary the chat tool uses (checkGoldDeskStatus) — panels need real
// numbers to render bars and prices, not a sentence.
export interface GoldDeskSummary {
  connected: boolean;
  error: string | null;
  cycleId: string | null;
  ranAt: string | null;
  gold: { price: number; currency: string; updatedAt: string; source: string } | null;
  // Confidence (0-1) from each research agent, when the cycle produced one.
  // Used to drive the dashboard's Confluence meters — real numbers from
  // the actual pipeline, not decorative placeholders.
  confluence: { macro: number | null; technical: number | null; news: number | null; risk: number | null };
  judge: { call: string; confidence: number; reasoning: string } | null;
  portfolio: {
    equity: number;
    startingEquity: number;
    position: { side: string; size: number; entryPrice: number } | null;
  } | null;
  cycleError: string | null;
}
