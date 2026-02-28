import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KALSHI_API = 'https://api.elections.kalshi.com';
const API_KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || '';
const CLOCK_OFFSET = parseInt(process.env.KALSHI_CLOCK_OFFSET || '-3560');

function createSignature(timestamp: string, method: string, path: string): string {
  const pathWithoutQuery = path.split('?')[0];
  const message = `${timestamp}${method}${pathWithoutQuery}`;
  
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  sign.end();
  
  const signature = sign.sign({
    key: PRIVATE_KEY,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  
  return signature.toString('base64');
}

function getHeaders(method: string, path: string): Record<string, string> {
  const timestamp = String(Math.floor((Date.now() / 1000 + CLOCK_OFFSET) * 1000));
  const signature = createSignature(timestamp, method, path);
  
  return {
    'KALSHI-ACCESS-KEY': API_KEY_ID,
    'KALSHI-ACCESS-SIGNATURE': signature,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q') || 'btc';
  const status = searchParams.get('status') || 'open';
  
  try {
    // Get all markets and filter
    const path = `/trade-api/v2/markets?status=${status}&limit=500`;
    const url = `${KALSHI_API}${path}`;
    const headers = getHeaders('GET', path);
    
    const res = await fetch(url, { headers, cache: 'no-store' });
    const data = await res.json();
    
    const queryLower = query.toLowerCase();
    const matches = data.markets?.filter((m: any) => 
      m.ticker?.toLowerCase().includes(queryLower) ||
      m.title?.toLowerCase().includes(queryLower) ||
      m.subtitle?.toLowerCase().includes(queryLower) ||
      m.event_ticker?.toLowerCase().includes(queryLower)
    ) || [];
    
    // Also get events for context
    const eventsPath = `/trade-api/v2/events?status=${status}&limit=100`;
    const eventsUrl = `${KALSHI_API}${eventsPath}`;
    const eventsHeaders = getHeaders('GET', eventsPath);
    const eventsRes = await fetch(eventsUrl, { headers: eventsHeaders, cache: 'no-store' });
    const eventsData = await eventsRes.json();
    
    const eventMatches = eventsData.events?.filter((e: any) =>
      e.event_ticker?.toLowerCase().includes(queryLower) ||
      e.title?.toLowerCase().includes(queryLower) ||
      e.category?.toLowerCase().includes(queryLower)
    ) || [];
    
    return NextResponse.json({
      success: true,
      query,
      markets: matches.map((m: any) => ({
        ticker: m.ticker,
        event_ticker: m.event_ticker,
        title: m.title,
        subtitle: m.subtitle,
        yes_bid: m.yes_bid,
        yes_ask: m.yes_ask,
        volume: m.volume,
        close_time: m.close_time,
        status: m.status
      })),
      marketCount: matches.length,
      events: eventMatches.map((e: any) => ({
        event_ticker: e.event_ticker,
        title: e.title,
        category: e.category,
        status: e.status
      })),
      eventCount: eventMatches.length,
      totalMarketsScanned: data.markets?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
