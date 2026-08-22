import type Anthropic from "@anthropic-ai/sdk";
import { runChatTurn, runMemoryExtraction, type SimpleMessage } from "./llm";
import { loadHistory, loadMemory, pushMessage, pushMemory } from "./store";
import { checkGoldDeskStatus, hasGoldDeskUrl, getTradeSetupText, hasRealTradeSetupData } from "./specialists";
import { HISTORY_WINDOW, MEMORY_WINDOW } from "./config";
import type { ChatMessage } from "./types";

const TOOLS: Anthropic.Tool[] = [
  {
    name: "check_gold_desk_status",
    description:
      "Check the live status of the Obsidian Desk gold (XAU/USD) paper-trading pipeline — its latest " +
      "cycle, current paper position, paper equity, and the most recent Judge decision. This is the " +
      "only real specialist currently connected. It is PAPER TRADING ONLY; there is no real broker or " +
      "exchange connection and this tool can never place, modify, or cancel a real trade.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "get_trade_setup",
    description:
      "Get a rule-based BUY/SELL trade setup with entry, stop loss, and take profit for gold (XAUUSD) or a US " +
      "stock index (S&P 500, NASDAQ, Dow) — computed deterministically from real price data (EMA trend, ATR " +
      "volatility, recent swing structure), never invented. Can return NO_SETUP if there's no clean trend right " +
      "now. This is technical analysis, not financial advice, and requires real market data to be connected.",
    input_schema: {
      type: "object",
      properties: {
        symbol: {
          type: "string",
          description: "Which market: GOLD, S&P500, NASDAQ, or DOW.",
          enum: ["GOLD", "S&P500", "NASDAQ", "DOW"],
        },
      },
      required: ["symbol"],
    },
  },
];

async function runTool(name: string, input: unknown): Promise<string> {
  if (name === "check_gold_desk_status") return checkGoldDeskStatus();
  if (name === "get_trade_setup") {
    const symbol = input && typeof input === "object" && "symbol" in input && typeof (input as { symbol: unknown }).symbol === "string"
      ? (input as { symbol: string }).symbol
      : "GOLD";
    return getTradeSetupText(symbol);
  }
  return `Unknown tool: ${name}`;
}

function buildSystemPrompt(memoryLines: string[]): string {
  const memorySection = memoryLines.length
    ? `Things you already know about Sujan from past conversations:\n${memoryLines.map((m) => `- ${m}`).join("\n")}`
    : "You don't have any remembered decisions or preferences from past conversations yet.";

  return [
    "You are Aurum, Sujan's personal Chief of Staff AI — the single front door to his personal AI " +
      "command center. You are not a generic chatbot: you follow a specific operating discipline.",
    "",
    "Who you work for: Sujan Sapkota, and only Sujan. This is a personal, single-user system.",
    "",
    "Your job each turn: understand what Sujan actually wants, pull in whatever context or specialist " +
      "reports you need, and give ONE clear answer or next action — not a menu of options unless he " +
      "asked for options.",
    "",
    "Specialists: you have the Obsidian Desk gold paper-trading pipeline (check_gold_desk_status) and, " +
      "when real market data is connected, a rule-based trade-setup engine for gold and US indices " +
      "(get_trade_setup) — it computes BUY/SELL/NO_SETUP with entry/stop-loss/take-profit deterministically " +
      "from real price data (EMA trend, ATR volatility, swing structure); you never invent or adjust those " +
      "numbers yourself, and you always pass along its NO_SETUP / not-connected / error responses honestly " +
      "instead of guessing a plausible-sounding trade. Every other specialist described in Sujan's blueprint " +
      "(Atlas/Shopify, Content Studio, Nexa, Paycheck God, the Learning agents, and the rest of the Trading " +
      "Council) is not built yet. If Sujan asks about one of those, say plainly that it isn't wired up yet " +
      "rather than pretending to check something you can't.",
    "",
    "Hard rules, no exceptions:",
    "- You can analyze, draft, explain, and recommend. You cannot execute anything real: no trades, no " +
      "broker or exchange connection of any kind, no payments or purchases, no sending messages on " +
      "Sujan's behalf, no publishing, no deleting anything, no changing credentials or account settings, " +
      "no deploying code. If a request would require one of those, say so and explain that it needs to " +
      "happen through a real approval flow that doesn't exist yet — never simulate having done it.",
    "- Always distinguish, out loud when it matters, between a fact you actually know, an inference " +
      "you're making, a proposal you're offering, and something that has actually been done. Don't blur " +
      "them together.",
    "- If a specialist tool fails or a source is unreachable, say so plainly. Never invent a plausible-" +
      "sounding result to fill the gap.",
    "- Use the minimum number of tool calls needed. Don't check the gold desk unless the question is " +
      "actually about it.",
    "- Keep replies conversational and concise — a few sentences, not a report, unless Sujan is asking " +
      "for something that genuinely needs more detail.",
    "",
    memorySection,
  ].join("\n");
}

export interface AurumTurnResult {
  reply: string;
  toolsUsed: string[];
  rememberedNote: string | null;
}

export async function runAurumTurn(userText: string): Promise<AurumTurnResult> {
  const [history, memory] = await Promise.all([loadHistory(HISTORY_WINDOW), loadMemory(MEMORY_WINDOW)]);

  const userMsg: ChatMessage = { id: cryptoId(), role: "user", content: userText, t: new Date().toISOString() };
  await pushMessage(userMsg);

  const simpleHistory: SimpleMessage[] = [...history, userMsg].map((m) => ({ role: m.role, content: m.content }));
  const system = buildSystemPrompt(memory.map((m) => m.text));
  const tools = TOOLS.filter((t) => {
    if (t.name === "check_gold_desk_status") return hasGoldDeskUrl();
    if (t.name === "get_trade_setup") return hasRealTradeSetupData();
    return true;
  });

  const { text, toolsUsed } = await runChatTurn(system, simpleHistory, tools, runTool);

  const aurumMsg: ChatMessage = { id: cryptoId(), role: "assistant", content: text, t: new Date().toISOString() };
  await pushMessage(aurumMsg);

  let rememberedNote: string | null = null;
  try {
    rememberedNote = await runMemoryExtraction(userText, text);
    if (rememberedNote) {
      await pushMemory({ id: cryptoId(), t: new Date().toISOString(), kind: "fact", text: rememberedNote });
    }
  } catch {
    // Memory extraction is a nice-to-have — never let it fail the whole turn.
  }

  return { reply: text, toolsUsed, rememberedNote };
}

function cryptoId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
