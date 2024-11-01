import { getDb } from "@/lib/db";
import { deck, flashcard } from "@/lib/schema";
import { and, eq, isNull, lte, or, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
  
    if (!userId) {
      return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
    }
  
    const db = await getDb();
    const now = Date.now();
  
    const dueCards = await db
      .select({ count: sql<number>`count(*)` })
      .from(flashcard)
      .leftJoin(deck, eq(deck.id, flashcard.deckId))
      .where(
        and(
          eq(deck.userId, userId),
          or(
            isNull(flashcard.nextReview),
            lte(flashcard.nextReview, now)
          )
        )
      )
      .get();
  
    return NextResponse.json({ count: dueCards?.count || 0 });
  }