import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, user, deckRating, deck, deckLabel, label } from '@/lib/schema';
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
        labels: sql<string[]>`JSON_GROUP_ARRAY(DISTINCT CASE WHEN ${label.name} IS NULL THEN NULL ELSE ${label.name} END)`.as('labels'),
      })
      .from(sharedDeck)
      .leftJoin(user, eq(sharedDeck.userId, user.id))
      .leftJoin(deckRating, eq(sharedDeck.id, deckRating.sharedDeckId))
      .leftJoin(deck, eq(sharedDeck.originalDeckId, deck.id))
      .leftJoin(deckLabel, eq(deck.id, deckLabel.deckId))
      .leftJoin(label, eq(deckLabel.labelId, label.id))
      .groupBy(sharedDeck.id, user.name, user.image);

    const transformedDecks = decks.map(deck => ({
      ...deck,
      labels: deck.labels[0] === null ? [] 
        : Array.from(new Set(JSON.parse(deck.labels.toString())))
    }));

    return NextResponse.json(transformedDecks);
  } catch (error) {
    console.error('Error fetching shared decks:', error);
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

    const db = await getDb(); // Change this line

    // First check if the deck is already shared
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

    // Fetch the original deck to get its details
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

    // Check if the deck is a clone from marketplace
    if (originalDeck.originalSharedDeckId) {
      return NextResponse.json(
        { error: 'Cloned decks from the marketplace cannot be shared' },
        { status: 403 }
      );
    }

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
      { 
        error: 'Failed to share deck',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}