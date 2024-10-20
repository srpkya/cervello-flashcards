import { NextResponse } from 'next/server';
import { updateFlashcard, deleteFlashcard } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { front, back, reviewData } = await request.json();

  if (!front || !back) {
    return NextResponse.json({ error: 'Front and back are required' }, { status: 400 });
  }

  const updatedFlashcard = await updateFlashcard(params.id, front, back, reviewData);
  return NextResponse.json(updatedFlashcard);
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  await deleteFlashcard(params.id);
  return NextResponse.json({ message: 'Flashcard deleted successfully' });
}