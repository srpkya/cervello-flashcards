import { NextResponse } from 'next/server';
import { getDecks, createDeck } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  const decks = await getDecks(userId);
  return NextResponse.json(decks);
}

export async function POST(request: Request) {
  const { userId, title, description } = await request.json();

  if (!userId || !title) {
    return NextResponse.json({ error: 'UserId and title are required' }, { status: 400 });
  }

  const newDeck = await createDeck(userId, title, description || '');
  return NextResponse.json(newDeck);
}