import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET() {
  try {
    // Quick health check - just verify we can connect to Supabase
    const start = Date.now();
    const { error } = await supabase.from('agents').select('id').limit(1);
    const latency = Date.now() - start;

    if (error) {
      return NextResponse.json(
        { status: 'degraded', error: error.message, latency },
        { status: 503 }
      );
    }

    return NextResponse.json({
      status: 'operational',
      latency,
      timestamp: new Date().toISOString(),
      services: {
        database: 'operational',
        api: 'operational',
      }
    });
  } catch (err) {
    return NextResponse.json(
      { status: 'down', error: 'Health check failed' },
      { status: 503 }
    );
  }
}
