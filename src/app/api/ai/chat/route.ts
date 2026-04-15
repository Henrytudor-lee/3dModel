import { NextRequest, NextResponse } from 'next/server';
import { chatWithAI, MODELING_SYSTEM_PROMPT } from '@/lib/minimax';

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    // Use API key from environment variable
    const apiKey = process.env.MINIMAX_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'AI API key not configured. Please contact the administrator.' },
        { status: 500 }
      );
    }

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Build messages array with system prompt
    const apiMessages = [
      { role: 'system' as const, content: MODELING_SYSTEM_PROMPT },
      ...messages,
    ];

    const response = await chatWithAI(apiMessages, apiKey);

    return NextResponse.json({ response });
  } catch (error) {
    console.error('AI Chat error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
