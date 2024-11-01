import { vi } from 'vitest';
import { Session } from 'next-auth';

export const mockSession: Session = {
  user: { id: 'test-user', name: 'Test User', email: 'test@example.com' },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
};

export const mockNextRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  query: {},
  pathname: '/',
  route: '/',
  asPath: '/',
  events: {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }
};