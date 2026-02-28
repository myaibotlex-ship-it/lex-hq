import { NextResponse } from 'next/server';
import crypto from 'crypto';

const KALSHI_API_KEY_ID = process.env.KALSHI_API_KEY_ID!;
const KALSHI_PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY!;

function signRequest(method: string, path: string, timestamp: string): string {
  const message = timestamp + method + path;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  return sign.sign(KALSHI_PRIVATE_KEY, 'base64');
}

async function kalshiFetch(path: string) {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signRequest('GET', path, timestamp);
  
  const res = await fetch(`https://api.kalshi.com${path}`, {
    headers: {
      'KALSHI-ACCESS-KEY': KALSHI_API_KEY_ID,
      'KALSHI-ACCESS-SIGNATURE': signature,
      'KALSHI-ACCESS-TIMESTAMP': timestamp,
    },
    cache: 'no-store'
  });
  
  return res.json();
}

export async function GET() {
  try {
    // Get BTC bracket markets - search for KXBTC series
    const markets = await kalshiFetch('/trade-api/v2/markets?status=open&limit=200');
    
    // Filter for BTC-related markets
    const btcMarkets = markets.markets?.filter((m: any) => 
      m.ticker?.includes('BTC') || 
      m.title?.toLowerCase().includes('bitcoin') ||
      m.event_ticker?.includes('BTC')
    ) || [];
    
    // Also fetch current Coinbase price for comparison
    const coinbaseRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const coinbaseData = await coinbaseRes.json();
    const btcPrice = parseFloat(coinbaseData.data.amount);
    
    // Calculate which bracket BTC is in
    const bracketSize = 250;
    const currentBracket = Math.floor(btcPrice / bracketSize) * bracketSize;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      btcPrice,
      currentBracket: `$${currentBracket.toLocaleString()}-${(currentBracket + bracketSize).toLocaleString()}`,
      btcMarkets: btcMarkets.map((m: any) => ({
        ticker: m.ticker,
        title: m.title,
        subtitle: m.subtitle,
        yes_bid: m.yes_bid,
        yes_ask: m.yes_ask,
        no_bid: m.no_bid,
        no_ask: m.no_ask,
        volume: m.volume,
        close_time: m.close_time
      })),
      marketCount: btcMarkets.length,
      allMarketsCount: markets.markets?.length || 0
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
