// __tests__/app/api/decks/route.test.ts
import { expect, describe, test, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/decks/route';
import { createMocks, RequestMethod } from 'node-mocks-http';
import { getServerSession } from 'next-auth';
import { getDecks, createDeck } from '@/lib/db';
import { NextRequest } from 'next/server';
import { Session } from 'next-auth';

vi.mock('next-auth', () => ({
  getServerSession: vi.fn()
}));

vi.mock('@/lib/db', () => ({
  getDecks: vi.fn(),
  createDeck: vi.fn()
}));

const mockedGetServerSession = vi.mocked(getServerSession);
const mockedGetDecks = vi.mocked(getDecks);
const mockedCreateDeck = vi.mocked(createDeck);

const createMockRequest = (options: {
  method: RequestMethod;
  url?: string;
  query?: Record<string, string>;
  body?: Record<string, any>;
}) => {
  const { req } = createMocks({
    method: options.method,
    url: options.url,
    query: options.query,
    body: options.body
  });
  return req as unknown as NextRequest;
};

describe('Decks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/decks', () => {
    test('returns 400 when userId is missing', async () => {
      const req = createMockRequest({
        method: 'GET',
        url: '/api/decks'
      });

      const response = await GET(req);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data).toEqual({ error: 'UserId is required' });
    });

    test('returns decks for valid userId', async () => {
      const mockDecks = [{
        id: '1',
        title: 'Test Deck 1',
        userId: '123',
        description: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalSharedDeckId: null,
        labels: []
      }];

      mockedGetDecks.mockResolvedValueOnce(mockDecks);

      const req = createMockRequest({
        method: 'GET',
        url: '/api/decks?userId=123',
        query: { userId: '123' }
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockDecks);
      expect(mockedGetDecks).toHaveBeenCalledWith('123');
    });
  });

  describe('POST /api/decks', () => {
    test('requires authentication', async () => {
      mockedGetServerSession.mockResolvedValueOnce(null);

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'Test Deck',
          description: 'Test Description'
        }
      });

      const response = await POST(req);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data).toEqual({ error: 'Unauthorized - Please sign in' });
    });

    test('creates deck with valid data', async () => {
      const mockSession: Session = {
        user: { id: '123', name: 'Test User' },
        expires: new Date().toISOString()
      };

      mockedGetServerSession.mockResolvedValueOnce(mockSession);

      const mockCreatedDeck = {
        id: 'new-deck-id',
        title: 'Test Deck',
        description: 'Test Description',
        userId: '123',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalSharedDeckId: null,
        labels: []
      };

      mockedCreateDeck.mockResolvedValueOnce(mockCreatedDeck);

      const req = createMockRequest({
        method: 'POST',
        body: {
          title: 'Test Deck',
          description: 'Test Description'
        }
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCreatedDeck);
      expect(mockedCreateDeck).toHaveBeenCalledWith(
        '123',
        'Test Deck',
        'Test Description',
        []
      );
    });
  });
});