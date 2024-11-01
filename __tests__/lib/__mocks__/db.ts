import { vi } from 'vitest';

const mockDb = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  get: vi.fn(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockResolvedValue({}),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockResolvedValue({}),
  delete: vi.fn().mockResolvedValue({}),
  groupBy: vi.fn().mockReturnThis(),
};

export const getDb = vi.fn().mockResolvedValue(mockDb);
export const createDbClient = vi.fn().mockResolvedValue(mockDb);

// Export the mockDb for direct manipulation in tests
export const __mockDb = mockDb;