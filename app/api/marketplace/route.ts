// app/api/marketplace/route.ts
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, deck } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = 12;
  const offset = (page - 1) * limit;

  try {
    const db = await getDb();
    
    const decks = await db
      .select()
      .from(sharedDeck)
      .limit(limit)
      .offset(offset);

    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error fetching marketplace decks:', error);
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