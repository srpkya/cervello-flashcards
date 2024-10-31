// app/api/marketplace/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, user, deckRating, deck } from '@/lib/schema';
import { eq, sql } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const db = await getDb();
    
    const decks = await db
      .select({
        id: sharedDeck.id,
        title: sharedDeck.title,
        description: sharedDeck.description,
        downloads: sharedDeck.downloads,
        createdAt: sharedDeck.createdAt,
        userId: sharedDeck.userId,
        user: {
          name: user.name,
          image: user.image,
        },
        averageRating: sql<number>`COALESCE(AVG(${deckRating.rating}), 0)`.as('averageRating'),
        ratingCount: sql<number>`COUNT(${deckRating.id})`.as('ratingCount'),
      })
      .from(sharedDeck)
      .leftJoin(user, eq(sharedDeck.userId, user.id))
      .leftJoin(deckRating, eq(sharedDeck.id, deckRating.sharedDeckId))
      .groupBy(sharedDeck.id, user.name, user.image);

    return NextResponse.json(decks);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch decks' }, 
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { deckId } = await request.json();

    if (!deckId) {
      return NextResponse.json(
        { error: 'Deck ID is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if the deck exists and belongs to the user
    const originalDeck = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId))
      .get();

    if (!originalDeck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    if (originalDeck.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only share your own decks' },
        { status: 403 }
      );
    }

    // Check if this is a marketplace deck
    if (originalDeck.originalSharedDeckId) {
      return NextResponse.json(
        { error: 'Cannot reshare a deck from the marketplace' },
        { status: 400 }
      );
    }

    // Check if deck is already shared
    const existingShared = await db
      .select()
      .from(sharedDeck)
      .where(eq(sharedDeck.originalDeckId, deckId))
      .get();

    if (existingShared) {
      return NextResponse.json(
        { error: 'Deck is already shared' },
        { status: 400 }
      );
    }

    // Create shared deck
    const sharedDeckData = {
      id: crypto.randomUUID(),
      originalDeckId: deckId,
      userId: session.user.id,
      title: originalDeck.title,
      description: originalDeck.description,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      downloads: 0,
      isPublic: true
    };

    await db.insert(sharedDeck).values(sharedDeckData);

    return NextResponse.json({
      message: 'Deck shared successfully',
      deck: sharedDeckData
    });

  } catch (error) {
    console.error('Error sharing deck:', error);
    return NextResponse.json(
      { error: 'Failed to share deck' },
      { status: 500 }
    );
  }
}
