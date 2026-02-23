import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import os from 'os';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name } = await params;
    
    // Sanitize the agent name to prevent path traversal
    const sanitizedName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    
    // Construct the path to SOUL.md
    const homeDir = os.homedir();
    const soulPath = path.join(homeDir, '.clawdbot', 'agents', sanitizedName, 'agent', 'SOUL.md');
    
    // Check if file exists
    if (!existsSync(soulPath)) {
      return NextResponse.json(
        { error: 'SOUL.md not found', content: null },
        { status: 404 }
      );
    }
    
    // Read the file
    const content = await readFile(soulPath, 'utf-8');
    
    return NextResponse.json({ content });
  } catch (err) {
    console.error('Error reading SOUL.md:', err);
    return NextResponse.json(
      { error: 'Failed to read SOUL.md', content: null },
      { status: 500 }
    );
  }
}
