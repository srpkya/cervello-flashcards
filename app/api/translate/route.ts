// app/api/translate/route.ts
import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { headers } from 'next/headers';
import { getTranslation, isLanguagePairSupported } from '@/lib/huggingface';
import { z } from 'zod';

// Validation schema
const translationSchema = z.object({
  text: z.string().min(1).max(500),
  sourceLang: z.string().length(2),
  targetLang: z.string().length(2)
});

export async function POST(request: Request) {
  try {
    const apiToken = process.env.HUGGINGFACE_API_TOKEN;
    
    if (!apiToken) {
      console.error('Missing Hugging Face API token');
      return NextResponse.json(
        { error: 'Service configuration error' },
        { status: 500 }
      );
    }

    const forwardedFor = headers().get('x-forwarded-for');
    const ip = forwardedFor?.split(',')[0] || 'unknown';
    
    if (RateLimiter.isRateLimited(ip)) {
      const resetTime = RateLimiter.getResetTime(ip);
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime },
        { status: 429 }
      );
    }

    const body = await request.json();
    
    const validatedData = translationSchema.parse(body);
    const { text, sourceLang, targetLang } = validatedData;

    if (!isLanguagePairSupported(sourceLang, targetLang)) {
      return NextResponse.json(
        { error: 'Unsupported language pair' },
        { status: 400 }
      );
    }

    const result = await getTranslation(text, sourceLang, targetLang, apiToken);
    
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Remaining': RateLimiter.getRemainingRequests(ip).toString(),
        'X-RateLimit-Reset': RateLimiter.getResetTime(ip)?.toString() || '',
      }
    });

  } catch (error) {
    console.error('Translation API error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Translation service error. Please try again.' },
      { status: 500 }
    );
  }
}