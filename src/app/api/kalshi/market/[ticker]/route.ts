import { NextRequest, NextResponse } from 'next/server';

const KALSHI_API = 'https://api.elections.kalshi.com';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticker: string }> }
) {
  const { ticker } = await params;
  
  try {
    // Fetch market details
    const marketRes = await fetch(`${KALSHI_API}/trade-api/v2/markets/${ticker}`);
    const marketData = await marketRes.json();
    
    if (!marketData.market) {
      return NextResponse.json({ error: 'Market not found' }, { status: 404 });
    }
    
    // Fetch orderbook
    const orderbookRes = await fetch(`${KALSHI_API}/trade-api/v2/markets/${ticker}/orderbook`);
    const orderbookData = await orderbookRes.json();
    
    // Fetch event details for context
    const eventTicker = marketData.market.event_ticker;
    let eventData = null;
    if (eventTicker) {
      const eventRes = await fetch(`${KALSHI_API}/trade-api/v2/events/${eventTicker}`);
      eventData = await eventRes.json();
    }
    
    // Fetch candlesticks for price history (last 30 days)
    let candlesticks = [];
    try {
      const endTs = Math.floor(Date.now() / 1000);
      const startTs = endTs - (30 * 24 * 60 * 60); // 30 days ago
      const candleRes = await fetch(
        `${KALSHI_API}/trade-api/v2/markets/${ticker}/candlesticks?start_ts=${startTs}&end_ts=${endTs}&period_interval=1440`
      );
      const candleData = await candleRes.json();
      candlesticks = candleData.candlesticks || [];
    } catch (e) {
      // Candlesticks may not be available for all markets
    }
    
    return NextResponse.json({
      market: marketData.market,
      orderbook: orderbookData.orderbook || { yes: [], no: [] },
      event: eventData?.event || null,
      candlesticks,
    });
  } catch (error) {
    console.error('Kalshi market fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch market data' }, { status: 500 });
  }
}
