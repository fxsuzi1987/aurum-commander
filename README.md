# Aurum Commander

The first real piece of Sujan's personal AI command center — the "single
front door" chief-of-staff agent described in the blueprint. This is a
chat app: you talk to Aurum in one place, and Aurum calls out to whatever
real specialists exist behind the scenes rather than making you find and
open a separate agent yourself.

## What's real vs. not yet

| Piece | Status |
|---|---|
| Conversation with Claude | **Real** — every reply is a live Claude call |
| Memory across sessions | **Real** (when Redis is configured) — decisions, preferences, and facts worth keeping get extracted and remembered turn to turn |
| Gold desk check-in | **Real** (when `OBSIDIAN_DESK_URL` is set) — Aurum can call out to the Obsidian Desk app and report its live status, paper equity, position, and latest Judge call |
| Every other specialist in the blueprint (Atlas/Shopify, Content Studio, Nexa, Paycheck God, Learning agents, the rest of the Trading Council) | **Not built yet.** Aurum will say so plainly if you ask about one rather than pretending |
| Voice | **Not built** — this is text chat for now; voice is a bigger separate build |
| Any real action (trades, payments, purchases, sending messages, publishing, deleting, changing credentials, deploying code) | **Never** — Aurum can only analyze, draft, and recommend. Nothing here executes anything real |

## Running it locally

```
npm install
cp .env.example .env.local   # then paste in your ANTHROPIC_API_KEY
npm run dev
```
Open the URL it prints and start talking to Aurum.

## Getting it actually live

Same pattern as Obsidian Desk:

1. **Anthropic API key** — the same key from console.anthropic.com works
   fine here too (it's not tied to one project).
2. **GitHub** — holds this code.
3. **Vercel** — sign in with GitHub, "Add New Project", import this repo.
4. **Upstash** — a *separate* Redis database from the gold desk's (Create
   Database → Redis → REST API section), so Aurum's memory doesn't mix
   with the trading desk's state.

Then in Vercel → Settings → Environment Variables, add `ANTHROPIC_API_KEY`,
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, and optionally
`OBSIDIAN_DESK_URL` (the deployed gold desk's URL, no trailing slash) —
then redeploy.

## How memory works

Every message and reply is stored so the current conversation always has
full context. Separately, after each exchange a small extra model call
asks "was anything here worth remembering long-term?" — a stated
preference, a decision, an open item — and if so, one short sentence gets
saved to a running memory list that's loaded into every future
conversation's system prompt. Small talk and one-off questions don't get
remembered. This is a first-pass version of the blueprint's "Memory
Keeper" role, not the dedicated agent described there yet.

## How adding a new specialist works

Right now there's exactly one: `checkGoldDeskStatus()` in
`lib/specialists.ts`, exposed to Claude as the `check_gold_desk_status`
tool in `lib/aurum.ts`. Adding the next one (say, a future Atlas/Shopify
agent) means: write a function that calls that specialist and returns a
plain-text summary, add one tool entry pointing at it, and update the
system prompt's specialist list — the same shape every time, per the
blueprint's "fixed jobs, minimum agents used" principle.

## Honest limitations of this pass

- Single-user only — there's one shared conversation (Sujan's), not
  per-visitor sessions. That matches "personal-only scope" from the
  blueprint, but means this app should not be shared as a public link.
- No real approval flow exists yet. Aurum is instructed never to claim it
  executed a real action, but there's no separate Approval Guardian agent
  checking that — the boundary lives in the system prompt, not in
  independent code, which is weaker than the blueprint's own principle
  that "ordinary code controls execution and permissions." Worth
  hardening before this app is ever given any real tool that *can* take
  an action.
- Memory extraction is a single heuristic model call, not the structured
  Memory Keeper the blueprint describes — it can miss things worth
  keeping or occasionally keep something trivial.
- No voice, no Focus Mode presence UI, no full dashboard — this is the
  plain chat version of the front door the blueprint describes.
