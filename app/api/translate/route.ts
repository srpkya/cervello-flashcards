// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { headers } from 'next/headers';
import { getTranslation } from '@/lib/huggingface';
import { z } from 'zod';

// Validation schema
const translationSchema = z.object({
  text: z.string().min(1).max(500),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2)
});

export async function POST(request: Request) {
  try {
    // Get the API token from environment variables
    const apiToken = process.env.HUGGINGFACE_API_TOKEN;
    
    if (!apiToken) {
      console.error('Missing Hugging Face API token');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { text, sourceLang, targetLang } = body;

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Pass the API token as the fourth argument
    const result = await getTranslation(text, sourceLang, targetLang, apiToken);
    return NextResponse.json(result);

  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Translation failed',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}