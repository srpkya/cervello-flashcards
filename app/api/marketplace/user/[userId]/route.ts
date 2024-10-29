import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck, deckRating } from '@/lib/schema';
import { eq, and, sql } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { userId: string } }
) {
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
        averageRating: sql<number>`COALESCE(AVG(${deckRating.rating}), 0)`.as('averageRating'),
        ratingCount: sql<number>`COUNT(${deckRating.id})`.as('ratingCount'),
      })
      .from(sharedDeck)
      .leftJoin(deckRating, eq(sharedDeck.id, deckRating.sharedDeckId))
      .where(eq(sharedDeck.userId, params.userId))
      .groupBy(sharedDeck.id);

    return NextResponse.json(decks);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch shared decks' }, { status: 500 });
  }
}