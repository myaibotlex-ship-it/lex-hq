import { NextResponse } from 'next/server';
import crypto from 'crypto';

const KALSHI_API = 'https://api.elections.kalshi.com';
const API_KEY_ID = process.env.KALSHI_API_KEY_ID || '';
const PRIVATE_KEY = process.env.KALSHI_PRIVATE_KEY || '';
const CLOCK_OFFSET = parseInt(process.env.KALSHI_CLOCK_OFFSET || '-3560');

function createSignature(timestamp: string, method: string, path: string): string {
  const message = `${timestamp}${method}${path}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(message);
  const signature = sign.sign({
    key: PRIVATE_KEY,
    padding: crypto.constants.RSA_PKCS1_PSS_PADDING,
    saltLength: crypto.constants.RSA_PSS_SALTLEN_DIGEST,
  });
  return signature.toString('base64');
}

export async function GET() {
  if (!API_KEY_ID || !PRIVATE_KEY) {
    return NextResponse.json({ error: 'Kalshi credentials not configured' }, { status: 500 });
  }

  const path = '/trade-api/v2/portfolio/balance';
  const timestamp = String(Math.floor((Date.now() / 1000 + CLOCK_OFFSET) * 1000));
  const signature = createSignature(timestamp, 'GET', path);

  try {
    const res = await fetch(`${KALSHI_API}${path}`, {
      headers: {
        'KALSHI-ACCESS-KEY': API_KEY_ID,
        'KALSHI-ACCESS-SIGNATURE': signature,
        'KALSHI-ACCESS-TIMESTAMP': timestamp,
      },
    });
    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Kalshi balance error:', error);
    return NextResponse.json({ error: 'Failed to fetch balance' }, { status: 500 });
  }
}
