import { NextResponse } from 'next/server';
import { getFlashcards, createFlashcard } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get('deckId');

  if (!deckId) {
    return NextResponse.json({ error: 'DeckId is required' }, { status: 400 });
  }

  const flashcards = await getFlashcards(deckId);
  return NextResponse.json(flashcards);
}

export async function POST(request: Request) {
  const { deckId, front, back } = await request.json();

  if (!deckId || !front || !back) {
    return NextResponse.json({ error: 'DeckId, front, and back are required' }, { status: 400 });
  }

  const newFlashcard = await createFlashcard(deckId, front, back);
  return NextResponse.json(newFlashcard);
}