import { render, screen, fireEvent } from '@testing-library/react';
import ReviewSession from '@/app/review/ReviewSession';
import type { Flashcard } from '@/lib/types';
import { describe, it, expect, vi } from 'vitest';

describe('ReviewSession', () => {
  const mockFlashcards: Flashcard[] = [{
    id: '1',
    front: 'Test Front',
    back: 'Test Back',
    deckId: '1',
    state: 'new',
    stability: 1,
    difficulty: 5,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    lastReviewed: null,
    nextReview: null,
    audio: null,
    interval: 0,
    easeFactor: 250
  }];

  const mockProps = {
    flashcards: mockFlashcards,
    onComplete: vi.fn(),
    userId: 'test-user'
  };

  it('renders flashcard correctly', () => {
    render(<ReviewSession {...mockProps} />);
    expect(screen.getByText('Test Front')).toBeInTheDocument();
  });

  it('shows completion screen after reviewing all cards', async () => {
    render(<ReviewSession {...mockProps} />);
    
    fireEvent.click(screen.getByText('Test Front'));
    fireEvent.click(screen.getByText('Good'));
    
    expect(await screen.findByText(/Review Complete/i)).toBeInTheDocument();
  });
});