// Kalshi API client for The Bridge
// Note: Authenticated requests go through our API route to keep keys secure

const KALSHI_API = 'https://api.elections.kalshi.com';

export interface KalshiMarket {
  ticker: string;
  title: string;
  subtitle?: string;
  status: string;
  yes_bid: number;
  yes_ask: number;
  no_bid: number;
  no_ask: number;
  volume: number;
  volume_24h: number;
  open_interest: number;
  last_price: number;
  expiration_time: string;
  close_time: string;
  event_ticker: string;
  category?: string;
}

export interface KalshiEvent {
  event_ticker: string;
  title: string;
  sub_title?: string;
  category: string;
  series_ticker: string;
  mutually_exclusive: boolean;
}

export interface KalshiPosition {
  ticker: string;
  market_ticker: string;
  position: number;
  market_exposure: number;
  realized_pnl: number;
  total_traded: number;
}

export interface KalshiBalance {
  balance: number;
  portfolio_value: number;
}

// Public endpoints (no auth needed)
export async function getMarkets(limit = 30): Promise<KalshiMarket[]> {
  const res = await fetch(`${KALSHI_API}/trade-api/v2/markets?limit=${limit}&status=open`);
  const data = await res.json();
  return data.markets || [];
}

export async function getMarketsByEvent(eventTicker: string): Promise<KalshiMarket[]> {
  const res = await fetch(`${KALSHI_API}/trade-api/v2/markets?event_ticker=${eventTicker}`);
  const data = await res.json();
  return data.markets || [];
}

export async function getMarketsBySeries(seriesTicker: string): Promise<KalshiMarket[]> {
  const res = await fetch(`${KALSHI_API}/trade-api/v2/markets?series_ticker=${seriesTicker}&limit=20`);
  const data = await res.json();
  return data.markets || [];
}

export async function getEvents(limit = 30): Promise<KalshiEvent[]> {
  const res = await fetch(`${KALSHI_API}/trade-api/v2/events?limit=${limit}&status=open`);
  const data = await res.json();
  return data.events || [];
}

export async function getSeries(): Promise<any[]> {
  const res = await fetch(`${KALSHI_API}/trade-api/v2/series`);
  const data = await res.json();
  return data.series || [];
}

// Authenticated endpoints (go through our API route)
export async function getBalance(): Promise<KalshiBalance> {
  const res = await fetch('/api/kalshi/balance');
  return res.json();
}

export async function getPositions(): Promise<KalshiPosition[]> {
  const res = await fetch('/api/kalshi/positions');
  const data = await res.json();
  return data.market_positions || [];
}

export async function getOrders(): Promise<any[]> {
  const res = await fetch('/api/kalshi/orders');
  const data = await res.json();
  return data.orders || [];
}

export async function placeOrder(
  ticker: string,
  side: 'yes' | 'no',
  count: number,
  price: number,
  type: 'limit' | 'market' = 'limit'
): Promise<any> {
  const res = await fetch('/api/kalshi/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ticker, side, count, price, type }),
  });
  return res.json();
}

export async function cancelOrder(orderId: string): Promise<any> {
  const res = await fetch(`/api/kalshi/order/${orderId}`, {
    method: 'DELETE',
  });
  return res.json();
}

// Utility functions
export function formatPrice(cents: number): string {
  return `${cents}¢`;
}

export function formatProbability(cents: number): string {
  return `${cents}%`;
}

export function formatVolume(vol: number): string {
  if (vol >= 1000000) return `$${(vol / 1000000).toFixed(1)}M`;
  if (vol >= 1000) return `$${(vol / 1000).toFixed(1)}K`;
  return `$${vol}`;
}

export function getMidPrice(market: KalshiMarket): number {
  if (market.yes_bid && market.yes_ask) {
    return Math.round((market.yes_bid + market.yes_ask) / 2);
  }
  return market.yes_bid || market.yes_ask || market.last_price || 0;
}
