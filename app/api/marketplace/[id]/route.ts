// app/api/marketplace/[id]/route.ts
import { NextResponse } from "next/server";
import { getDb } from '@/lib/db';
import { sharedDeck, deck, flashcard } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET a specific shared deck
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const db = await getDb();
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

    return NextResponse.json(sharedDeckData);
  } catch (error) {
    console.error('Error fetching shared deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}

// DELETE a shared deck
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
      .where(eq(sharedDeck.id, params.id))
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

    // Delete the shared deck (cascading will handle related records)
    await db
      .delete(sharedDeck)
      .where(eq(sharedDeck.id, params.id));

    return NextResponse.json({
      success: true,
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

// Update a shared deck
export async function PATCH(
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

    const body = await request.json();
    const { title, description } = body;

    const db = await getDb();

    // Verify ownership
    const existingDeck = await db
      .select()
      .from(sharedDeck)
      .where(eq(sharedDeck.id, params.id))
      .get();

    if (!existingDeck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    if (existingDeck.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only update your own shared decks' },
        { status: 403 }
      );
    }

    // Update the deck
    await db
      .update(sharedDeck)
      .set({
        title: title || existingDeck.title,
        description: description || existingDeck.description,
        updatedAt: Date.now()
      })
      .where(eq(sharedDeck.id, params.id));

    const updatedDeck = await db
      .select()
      .from(sharedDeck)
      .where(eq(sharedDeck.id, params.id))
      .get();

    return NextResponse.json(updatedDeck);

  } catch (error) {
    console.error('Error updating shared deck:', error);
    return NextResponse.json(
      { error: 'Failed to update deck' },
      { status: 500 }
    );
  }
}