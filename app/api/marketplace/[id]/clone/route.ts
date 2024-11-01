import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, deck, flashcard } from '@/lib/schema';
import { eq, and } from 'drizzle-orm';
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

    // First check if user already has this deck
    const existingDeck = await db
      .select()
      .from(deck)
      .where(
        and(
          eq(deck.userId, session.user.id),
          eq(deck.originalSharedDeckId, params.id)
        )
      )
      .get();

    if (existingDeck) {
      return NextResponse.json(
        { error: 'You already have this deck in your collection' },
        { status: 400 }
      );
    }

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

    const originalFlashcards = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, sharedDeckData.originalDeckId));

    let newDeckId: string | null = null;

    await db.transaction(async (tx) => {
      // Create the new deck, now including originalSharedDeckId to track its origin
      const newDeck = {
        id: crypto.randomUUID(),
        userId: session.user.id,
        title: `${sharedDeckData.title} (Copied)`,
        description: sharedDeckData.description || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalSharedDeckId: params.id, // Store the ID of the shared deck it was copied from
      };

      await tx.insert(deck).values(newDeck);
      newDeckId = newDeck.id;

      if (originalFlashcards.length > 0) {
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

        if (newFlashcards.length > 0) {
          await tx.insert(flashcard).values(newFlashcards);
        }
      }

      await tx
        .update(sharedDeck)
        .set({
          downloads: sharedDeckData.downloads + 1,
          updatedAt: Date.now()
        })
        .where(eq(sharedDeck.id, params.id));
    });

    return NextResponse.json({
      message: 'Deck cloned successfully',
      deckId: newDeckId
    });

  } catch (error) {
    console.error('Error cloning deck:', error);
    return NextResponse.json(
      { error: 'Failed to clone deck' },
      { status: 500 }
    );
  }
}


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