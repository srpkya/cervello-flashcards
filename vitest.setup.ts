import '@testing-library/jest-dom/vitest';
import { server } from './__mocks__/msw/server';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { TextEncoder as NodeTextEncoder, TextDecoder as NodeTextDecoder } from 'util';

// Create a polyfill for TextEncoder/TextDecoder that works in both Node and browser environments
if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = NodeTextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = NodeTextDecoder as unknown as typeof global.TextDecoder;
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  vi.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// Mock next-auth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 'test-user' } },
    status: 'authenticated'
  }),
  signIn: vi.fn(),
  signOut: vi.fn()
}));