import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const KALSHI_API = 'https://api.elections.kalshi.com';
const API_KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || '';
const CLOCK_OFFSET = parseInt(process.env.KALSHI_CLOCK_OFFSET || '-3560');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

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

// POST: Execute a trade
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { ticker, side, count, price, type = 'limit', reason, btcPrice } = body;
    
    if (!ticker || !side || !count) {
      return NextResponse.json({ error: 'Missing required fields: ticker, side, count' }, { status: 400 });
    }
    
    const path = '/trade-api/v2/portfolio/orders';
    const orderData: any = {
      ticker,
      side, // 'yes' or 'no'
      count,
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
      count,
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
