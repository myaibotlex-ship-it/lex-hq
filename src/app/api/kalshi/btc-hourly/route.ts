import { NextResponse } from 'next/server';
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

function generateEventTicker(): string {
  // Generate the current hour's event ticker in format: KXBTCD-26FEB2812
  // Kalshi uses Eastern Time and the market is for the NEXT hour
  const now = new Date();
  
  // Convert to ET
  const etTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));
  
  // Round up to next hour
  etTime.setMinutes(0, 0, 0);
  etTime.setHours(etTime.getHours() + 1);
  
  const year = etTime.getFullYear().toString().slice(-2);
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const month = months[etTime.getMonth()];
  const day = etTime.getDate().toString().padStart(2, '0');
  const hour = etTime.getHours().toString().padStart(2, '0');
  
  return `KXBTCD-${year}${month}${day}${hour}`.toUpperCase();
}

export async function GET() {
  try {
    // Generate expected event ticker for current hour
    const eventTicker = generateEventTicker();
    
    // Try fetching by event_ticker
    const path = `/trade-api/v2/markets?event_ticker=${eventTicker}&limit=50`;
    const url = `${KALSHI_API}${path}`;
    const headers = getHeaders('GET', path);
    
    const res = await fetch(url, { headers, cache: 'no-store' });
    const data = await res.json();
    
    // Also try getting the event directly
    const eventPath = `/trade-api/v2/events/${eventTicker}`;
    const eventUrl = `${KALSHI_API}${eventPath}`;
    const eventHeaders = getHeaders('GET', eventPath);
    
    let eventData = null;
    try {
      const eventRes = await fetch(eventUrl, { headers: eventHeaders, cache: 'no-store' });
      eventData = await eventRes.json();
    } catch (e) {
      // Event might not exist
    }
    
    // Also search for any KXBTCD markets (any status)
    const searchPath = `/trade-api/v2/markets?limit=200`;
    const searchUrl = `${KALSHI_API}${searchPath}`;
    const searchHeaders = getHeaders('GET', searchPath);
    const searchRes = await fetch(searchUrl, { headers: searchHeaders, cache: 'no-store' });
    const searchData = await searchRes.json();
    
    const btcMarkets = searchData.markets?.filter((m: any) => 
      m.event_ticker?.toUpperCase().includes('KXBTCD') ||
      m.ticker?.toUpperCase().includes('KXBTCD')
    ) || [];
    
    // Get Coinbase price
    const coinbaseRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const coinbaseData = await coinbaseRes.json();
    const btcPrice = parseFloat(coinbaseData.data.amount);
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      expectedEventTicker: eventTicker,
      btcPrice,
      marketsForEvent: data.markets?.length || 0,
      markets: data.markets?.map((m: any) => ({
        ticker: m.ticker,
        subtitle: m.subtitle,
        yes_bid: m.yes_bid,
        yes_ask: m.yes_ask,
        no_bid: m.no_bid,
        no_ask: m.no_ask,
        volume: m.volume,
        close_time: m.close_time
      })) || [],
      event: eventData,
      allBtcMarkets: btcMarkets.slice(0, 10),
      debug: {
        searchedPath: path,
        totalMarketsFound: searchData.markets?.length || 0
      }
    });
  } catch (error: any) {
    console.error('BTC hourly API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
