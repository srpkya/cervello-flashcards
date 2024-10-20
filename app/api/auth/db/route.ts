import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { decks, flashcards } from '@/lib/schema';
import { eq } from 'drizzle-orm/expressions';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');
  const userId = searchParams.get('userId');

  const db = await getDb();

  if (action === 'getDecks' && userId) {
    const result = await db.select().from(decks).where(eq(decks.userId, userId));
    return NextResponse.json(result);
  }


  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { action, userId, title, description } = body;

  const db = await getDb();

  if (action === 'createDeck' && userId && title) {
    const newDeck = {
      id: crypto.randomUUID(), 
      userId: userId,
      title: title,
      description: description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.insert(decks).values(newDeck);
    return NextResponse.json({ ...newDeck, ...result });
  }


  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}