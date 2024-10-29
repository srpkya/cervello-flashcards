// app/api/marketplace/[id]/ratings/route.ts
import { getDb } from "@/lib/db";
import { deckRating, sharedDeck } from "@/lib/schema";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

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

    const { rating } = await request.json();
    
    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Invalid rating value' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if user has already rated this deck
    const existingRating = await db
      .select()
      .from(deckRating)
      .where(
        and(
          eq(deckRating.sharedDeckId, params.id),
          eq(deckRating.userId, session.user.id)
        )
      )
      .get();

    if (existingRating) {
      // Update existing rating
      await db
        .update(deckRating)
        .set({
          rating,
          updatedAt: Date.now()
        })
        .where(eq(deckRating.id, existingRating.id));
    } else {
      // Create new rating
      await db.insert(deckRating).values({
        id: crypto.randomUUID(),
        sharedDeckId: params.id,
        userId: session.user.id,
        rating,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // Calculate new average rating
    const ratings = await db
      .select({
        rating: deckRating.rating
      })
      .from(deckRating)
      .where(eq(deckRating.sharedDeckId, params.id));

    const average = ratings.reduce((acc, curr) => acc + curr.rating, 0) / ratings.length;

    return NextResponse.json({
      message: 'Rating submitted successfully',
      averageRating: average,
      ratingCount: ratings.length
    });

  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Failed to submit rating' },
      { status: 500 }
    );
  }
}