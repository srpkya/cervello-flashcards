// app/api/flashcards/route.ts
import { NextResponse } from 'next/server';
import { getFlashcards, createFlashcard } from '@/lib/db';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { getServerSession } from 'next-auth';
import { getDb } from '@/lib/db';
import { deck } from '@/lib/schema';
import { eq } from 'drizzle-orm';

const createFlashcardSchema = z.object({
  deckId: z.string().min(1, "Deck ID is required"),
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required")
});

export async function GET(request: Request) {
  try {
    // 1. Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // 2. Get deck ID from query params
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return NextResponse.json(
        { error: 'DeckId is required' },
        { status: 400 }
      );
    }

    // 3. Verify deck ownership
    const db = await getDb();
    const deckRecord = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId))
      .get();

    if (!deckRecord) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    if (deckRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this deck' },
        { status: 403 }
      );
    }

    // 4. Fetch flashcards with error handling
    const flashcards = await getFlashcards(deckId);
    
    if (!flashcards) {
      return NextResponse.json(
        { error: 'Failed to fetch flashcards' },
        { status: 500 }
      );
    }

    // 5. Return the flashcards with proper type conversion
    return NextResponse.json(flashcards.map(card => ({
      ...card,
      createdAt: Number(card.createdAt),
      updatedAt: Number(card.updatedAt),
      lastReviewed: card.lastReviewed ? Number(card.lastReviewed) : null,
      nextReview: card.nextReview ? Number(card.nextReview) : null,
    })));

  } catch (error) {
    console.error('Error in GET /api/flashcards:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'An unexpected error occurred' },
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