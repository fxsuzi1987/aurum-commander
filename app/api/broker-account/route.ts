import { NextResponse } from "next/server";
import { getMockBroker } from "@/lib/broker/mock-adapter";

// Demo account snapshot for the bottom stats bar — always the mock broker,
// never a real one. Named broker-account (not "account") to make it
// unambiguous in the route list that this is the DEMO/PAPER broker path.
export const dynamic = "force-dynamic";

export async function GET() {
  const broker = getMockBroker();
  if (!broker.isConnected()) await broker.connect();
  const [account, positions] = await Promise.all([broker.getAccount(), broker.getPositions()]);
  return NextResponse.json({ account, positions, mode: "demo" }, { headers: { "Cache-Control": "no-store" } });
}
