import { vi } from 'vitest';
import type { Deck, Flashcard } from '@/lib/types';

export const mockDeck: Deck = {
  id: 'test-deck-id',
  userId: 'test-user-id',
  title: 'Test Deck',
  description: 'Test Description',
  createdAt: new Date(),
  updatedAt: new Date(),
  labels: []
};

export const mockFlashcard: Flashcard = {
  id: 'test-card-id',
  deckId: 'test-deck-id',
  front: 'Test Front',
  back: 'Test Back',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  state: 'new',
  stability: 1,
  difficulty: 5,
  elapsedDays: 0,
  scheduledDays: 0,
  reps: 0,
  lapses: 0,
  lastReviewed: null,
  nextReview: null,
  audio: null,
  interval: 0,
  easeFactor: 250
};