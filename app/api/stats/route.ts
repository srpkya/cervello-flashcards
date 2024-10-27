import { NextResponse } from 'next/server';
import { getStudyStats } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  try {
    const stats = await getStudyStats(userId);
    console.log('API stats response:', stats); 
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    if (error instanceof Error && error.message.includes('connect')) {
      return NextResponse.json(
        { error: 'Database connection error. Please try again later.' },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch stats. Please try again.' },
      { status: 500 }
    );
  }
}