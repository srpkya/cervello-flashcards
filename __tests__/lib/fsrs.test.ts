import { fsrs } from '@/lib/fsrs';
import type { Rating, CardState } from '@/lib/fsrs';
import { describe, it, expect } from 'vitest';

describe('FSRS', () => {
  describe('updateState', () => {
    const initialState: CardState = {
      state: 'review',
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 1,
      lapses: 0
    };

    it('handles "good" rating correctly', () => {
      const rating: Rating = { rating: 'good', value: 3 };
      const now = Date.now();
      const newState = fsrs.updateState(initialState, rating, now);

      expect(newState.state).toBe('review');
      expect(newState.stability).toBeGreaterThanOrEqual(initialState.stability);
      expect(newState.difficulty).toBe(initialState.difficulty);
      expect(newState.reps).toBe(initialState.reps + 1);
    });
  });
});