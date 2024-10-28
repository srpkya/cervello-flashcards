import { NextResponse } from 'next/server';
import { RateLimiter } from '@/lib/rate-limiter';
import { ErrorHandler, TranslationError } from '@/lib/error-handler';
import { headers } from 'next/headers';
import { getTranslation, supportedLanguages } from '@/lib/huggingface';
import { Language } from '@/lib/types';
import { createFlashcard } from '@/lib/db';

export async function POST(request: Request) {
  try {
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
    const { text, sourceLang, targetLang, deckId } = body;

    const supportedLanguageCodes = new Set(
      supportedLanguages.map((lang: Language) => lang.code)
    );

    if (!text?.trim()) {
      throw new TranslationError('Text is required', 400);
    }

    if (!sourceLang || !targetLang) {
      throw new TranslationError('Source and target languages are required', 400);
    }

    if (!supportedLanguageCodes.has(sourceLang) || !supportedLanguageCodes.has(targetLang)) {
      throw new TranslationError('Unsupported language pair', 400);
    }

    const translation = await getTranslation(text, sourceLang, targetLang);

    if (deckId) {
      const newFlashcard = await createFlashcard(
        deckId, 
        translation.source, 
        translation.target   
      );
      console.log('Created flashcard:', newFlashcard);
    }
    
    const remaining = RateLimiter.getRemainingRequests(ip);
    const resetTime = RateLimiter.getResetTime(ip);

    return NextResponse.json(translation, {
      headers: {
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': resetTime?.toString() || '',
      }
    });

  } catch (error) {
    const { error: errorMessage, statusCode, context } = await ErrorHandler.handle(error);
    
    await ErrorHandler.logError(error, {
      path: '/api/translate',
      ...context
    });

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}