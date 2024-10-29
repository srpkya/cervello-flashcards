// app/api/flashcards/route.ts
import { NextResponse } from 'next/server';
import { getFlashcards, createFlashcard } from '@/lib/db';
import { z } from 'zod';

const createFlashcardSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required"),
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required")
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate request body
    const validatedData = createFlashcardSchema.parse(body);
    const { deckId, front, back } = validatedData;

    const newFlashcard = await createFlashcard(deckId, front, back);
    
    if (!newFlashcard) {
      throw new Error('Failed to create flashcard');
    }

    return NextResponse.json(newFlashcard);
  } catch (error) {
    console.error('Error creating flashcard:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deckId = searchParams.get('deckId');

  if (!deckId) {
    return NextResponse.json(
      { error: 'DeckId is required' },
      { status: 400 }
    );
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