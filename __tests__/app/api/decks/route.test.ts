import { expect, describe, test, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/decks/route';
import { getServerSession } from 'next-auth';
import type { NextRequest } from 'next/server';
import type { Session } from 'next-auth';
import { mockDb } from '@/vitest.setup';
import { getDecks, createDeck } from '@/lib/db';

// Mock the database functions
vi.mock('@/lib/db', () => ({
  getDecks: vi.fn(),
  createDeck: vi.fn(),
  getDb: vi.fn().mockResolvedValue({
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    get: vi.fn()
  })
}));

// Fix for the jest.Mock type
import type { Mock } from 'vitest';

const mockedGetServerSession = getServerSession as Mock;
const mockedGetDecks = getDecks as Mock;
const mockedCreateDeck = createDeck as Mock;

const mockSession = {
  user: { id: 'test-user', name: 'Test User' },
  expires: new Date().toISOString()
} as Session;

interface MockRequestOptions {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url?: string;
  query?: Record<string, string>;
  body?: Record<string, any>;
}

const createMockRequest = (options: MockRequestOptions): NextRequest => {
  const url = new URL(options.url || '/', 'http://localhost:3000');
  if (options.query) {
    Object.entries(options.query).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return new Request(url, {
    method: options.method,
    body: options.body ? JSON.stringify(options.body) : undefined,
    headers: {
      'Content-Type': 'application/json',
    },
  }) as NextRequest;
};

describe('Decks API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedGetDecks.mockReset();
    mockedCreateDeck.mockReset();
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
        url: '/api/decks',
        query: { userId: '123' }
      });

      const response = await GET(req);
      
      // Add error logging for debugging
      if (response.status !== 200) {
        console.error('Response error:', await response.clone().json());
      }
      
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data)).toBe(true);
      expect(data).toEqual(mockDecks);
      expect(mockedGetDecks).toHaveBeenCalledWith('123');
    });
  });

  describe('POST /api/decks', () => {
    test('creates deck with valid data', async () => {
      mockedGetServerSession.mockResolvedValueOnce(mockSession);

      const mockCreatedDeck = {
        id: 'new-deck-id',
        title: 'Test Deck',
        description: 'Test Description',
        userId: 'test-user',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        originalSharedDeckId: null,
        labels: []
      };

      mockedCreateDeck.mockResolvedValueOnce(mockCreatedDeck);

      const req = createMockRequest({
        method: 'POST',
        url: '/api/decks',
        body: {
          title: 'Test Deck',
          description: 'Test Description'
        }
      });

      const response = await POST(req);
      
      // Add error logging for debugging
      if (response.status !== 200) {
        console.error('Response error:', await response.clone().json());
      }
      
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockCreatedDeck);
      expect(mockedCreateDeck).toHaveBeenCalledWith(
        'test-user',
        'Test Deck',
        'Test Description',
        []
      );
    });

    test('requires authentication', async () => {
      mockedGetServerSession.mockResolvedValueOnce(null);

      const req = createMockRequest({
        method: 'POST',
        url: '/api/decks',
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
  });
});