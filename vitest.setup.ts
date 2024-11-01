import '@testing-library/jest-dom/vitest';
import { server } from './__mocks__/msw/server';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
});

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  get: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  transaction: vi.fn().mockImplementation(async (callback) => {
    return callback(mockDb); // This ensures the transaction callback gets executed
  }),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
};

vi.mock('@/lib/db', () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
  createDbClient: vi.fn().mockResolvedValue(mockDb),
}));

// Mock next-auth/adapters
vi.mock('@auth/drizzle-adapter', () => ({
  DrizzleAdapter: vi.fn().mockReturnValue({})
}));



// Create the fetch mock
const mockFetch = vi.fn().mockResolvedValue({
  ok: true,
  json: async () => ({ success: true })
}) as unknown as typeof fetch;

// Assign it to global fetch
global.fetch = mockFetch;

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: vi.fn(() => ({
    data: { user: { id: 'test-user' } },
    status: 'authenticated'
  })),
  signIn: vi.fn(),
  signOut: vi.fn(),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children
}));

// Mock next-auth
vi.mock('next-auth', () => ({
  getServerSession: vi.fn(() => Promise.resolve({
    user: { id: 'test-user' }
  }))
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn()
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams())
}));

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

export { mockFetch, mockDb };