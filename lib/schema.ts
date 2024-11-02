import { sqliteTable, text, integer, real, foreignKey } from 'drizzle-orm/sqlite-core';
import { type InferSelectModel, type InferInsertModel } from 'drizzle-orm';


export const user = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),

  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
});

export const account = sqliteTable('account', {
  id: text('id').notNull().primaryKey(),
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
});


export const deck = sqliteTable('deck', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  originalSharedDeckId: text('original_shared_deck_id'),
});


export const flashcard = sqliteTable('flashcard', {
  id: text('id').notNull().primaryKey(),
  deckId: text('deck_id')
    .notNull()
    .references(() => deck.id, { onDelete: 'cascade' }),
  front: text('front').notNull(),
  back: text('back').notNull(),
  audio: text('audio'),
  
  // Core timestamps
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  lastReviewed: integer('last_reviewed'),
  nextReview: integer('next_review'),

  // FSRS fields
  state: text('state', { 
    enum: ['new', 'learning', 'review', 'relearning'] 
  }).notNull().default('new'),
  stability: real('stability').notNull().default(1),
  difficulty: real('difficulty').notNull().default(5),
  elapsedDays: integer('elapsed_days').notNull().default(0),
  scheduledDays: integer('scheduled_days').notNull().default(0),
  reps: integer('reps').notNull().default(0),
  lapses: integer('lapses').notNull().default(0),
  interval: integer('interval').notNull().default(0),
  easeFactor: integer('ease_factor').notNull().default(250),
});

export const studySession = sqliteTable('study_session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  cardsStudied: integer('cards_studied').notNull(),
  startTime: integer('start_time').notNull(),
  endTime: integer('end_time').notNull(),
  createdAt: integer('created_at').notNull(),
  correctCount: integer('correct_count').notNull().default(0),
  incorrectCount: integer('incorrect_count').notNull().default(0),
  averageTime: integer('average_time').notNull().default(0),
});

export const reviewLog = sqliteTable('review_log', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  flashcardId: text('flashcard_id')
    .notNull()
    .references(() => flashcard.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(),
  reviewedAt: integer('reviewed_at').notNull(),
  stability: real('stability').notNull(),
  difficulty: real('difficulty').notNull(),
  elapsedDays: integer('elapsed_days').notNull(),
  scheduledDays: integer('scheduled_days').notNull(),
  responseTime: integer('response_time').notNull(),
});


export const sharedDeck = sqliteTable('shared_deck', {
  id: text('id').notNull().primaryKey(),
  originalDeckId: text('original_deck_id')
    .notNull()
    .references(() => deck.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  downloads: integer('downloads').notNull().default(0),
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(true),
});


export const deckRating = sqliteTable('deck_rating', {
  id: text('id').notNull().primaryKey(),
  sharedDeckId: text('shared_deck_id').notNull().references(() => sharedDeck.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  rating: real('rating').notNull(), // Allows half stars (0.5, 1.0, 1.5, etc.)
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const deckComment = sqliteTable('deck_comment', {
  id: text('id').notNull().primaryKey(),
  sharedDeckId: text('shared_deck_id').notNull().references(() => sharedDeck.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const label = sqliteTable('label', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at').notNull(),
});

export const deckLabel = sqliteTable('deck_label', {
  id: text('id').primaryKey(),
  deckId: text('deck_id')
    .notNull()
    .references(() => deck.id, { onDelete: 'cascade' }),
  labelId: text('label_id')
    .notNull()
    .references(() => label.id, { onDelete: 'cascade' }),
});

export const userRateLimit = sqliteTable('user_rate_limit', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  translationCount: integer('translation_count').notNull().default(0),
  translationResetTime: integer('translation_reset_time').notNull(),
  dailyCount: integer('daily_count').notNull().default(0),
  dailyResetTime: integer('daily_reset_time').notNull(),
  monthlyCount: integer('monthly_count').notNull().default(0),
  monthlyResetTime: integer('monthly_reset_time').notNull(),
  lastUpdated: integer('last_updated').notNull()
});

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;

export type Account = InferSelectModel<typeof account>;
export type NewAccount = InferInsertModel<typeof account>;

export type Deck = InferSelectModel<typeof deck>;
export type NewDeck = InferInsertModel<typeof deck>;

export type Flashcard = InferSelectModel<typeof flashcard>;
export type NewFlashcard = InferInsertModel<typeof flashcard>;

export type StudySession = InferSelectModel<typeof studySession>;
export type NewStudySession = InferInsertModel<typeof studySession>;

export type ReviewLog = InferSelectModel<typeof reviewLog>;
export type NewReviewLog = InferInsertModel<typeof reviewLog>;

export type CardState = 'new' | 'learning' | 'review' | 'relearning';

export type SharedDeck = InferSelectModel<typeof sharedDeck>;
export type DeckRating = InferSelectModel<typeof deckRating>;
export type DeckComment = InferSelectModel<typeof deckComment>;

export type UserRateLimit = typeof userRateLimit.$inferSelect;
export type NewUserRateLimit = typeof userRateLimit.$inferInsert;