import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to_number, to_name, purpose } = body;

    if (!to_number) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // Normalize phone number
    let normalizedNumber = to_number.replace(/\D/g, '');
    if (normalizedNumber.length === 10) {
      normalizedNumber = '1' + normalizedNumber;
    }
    if (!normalizedNumber.startsWith('+')) {
      normalizedNumber = '+' + normalizedNumber;
    }

    // Call ElevenLabs API
    const elevenLabsResponse = await fetch(
      'https://api.elevenlabs.io/v1/convai/twilio/outbound-call',
      {
        method: 'POST',
        headers: {
          'xi-api-key': process.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_id: process.env.ELEVENLABS_AGENT_ID,
          agent_phone_number_id: process.env.ELEVENLABS_PHONE_NUMBER_ID,
          to_number: normalizedNumber,
        }),
      }
    );

    const elevenLabsData = await elevenLabsResponse.json();

    if (!elevenLabsResponse.ok) {
      console.error('ElevenLabs error:', elevenLabsData);
      return NextResponse.json(
        { error: elevenLabsData.detail || 'Failed to initiate call' },
        { status: elevenLabsResponse.status }
      );
    }

    // Log the call to Supabase
    const { data, error } = await supabase
      .from('calls')
      .insert({
        elevenlabs_call_id: elevenLabsData.call_id || elevenLabsData.id,
        to_number: normalizedNumber,
        to_name: to_name || null,
        purpose: purpose || null,
        status: 'initiated',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      // Call was initiated but logging failed - still return success
      return NextResponse.json({
        success: true,
        call_id: elevenLabsData.call_id || elevenLabsData.id,
        message: 'Call initiated (logging failed)',
      });
    }

    return NextResponse.json({
      success: true,
      call_id: elevenLabsData.call_id || elevenLabsData.id,
      db_record: data,
    });
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('calls')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('API error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
