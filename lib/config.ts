// Model ID verified working in the sibling Obsidian Desk project against
// the real Anthropic API (Aug 2026). If it ever starts 404ing, check
// https://platform.claude.com/docs/en/about-claude/models/overview and
// update this one string.
export const CHAT_MODEL = "claude-sonnet-5";

// How many recent turns / memory entries to load into context each time.
// Keeps token cost bounded as the conversation history grows.
export const HISTORY_WINDOW = 24;
export const MEMORY_WINDOW = 40;

// Single-user app for now (Sujan only) — one shared conversation, not
// per-visitor sessions. If this ever needs multiple users, this is the
// key to namespace.
export const SESSION_ID = "sujan";
