import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sharedDeck } from '@/lib/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: { deckId: string } }
) {
  try {
    const db = await getDb();
    const shared = await db
      .select()
      .from(sharedDeck)
      .where(eq(sharedDeck.originalDeckId, params.deckId))
      .get();

    return NextResponse.json({ isShared: !!shared });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check shared status' }, { status: 500 });
  }
}