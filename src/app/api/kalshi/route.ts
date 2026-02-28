import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const KALSHI_API = 'https://api.elections.kalshi.com';
const API_KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || '';

// Auto-calibrate clock offset
let clockOffset = 0;
let lastCalibration = 0;

async function calibrateClock() {
  // Only calibrate every 5 minutes
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
      console.log(`Clock calibrated: offset = ${clockOffset}s`);
    }
  } catch (e) {
    console.log('Clock calibration failed, using offset 0');
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

async function kalshiRequest(method: string, path: string, body?: any) {
  await calibrateClock();
  
  const url = `${KALSHI_API}${path}`;
  const headers = getHeaders(method, path);
  
  const options: RequestInit = {
    method,
    headers,
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  const res = await fetch(url, options);
  return res.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'balance';
  
  let path: string;
  switch (endpoint) {
    case 'balance':
      path = '/trade-api/v2/portfolio/balance';
      break;
    case 'positions':
      path = '/trade-api/v2/portfolio/positions';
      break;
    case 'orders':
      path = '/trade-api/v2/portfolio/orders';
      break;
    default:
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }
  
  try {
    const data = await kalshiRequest('GET', path);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kalshi API error:', error);
    return NextResponse.json({ error: 'API request failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { action, ...params } = body;
  
  if (action === 'order') {
    const { ticker, side, count, price, type = 'limit' } = params;
    
    const orderData: any = {
      ticker,
      side,
      count,
      type,
    };
    
    if (type === 'limit') {
      orderData.yes_price = side === 'yes' ? price : (100 - price);
    }
    
    try {
      const data = await kalshiRequest('POST', '/trade-api/v2/portfolio/orders', orderData);
      return NextResponse.json(data);
    } catch (error) {
      console.error('Kalshi order error:', error);
      return NextResponse.json({ error: 'Order failed' }, { status: 500 });
    }
  }
  
  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  
  if (!orderId) {
    return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
  }
  
  try {
    const data = await kalshiRequest('DELETE', `/trade-api/v2/portfolio/orders/${orderId}`);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kalshi cancel error:', error);
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 });
  }
}
