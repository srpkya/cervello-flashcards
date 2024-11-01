// app/api/flashcards/route.ts
import { NextResponse } from 'next/server';
import { getFlashcards, createFlashcard } from '@/lib/db';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { deck, flashcard } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const createFlashcardSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required"),
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required")
});

export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get deck ID from query params
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return NextResponse.json(
        { error: 'DeckId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // First verify the deck exists and belongs to the user
    const deckExists = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId))
      .get();

    if (!deckExists) {
      return NextResponse.json(
        { error: `Deck ${deckId} not found` },
        { status: 404 }
      );
    }

    if (deckExists.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this deck' },
        { status: 403 }
      );
    }

    // Fetch flashcards
    const flashcards = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, deckId));

    // Return the flashcards
    return NextResponse.json(flashcards);

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { deckId, front, back } = await request.json();

    if (!deckId || !front || !back) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newFlashcard = await createFlashcard(deckId, front, back);
    return NextResponse.json(newFlashcard);

  } catch (error) {
    console.error('Error creating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to create flashcard' },
      { status: 500 }
    );
  }
}