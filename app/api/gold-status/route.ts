import { NextResponse } from "next/server";
import { fetchGoldDeskSummary } from "@/lib/specialists";

// Structured JSON for the dashboard's Trading panels — a thin wrapper
// around fetchGoldDeskSummary(). No-store: the dashboard should always see
// this cycle's real numbers, never a cached stale one.
export const dynamic = "force-dynamic";

export async function GET() {
  const summary = await fetchGoldDeskSummary();
  return NextResponse.json(summary, {
    headers: { "Cache-Control": "no-store" },
  });
}
