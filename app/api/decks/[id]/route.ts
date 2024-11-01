import { NextResponse } from "next/server";
import { getDeck, updateDeck, deleteDeck } from '@/lib/db';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { z } from "zod";

const updateDeckSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  labels: z.array(z.string()).optional()
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const deck = await getDeck(params.id);
    
    if (!deck) {
      return NextResponse.json(
        { error: 'Deck not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json(
      { error: 'Failed to fetch deck' },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const validatedData = updateDeckSchema.parse(body);

    const updatedDeck = await updateDeck(
      params.id,
      validatedData.title,
      validatedData.description || '',
      validatedData.labels || []
    );

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error('Error updating deck:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update deck' },
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

    await deleteDeck(params.id);
    return NextResponse.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json(
      { error: 'Failed to delete deck' },
      { status: 500 }
    );
  }
}