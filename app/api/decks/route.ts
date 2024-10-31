import { NextResponse } from 'next/server';
import { getDecks, createDeck } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  try {
    const decks = await getDecks(userId);
    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch decks' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // First get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' }, 
        { status: 400 }
      );
    }

    const newDeck = await createDeck(session.user.id, title, description || '');
    return NextResponse.json(newDeck);
    
  } catch (error) {
    console.error('Error in POST /api/decks:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to create deck',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
}