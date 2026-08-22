// Broker abstraction. Nothing in this file talks to a real broker — Phase 1
// ships MockBrokerAdapter only (see mock-adapter.ts). A real implementation
// is a later, deliberate phase: it must read credentials from environment
// variables, never from frontend code, and the app must default to
// DEMO_MODE with LIVE_TRADING requiring explicit, separate activation.

export type OrderSide = "buy" | "sell";

export interface Quote {
  symbol: string;
  bid: number;
  ask: number;
  spread: number;
  dailyHigh: number;
  dailyLow: number;
  updatedAt: string; // ISO
}

export interface Position {
  id: string;
  symbol: string;
  side: OrderSide;
  lotSize: number;
  entryPrice: number;
  currentPrice: number;
  stopLoss: number | null;
  takeProfit: number | null;
  pnl: number;
  openedAt: string; // ISO
  strategy: string;
}

export interface Order {
  id: string;
  symbol: string;
  side: OrderSide;
  lotSize: number;
  price: number | null; // null = market order
  stopLoss: number | null;
  takeProfit: number | null;
  status: "pending" | "filled" | "cancelled" | "rejected";
  createdAt: string; // ISO
}

export interface Account {
  balance: number;
  equity: number;
  currency: string;
  brokerConnected: boolean;
}

export interface PlaceOrderInput {
  symbol: string;
  side: OrderSide;
  lotSize: number;
  price?: number | null;
  stopLoss?: number | null;
  takeProfit?: number | null;
  strategy?: string;
}

/**
 * Every broker integration — mock or real — implements this. The dashboard
 * and execution engine only ever talk to this interface, never to a
 * specific broker's SDK directly.
 */
export interface BrokerAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getAccount(): Promise<Account>;
  getPositions(): Promise<Position[]>;
  getOrders(): Promise<Order[]>;
  getQuote(symbol: string): Promise<Quote>;
  placeOrder(order: PlaceOrderInput): Promise<Order>;
  modifyOrder(orderId: string, changes: Partial<Pick<Order, "stopLoss" | "takeProfit">>): Promise<Order>;
  closePosition(positionId: string): Promise<void>;
  closeAll(): Promise<void>;
}
