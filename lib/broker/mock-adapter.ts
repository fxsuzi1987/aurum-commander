import type { Account, BrokerAdapter, Order, PlaceOrderInput, Position, Quote } from "./types";

// Simulated broker for DEMO_MODE / PAPER_TRADING. Holds everything in
// memory (resets on cold start, same tradeoff as lib/store.ts's in-memory
// fallback) — no real money, no real orders, no network calls out to any
// exchange. This is the only BrokerAdapter this app ships with; a real one
// is a separate, explicit later phase.
const STARTING_BALANCE = 100000;

class MockBrokerAdapter implements BrokerAdapter {
  private connected = false;
  private balance = STARTING_BALANCE;
  private positions: Position[] = [];
  private orders: Order[] = [];
  private lastQuotes = new Map<string, Quote>();

  async connect(): Promise<void> {
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async getAccount(): Promise<Account> {
    const openPnl = this.positions.reduce((sum, p) => sum + p.pnl, 0);
    return {
      balance: this.balance,
      equity: this.balance + openPnl,
      currency: "USD",
      brokerConnected: this.connected,
    };
  }

  async getPositions(): Promise<Position[]> {
    return this.positions;
  }

  async getOrders(): Promise<Order[]> {
    return this.orders;
  }

  async getQuote(symbol: string): Promise<Quote> {
    const prev = this.lastQuotes.get(symbol);
    const base = prev ? (prev.bid + prev.ask) / 2 : basePriceFor(symbol);
    // Small simulated random walk so the DEMO panel isn't static.
    const drift = base * (Math.random() - 0.5) * 0.0006;
    const mid = base + drift;
    const spread = Math.max(mid * 0.00008, 0.01);
    const quote: Quote = {
      symbol,
      bid: round(mid - spread / 2),
      ask: round(mid + spread / 2),
      spread: round(spread),
      dailyHigh: round(Math.max(prev?.dailyHigh ?? mid, mid)),
      dailyLow: round(Math.min(prev?.dailyLow ?? mid, mid)),
      updatedAt: new Date().toISOString(),
    };
    this.lastQuotes.set(symbol, quote);
    return quote;
  }

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    const quote = await this.getQuote(input.symbol);
    const fillPrice = input.price ?? (input.side === "buy" ? quote.ask : quote.bid);
    const order: Order = {
      id: `demo-order-${Date.now()}-${Math.round(Math.random() * 1e6)}`,
      symbol: input.symbol,
      side: input.side,
      lotSize: input.lotSize,
      price: fillPrice,
      stopLoss: input.stopLoss ?? null,
      takeProfit: input.takeProfit ?? null,
      status: "filled",
      createdAt: new Date().toISOString(),
    };
    this.orders.unshift(order);
    this.positions.unshift({
      id: `demo-pos-${order.id}`,
      symbol: input.symbol,
      side: input.side,
      lotSize: input.lotSize,
      entryPrice: fillPrice,
      currentPrice: fillPrice,
      stopLoss: order.stopLoss,
      takeProfit: order.takeProfit,
      pnl: 0,
      openedAt: order.createdAt,
      strategy: input.strategy ?? "manual",
    });
    return order;
  }

  async modifyOrder(orderId: string, changes: Partial<Pick<Order, "stopLoss" | "takeProfit">>): Promise<Order> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error(`No such demo order: ${orderId}`);
    Object.assign(order, changes);
    return order;
  }

  async closePosition(positionId: string): Promise<void> {
    const pos = this.positions.find((p) => p.id === positionId);
    if (!pos) return;
    this.balance += pos.pnl;
    this.positions = this.positions.filter((p) => p.id !== positionId);
  }

  async closeAll(): Promise<void> {
    for (const pos of this.positions) this.balance += pos.pnl;
    this.positions = [];
  }
}

function basePriceFor(symbol: string): number {
  const known: Record<string, number> = {
    "S&P500": 6400,
    NASDAQ: 22500,
    DOWJONES: 43500,
    BTCUSD: 96000,
  };
  return known[symbol] ?? 100;
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

let instance: MockBrokerAdapter | null = null;
export function getMockBroker(): MockBrokerAdapter {
  if (!instance) instance = new MockBrokerAdapter();
  return instance;
}
