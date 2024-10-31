// app/api/review-log/route.ts
import { NextResponse } from 'next/server';
import { createReviewLog } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      flashcardId, 
      rating, 
      reviewData: {
        stability,
        difficulty,
        elapsedDays,
        scheduledDays,
        responseTime
      }
    } = body;

    const result = await createReviewLog(
      session.user.id,
      flashcardId,
      rating,
      {
        stability,
        difficulty,
        elapsedDays,
        scheduledDays,
        responseTime
      }
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error creating review log:', error);
    return NextResponse.json(
      { error: 'Failed to create review log' },
      { status: 500 }
    );
  }
}