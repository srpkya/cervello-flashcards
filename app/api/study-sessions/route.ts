import { NextResponse } from 'next/server';
import { createStudySession } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cardsStudied, startTime, endTime, correctCount, incorrectCount, averageTime } = body;

    if (!userId || !cardsStudied || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await createStudySession(
      userId,
      cardsStudied,
      new Date(startTime),
      new Date(endTime),
      correctCount || 0,
      incorrectCount || 0,
      averageTime || 0
    );

    // Return the created session data
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating study session:', error);
    return NextResponse.json(
      { error: 'Failed to create study session' },
      { status: 500 }
    );
  }
}