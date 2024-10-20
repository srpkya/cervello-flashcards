import { sqliteTable, text, integer, primaryKey, index } from 'drizzle-orm/sqlite-core';
export const user = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
});

export const account = sqliteTable('account', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('providerAccountId').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: integer('expires_at'),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
}, (table) => ({
  providerProviderAccountIdIndex: index('provider_providerAccountId_idx').on(
    table.provider,
    table.providerAccountId
  ),
}));

export const session = sqliteTable('session', {
  sessionToken: text('sessionToken').notNull().primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationToken = sqliteTable('verificationToken', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
}, (table) => ({
  compoundKey: primaryKey(table.identifier, table.token),
}));


export const decks = sqliteTable('decks', {
  id: text('id').primaryKey(),
  userId: text('userId').notNull().references(() => user.id),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
});

export const flashcards = sqliteTable('flashcards', {
  id: text('id').primaryKey(),
  deckId: text('deckId').notNull().references(() => decks.id),
  front: text('front').notNull(),
  back: text('back').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  lastReviewed: integer('last_reviewed', { mode: 'timestamp_ms' }),
  nextReview: integer('next_review', { mode: 'timestamp_ms' }),
  easeFactor: integer('ease_factor').notNull().default(250),
  interval: integer('interval').notNull().default(0),
});

