import { render, screen, fireEvent } from '@testing-library/react';
import Flashcard from '@/components/Flashcard';
import type { Flashcard as FlashcardType } from '@/lib/types';
import { describe, it, expect } from 'vitest';

describe('Flashcard', () => {
  const mockFlashcard: Partial<FlashcardType> = {
    front: 'Test Front',
    back: 'Test Back',
    id: '1',
    deckId: '1',
    state: 'new',
    stability: 1,
    difficulty: 5,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  it('renders front content initially', () => {
    render(<Flashcard front={mockFlashcard.front!} back={mockFlashcard.back!} />);
    expect(screen.getByText(mockFlashcard.front!)).toBeInTheDocument();
  });

  it('flips to show back content when clicked', () => {
    render(<Flashcard front={mockFlashcard.front!} back={mockFlashcard.back!} />);
    fireEvent.click(screen.getByText(mockFlashcard.front!));
    expect(screen.getByText(mockFlashcard.back!)).toBeVisible();
  });
});