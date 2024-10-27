import { NextResponse } from "next/server";
import { getDeck, updateDeck, deleteDeck } from '@/lib/db';

export async function GET(
  _request: Request,
  { params }: { params: { id: string }}
) {
  const deck = await getDeck(params.id);
  
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  return NextResponse.json(deck);
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string }}
) {
  try {
    const { title, description } = await request.json();

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const updatedDeck = await updateDeck(params.id, title, description || '');
    return NextResponse.json(updatedDeck);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update deck' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string }}
) {
  try {
    await deleteDeck(params.id);
    return NextResponse.json({ message: 'Deck deleted successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete deck' }, { status: 500 });
  }
}