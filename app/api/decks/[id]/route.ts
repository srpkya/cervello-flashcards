import { NextResponse } from 'next/server';
import { getDeck, updateDeck, deleteDeck } from '@/lib/db';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const deck = await getDeck(params.id);
  
  if (!deck) {
    return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
  }

  return NextResponse.json(deck);
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { title, description } = await request.json();

  if (!title) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 });
  }

  const updatedDeck = await updateDeck(params.id, title, description || '');
  return NextResponse.json(updatedDeck);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await deleteDeck(params.id);
  return NextResponse.json({ message: 'Deck deleted successfully' });
}