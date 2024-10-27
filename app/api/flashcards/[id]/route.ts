import { NextResponse } from 'next/server';
import { updateFlashcard, deleteFlashcard } from '@/lib/db';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { front, back, reviewData } = await request.json();

    if (!front || !back) {
      return NextResponse.json({ error: 'Front and back are required' }, { status: 400 });
    }

    const updatedFlashcard = await updateFlashcard(params.id, front, back, reviewData);
    return NextResponse.json(updatedFlashcard);
  } catch (error) {
    console.error('Error updating flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to update flashcard' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await deleteFlashcard(params.id);
    return NextResponse.json({ message: 'Flashcard deleted successfully' });
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    return NextResponse.json(
      { error: 'Failed to delete flashcard' },
      { status: 500 }
    );
  }
}