import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const KALSHI_API = 'https://api.elections.kalshi.com';
const API_KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || '';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// === SAFEGUARDS ===
const COOLDOWN_MS = 60000; // 60 seconds between ANY trades
const MAX_POSITION_PCT = 0.02; // 2% of balance max per trade
const DEDUP_WINDOW_MS = 300000; // 5 minute dedup window for same ticker

// Auto-calibrate clock offset
let clockOffset = 0;
let lastCalibration = 0;

async function calibrateClock() {
  if (Date.now() - lastCalibration < 300000 && clockOffset !== 0) {
    return;
  }
  
  try {
    const res = await fetch(`${KALSHI_API}/trade-api/v2/exchange/status`);
    const serverTime = res.headers.get('date');
    if (serverTime) {
      const serverMs = new Date(serverTime).getTime();
      const localMs = Date.now();
      clockOffset = Math.floor((serverMs - localMs) / 1000);
      lastCalibration = Date.now();
    }
  } catch (e) {
    clockOffset = 0;
  }
}

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
  const timestamp = String(Math.floor((Date.now() / 1000 + clockOffset) * 1000));
  const signature = createSignature(timestamp, method, path);
  
  return {
    'KALSHI-ACCESS-KEY': API_KEY_ID,
    'KALSHI-ACCESS-SIGNATURE': signature,
    'KALSHI-ACCESS-TIMESTAMP': timestamp,
    'Content-Type': 'application/json',
  };
}

async function getBalance(): Promise<number> {
  try {
    await calibrateClock();
    const path = '/trade-api/v2/portfolio/balance';
    const headers = getHeaders('GET', path);
    const res = await fetch(`${KALSHI_API}${path}`, { headers });
    const data = await res.json();
    // Balance is in cents
    return (data.balance || 0) / 100;
  } catch (e) {
    return 0;
  }
}

async function checkCooldown(): Promise<{ blocked: boolean; waitSec?: number }> {
  // Check database for any trade in last 60 seconds
  const cutoff = new Date(Date.now() - COOLDOWN_MS).toISOString();
  const { data } = await supabase
    .from('kalshi_trades')
    .select('created_at')
    .eq('status', 'submitted')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: false })
    .limit(1);
  
  if (data && data.length > 0) {
    const lastTradeTime = new Date(data[0].created_at).getTime();
    const waitSec = Math.ceil((COOLDOWN_MS - (Date.now() - lastTradeTime)) / 1000);
    return { blocked: true, waitSec };
  }
  return { blocked: false };
}

async function checkDuplicate(ticker: string): Promise<boolean> {
  // Check database for recent trades on this specific ticker
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS).toISOString();
  const { data } = await supabase
    .from('kalshi_trades')
    .select('id')
    .eq('ticker', ticker)
    .eq('status', 'submitted')
    .gte('created_at', cutoff)
    .limit(1);
  
  return (data && data.length > 0);
}

// POST: Execute a trade (with safeguards)
export async function POST(request: NextRequest) {
  try {
    await calibrateClock();
    
    const body = await request.json();
    const { ticker, side, count, price, type = 'limit', reason, btcPrice, skipSafeguards = false } = body;
    
    if (!ticker || !side || !count) {
      return NextResponse.json({ error: 'Missing required fields: ticker, side, count' }, { status: 400 });
    }

    // === SAFEGUARD 1: Global cooldown (DB-based) ===
    if (!skipSafeguards) {
      const cooldown = await checkCooldown();
      if (cooldown.blocked) {
        return NextResponse.json({ 
          error: `Cooldown active. Wait ${cooldown.waitSec}s before next trade.`,
          blocked: 'cooldown',
          waitSec: cooldown.waitSec
        }, { status: 429 });
      }
    }

    // === SAFEGUARD 2: Deduplication (DB-based) ===
    if (!skipSafeguards) {
      const isDuplicate = await checkDuplicate(ticker);
      if (isDuplicate) {
        return NextResponse.json({ 
          error: `Already traded ${ticker} in last 5 minutes. Skipping duplicate.`,
          blocked: 'duplicate'
        }, { status: 429 });
      }
    }

    // === SAFEGUARD 3: Position sizing ===
    if (!skipSafeguards) {
      const balance = await getBalance();
      const tradeCost = (count * (price || 50)) / 100; // Estimate in dollars
      const maxTrade = balance * MAX_POSITION_PCT;
      
      if (tradeCost > maxTrade && balance > 0) {
        // Adjust count to fit within 2%
        const adjustedCount = Math.floor((maxTrade * 100) / (price || 50));
        if (adjustedCount < 1) {
          return NextResponse.json({ 
            error: `Trade too large. Balance: $${balance.toFixed(2)}, Max: $${maxTrade.toFixed(2)}`,
            blocked: 'position_size'
          }, { status: 400 });
        }
        // Use adjusted count
        body.count = adjustedCount;
      }
    }

    const path = '/trade-api/v2/portfolio/orders';
    const orderData: any = {
      ticker,
      side,
      count: body.count, // May have been adjusted
      type,
      action: 'buy',
    };
    
    if (type === 'limit' && price) {
      orderData.yes_price = side === 'yes' ? price : (100 - price);
    }
    
    const headers = getHeaders('POST', path);
    const res = await fetch(`${KALSHI_API}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData),
    });
    
    const result = await res.json();
    
    // Log trade to Supabase
    const tradeLog = {
      ticker,
      side,
      count: body.count,
      price,
      type,
      reason,
      btc_price: btcPrice,
      kalshi_response: result,
      status: result.order ? 'submitted' : 'failed',
      created_at: new Date().toISOString(),
    };
    
    await supabase.from('kalshi_trades').insert(tradeLog);
    
    return NextResponse.json({
      success: !!result.order,
      order: result.order,
      error: result.error,
      logged: true,
      safeguards: {
        cooldownMs: COOLDOWN_MS,
        maxPositionPct: MAX_POSITION_PCT,
        adjustedCount: body.count !== count ? body.count : undefined,
      }
    });
  } catch (error: any) {
    console.error('Trade error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

// GET: Fetch recent trades from our log
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('kalshi_trades')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    
    return NextResponse.json({
      success: true,
      trades: data,
    });
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}
