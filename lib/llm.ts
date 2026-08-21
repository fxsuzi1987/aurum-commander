import Anthropic from "@anthropic-ai/sdk";
import { CHAT_MODEL } from "./config";

let anthropic: Anthropic | null = null;
function getAnthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not set");
  }
  if (!anthropic) anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return anthropic;
}

export function hasAnthropicKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

export interface SimpleMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * One turn of the Aurum conversation, with a single optional tool
 * (check_gold_desk_status for now — more specialists get added here as
 * they come online, per the blueprint's "route specialists" step). If the
 * model calls the tool, we run it, feed the result back, and let the model
 * produce its final answer — the standard Anthropic tool-use loop.
 */
export async function runChatTurn(
  system: string,
  history: SimpleMessage[],
  tools: Anthropic.Tool[],
  runTool: (name: string, input: unknown) => Promise<string>
): Promise<{ text: string; toolsUsed: string[] }> {
  const client = getAnthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({ role: m.role, content: m.content }));
  const toolsUsed: string[] = [];

  for (let round = 0; round < 4; round++) {
    const resp = await client.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1000,
      system,
      messages,
      tools: tools.length ? tools : undefined,
    });

    const toolUses = resp.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
    if (resp.stop_reason !== "tool_use" || toolUses.length === 0) {
      const textBlock = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
      return { text: textBlock?.text ?? "", toolsUsed };
    }

    // Model wants to call one or more tools — run them and hand results back.
    messages.push({ role: "assistant", content: resp.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      toolsUsed.push(use.name);
      let result: string;
      try {
        result = await runTool(use.name, use.input);
      } catch (err) {
        result = `Tool "${use.name}" failed: ${err instanceof Error ? err.message : String(err)}`;
      }
      toolResults.push({ type: "tool_result", tool_use_id: use.id, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { text: "I got stuck calling tools too many times in a row — try rephrasing your question.", toolsUsed };
}

/** A small, cheap call used only for deciding whether an exchange is worth
 * remembering long-term. Same model as the main chat (no verified cheaper
 * model ID to fall back to yet) but capped to a tiny max_tokens so the
 * cost stays negligible. */
export async function runMemoryExtraction(userMsg: string, aurumReply: string): Promise<string | null> {
  const client = getAnthropic();
  const resp = await client.messages.create({
    model: CHAT_MODEL,
    max_tokens: 120,
    system:
      "You extract durable memory from one exchange in a personal-assistant conversation. " +
      "If the user stated a lasting preference, made a decision, shared a fact worth remembering " +
      "across future sessions, or left something open/unfinished, respond with ONE short sentence " +
      "capturing it (third person, e.g. \"Sujan prefers...\", \"Sujan decided...\"). " +
      "If nothing in this exchange is worth remembering long-term (small talk, a one-off question, " +
      "a status check), respond with exactly: NONE. Never explain your reasoning — output only the " +
      "sentence or NONE.",
    messages: [
      { role: "user", content: `User said: "${userMsg}"\n\nAssistant replied: "${aurumReply}"\n\nWorth remembering?` },
    ],
  });
  const block = resp.content.find((b): b is Anthropic.TextBlock => b.type === "text");
  const text = block?.text.trim() ?? "NONE";
  if (!text || text.toUpperCase().startsWith("NONE")) return null;
  return text;
}
