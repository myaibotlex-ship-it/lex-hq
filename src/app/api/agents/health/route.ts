import { NextRequest, NextResponse } from 'next/server';

interface Agent {
  id: string;
  name: string;
  emoji: string;
  model: string;
  status: 'online' | 'offline' | 'degraded';
}

const agents: Agent[] = [
  { id: 'scout', name: 'Scout', emoji: '🔍', model: 'ollama/qwen2.5:72b', status: 'online' },
  { id: 'closer', name: 'Closer', emoji: '🤝', model: 'ollama/qwen2.5:72b', status: 'online' },
  { id: 'voice', name: 'Voice', emoji: '📢', model: 'ollama/qwen2.5:72b', status: 'online' },
  { id: 'numbers', name: 'Numbers', emoji: '📊', model: 'kimi/kimi-k2.5', status: 'online' },
  { id: 'shield', name: 'Shield', emoji: '🛡️', model: 'ollama/qwen2.5:72b', status: 'online' },
  { id: 'runner', name: 'Runner', emoji: '⚙️', model: 'ollama/qwen2.5:72b', status: 'online' },
  { id: 'coder', name: 'Coder', emoji: '💻', model: 'kimi/kimi-k2.5', status: 'online' },
  { id: 'chief', name: 'Chief', emoji: '⚡', model: 'kimi/kimi-k2.5', status: 'online' },
  { id: 'marketing', name: 'Marketing', emoji: '📣', model: 'ollama/qwen2.5:72b', status: 'online' },
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    return NextResponse.json({
      success: true,
      data: agents,
      count: agents.length,
      timestamp: new Date().toISOString(),
    }, { status: 200 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Agent health endpoint error:', errorMessage);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve agent health status',
      message: errorMessage,
    }, { status: 500 });
  }
}
