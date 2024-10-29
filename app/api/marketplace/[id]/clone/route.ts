// app/api/marketplace/[id]/clone/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, deck, flashcard } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();

    // Get the shared deck and verify it exists
    const sharedDeckData = await db
      .select()
      .from(sharedDeck)
      .where(eq(sharedDeck.id, params.id))
      .get();

    if (!sharedDeckData) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    // Verify user doesn't already have this deck
    const existingDeck = await db
      .select()
      .from(deck)
      .where(
        eq(deck.userId, session.user.id)
      )
      .get();

    if (existingDeck) {
      return NextResponse.json(
        { error: 'You already have this deck in your collection' },
        { status: 400 }
      );
    }

    // Get all flashcards from the original deck
    const originalFlashcards = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, sharedDeckData.originalDeckId));

    // Start a transaction to ensure all operations succeed or fail together
    await db.transaction(async (tx) => {
      // Create new deck
      const newDeck = {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: `${sharedDeckData.title} (Copied)`,
        description: sharedDeckData.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await tx.insert(deck).values(newDeck);

      // Clone all flashcards
      const newFlashcards = originalFlashcards.map(card => ({
        id: crypto.randomUUID(),
        deckId: newDeck.id,
        front: card.front,
        back: card.back,
        audio: card.audio,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        lastReviewed: null,
        nextReview: null,
        state: 'new' as const,
        stability: 1,
        difficulty: 5,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        interval: 0,
        easeFactor: 250,
      }));

      await tx.insert(flashcard).values(newFlashcards);

      // Increment download count
      await tx
        .update(sharedDeck)
        .set({ 
          downloads: sharedDeckData.downloads + 1,
          updatedAt: Date.now()
        })
        .where(eq(sharedDeck.id, params.id));
    });

    // Get the complete new deck with its flashcards
    const clonedDeck = await db
      .select()
      .from(deck)
      .where(eq(deck.userId, session.user.id))
      .get();

    const clonedFlashcards = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, clonedDeck!.id));

    return NextResponse.json({
      message: 'Deck cloned successfully',
      deck: {
        ...clonedDeck,
        flashcards: clonedFlashcards
      }
    });

  } catch (error) {
    console.error('Error cloning deck:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { error: 'Referenced deck or user not found' },
          { status: 404 }
        );
      }
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'You already have this deck' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to clone deck' },
      { status: 500 }
    );
  }
}

// Delete route for removing shared decks
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const db = await getDb();

    // Verify the deck exists and belongs to the user
    const sharedDeckData = await db
      .select()
      .from(sharedDeck)
      .where(
        eq(sharedDeck.id, params.id)
      )
      .get();

    if (!sharedDeckData) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    if (sharedDeckData.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only remove your own shared decks' },
        { status: 403 }
      );
    }

    // Delete the shared deck (cascading will handle ratings and comments)
    await db
      .delete(sharedDeck)
      .where(eq(sharedDeck.id, params.id));

    return NextResponse.json({
      message: 'Deck removed from marketplace successfully'
    });

  } catch (error) {
    console.error('Error removing shared deck:', error);
    return NextResponse.json(
      { error: 'Failed to remove deck from marketplace' },
      { status: 500 }
    );
  }
}