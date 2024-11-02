import { NextResponse } from 'next/server';
import { getTranslation } from '@/lib/huggingface';
import { RateLimiter } from '@/lib/rate-limiter';
import { getServerSession } from 'next-auth';
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized', remaining: 0 },
        { status: 401 }
      );
    }

    const rateLimitStatus = await RateLimiter.getRemainingTranslations(session.user.id);

    return NextResponse.json({
      remaining: rateLimitStatus.remaining,
      isLimited: rateLimitStatus.isLimited,
      message: rateLimitStatus.message,
      resetIn: rateLimitStatus.resetIn
    });
  } catch (error) {
    console.error('Error checking translation limit:', error);
    return NextResponse.json(
      { error: 'Failed to check translation limit', remaining: 0 },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const rateLimitCheck = await RateLimiter.checkTranslationLimit(session.user.id);
    if (rateLimitCheck.isLimited) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          message: rateLimitCheck.message,
          resetIn: rateLimitCheck.resetIn
        },
        { status: 429 }
      );
    }

    const { text, sourceLang, targetLang } = await request.json();

    if (!text || !sourceLang || !targetLang) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await getTranslation(
      text,
      sourceLang,
      targetLang,
      process.env.HUGGINGFACE_API_TOKEN!
    );

    const remainingTranslations = await RateLimiter.getRemainingTranslations(session.user.id);

    return NextResponse.json({
      ...result,
      remaining: remainingTranslations.remaining
    });

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