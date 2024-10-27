import { NextResponse } from 'next/server';
import { createStudySession } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, cardsStudied, startTime, endTime } = body;

    if (!userId || !cardsStudied || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await createStudySession(
      userId,
      cardsStudied,
      new Date(startTime),
      new Date(endTime)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error creating study session:', error);
    return NextResponse.json(
      { error: 'Failed to create study session' },
      { status: 500 }
    );
  }
}