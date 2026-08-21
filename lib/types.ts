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
