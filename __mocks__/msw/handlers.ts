import { rest } from 'msw';

export const handlers = [
  rest.get('*/api/flashcards', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json([{
        id: '1',
        front: 'Test Front',
        back: 'Test Back',
        deckId: '1',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        state: 'new',
        stability: 1,
        difficulty: 5,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        interval: 0,
        easeFactor: 250,
        lastReviewed: null,
        nextReview: null,
        audio: null
      }])
    );
  }),

  rest.post('*/api/review-log', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ success: true })
    );
  })
];
