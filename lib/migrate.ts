import { drizzle } from 'drizzle-orm/libsql';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { createClient } from '@libsql/client';
import * as schema from './schema';

const runMigrations = async () => {
  if (!process.env.NEXT_PUBLIC_TURSO_DATABASE_URL || !process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN) {
    throw new Error('Database credentials are not properly configured');
  }

  const client = createClient({
    url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL,
    authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
  });

  const db = drizzle(client, { schema });

  try {
    await migrate(db, {
      migrationsFolder: 'migrations'
    });
  } finally {
    await client.close();
  }
};

runMigrations().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});