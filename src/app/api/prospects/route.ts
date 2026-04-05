import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider');
  const providerType = searchParams.get('providerType');
  const confidence = searchParams.get('confidence');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  let query = supabase
    .from('prospect_research')
    .select('*, prospect_contacts(*)')
    .order('created_at', { ascending: false });

  if (provider) query = query.eq('current_provider', provider);
  if (providerType) query = query.eq('provider_type', providerType);
  if (confidence) query = query.eq('confidence', confidence);
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('company_name', `%${search}%`);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('prospect_research')
    .insert([body])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
