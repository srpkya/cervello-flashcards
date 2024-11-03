// app/api/flashcards/[id]/route.ts
import { NextResponse } from 'next/server';
import { getDb, updateFlashcard } from '@/lib/db';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { deck, deckRating, flashcard } from '@/lib/schema';
import { eq, and } from 'drizzle-orm'
// Validation schema for review data

const reviewDataSchema = z.object({
  lastReviewed: z.number(),
  nextReview: z.number().nullable(), // Allow null
  state: z.enum(['new', 'learning', 'review', 'relearning']),
  stability: z.number().transform(n => {
    // Clamp extremely large numbers to a reasonable maximum
    return Math.min(n, Number.MAX_SAFE_INTEGER);
  }),
  difficulty: z.number(),
  elapsedDays: z.number(),
  scheduledDays: z.number().transform(n => {
    // Clamp extremely large numbers to a reasonable maximum
    return Math.min(n, Number.MAX_SAFE_INTEGER);
  }),
  reps: z.number(),
  lapses: z.number()
});

const updateSchema = z.object({
  front: z.string().min(1, "Front content is required"),
  back: z.string().min(1, "Back content is required"),
  reviewData: reviewDataSchema
});


export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    console.log('Received update request:', {
      id: params.id,
      body: JSON.stringify(body, null, 2)
    });

    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Transform the data to handle state updates
    const reviewData = {
      ...body.reviewData,
      // Ensure nextReview is properly calculated
      nextReview: body.reviewData.nextReview !== null ? 
        body.reviewData.nextReview : 
        Date.now() + (body.reviewData.scheduledDays * 24 * 60 * 60 * 1000),
      // Clamp values to prevent overflow
      stability: Math.min(Number(body.reviewData.stability), 365 * 10), // Max 10 years
      scheduledDays: Math.min(Number(body.reviewData.scheduledDays), 365) // Max 1 year
    };

    const updatedCard = await updateFlashcard(
      params.id,
      body.front,
      body.back,
      reviewData
    );

    return NextResponse.json(updatedCard);

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
export async function GET(request: Request) {
  try {
    // Get the authenticated session
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized - Please sign in' },
        { status: 401 }
      );
    }

    // Get deck ID from query params
    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return NextResponse.json(
        { error: 'DeckId is required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // First verify the deck exists and belongs to the user
    const deckExists = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId))
      .get();

    if (!deckExists) {
      return NextResponse.json(
        { error: `Deck ${deckId} not found` },
        { status: 404 }
      );
    }

    if (deckExists.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to access this deck' },
        { status: 403 }
      );
    }

    // Fetch flashcards
    const flashcards = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, deckId));

    // Return the flashcards
    return NextResponse.json(flashcards);

  } catch (error) {
    console.error('Error fetching flashcards:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch flashcards',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

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

    const card = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.id, params.id))
      .get();

    if (!card) {
      return NextResponse.json(
        { error: 'Flashcard not found' },
        { status: 404 }
      );
    }

    await db
      .delete(flashcard)
      .where(eq(flashcard.id, params.id));

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    );
  }
}