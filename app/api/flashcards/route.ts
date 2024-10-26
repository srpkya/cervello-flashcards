import { NextResponse } from 'next/server';
import { getFlashcards, createFlashcard } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get('deckId');

  if (!deckId) {
    return NextResponse.json({ error: 'DeckId is required' }, { status: 400 });
  }

  try {
    const flashcards = await getFlashcards(deckId);
    return NextResponse.json(flashcards);
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { error: 'Failed to fetch flashcards' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { deckId, front, back } = await request.json();

    if (!deckId || !front || !back) {
      return NextResponse.json(
        { error: 'DeckId, front, and back are required' },
        { status: 400 }
      );
    }

    const newFlashcard = await createFlashcard(deckId, front, back);
    console.log('Created flashcard:', newFlashcard);
    return NextResponse.json(newFlashcard);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}