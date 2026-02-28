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

async function kalshiFetch(path: string) {
  const url = `${KALSHI_API}${path}`;
  const headers = getHeaders('GET', path);
  const res = await fetch(url, { headers, cache: 'no-store' });
  return res.json();
}

export async function GET() {
  try {
    // Search for BTC/crypto related markets
    const marketsPath = '/trade-api/v2/markets?status=open&limit=200';
    const markets = await kalshiFetch(marketsPath);
    
    // Filter for BTC-related markets
    const btcMarkets = markets.markets?.filter((m: any) => 
      m.ticker?.toUpperCase().includes('BTC') || 
      m.ticker?.toUpperCase().includes('BITCOIN') ||
      m.title?.toLowerCase().includes('bitcoin') ||
      m.event_ticker?.toUpperCase().includes('BTC')
    ) || [];
    
    // Fetch Coinbase price for comparison
    const coinbaseRes = await fetch('https://api.coinbase.com/v2/prices/BTC-USD/spot');
    const coinbaseData = await coinbaseRes.json();
    const btcPrice = parseFloat(coinbaseData.data.amount);
    
    // Calculate current bracket
    const bracketSize = 250;
    const currentBracket = Math.floor(btcPrice / bracketSize) * bracketSize;
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      btcPrice,
      currentBracket: `$${currentBracket.toLocaleString()}-${(currentBracket + bracketSize).toLocaleString()}`,
      distToLower: btcPrice - currentBracket,
      distToUpper: (currentBracket + bracketSize) - btcPrice,
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
      totalMarketsScanned: markets.markets?.length || 0
    });
  } catch (error: any) {
    console.error('BTC brackets API error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
