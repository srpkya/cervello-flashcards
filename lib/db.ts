import { drizzle } from 'drizzle-orm/libsql';
import { deck, flashcard } from './schema';
import { Deck, Flashcard } from './types';
import * as schema from './schema';
import { createClient } from '@libsql/client';
import { studySession } from './schema';
import { and, eq, sql } from 'drizzle-orm';

let db: ReturnType<typeof drizzle<typeof schema>>;

export interface StudySessionStats {
  totalCardsToday: number;
  studyTimeToday: number;
  streak: number;
  lastThirtyDays: Array<{
    date: string;
    count: number;
  }>;
}

interface DailyStats {
  date: string;
  count: number;
}

export async function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Cannot use database client in browser environment');
  }
  
  if (!db) {
    const client = createClient({
      url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
      authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
    });
    
    db = drizzle(client, { schema, logger: false });
  }
  
  return db;
}

export async function createDbClient() {
  const client = createClient({
    url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
    authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
  });
  
  return drizzle(client, { schema, logger: false });
}

export async function getDecks(userId: string): Promise<Deck[]> {
  const db = await createDbClient();
  try {
    const results = await db.select().from(deck).where(eq(deck.userId, userId));
    return results.map(deck => ({
      ...deck,
      description: deck.description || '',
      createdAt: new Date(Number(deck.createdAt)),
      updatedAt: new Date(Number(deck.updatedAt))
    }));
  } catch (error) {
    console.error('Error in getDecks:', error);
    throw error;
  }
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const db = await createDbClient();
  try {
    const result = await db.select().from(deck).where(eq(deck.id, id)).get();
    if (!result) return undefined;
    
    return {
      ...result,
      description: result.description || '',
      createdAt: new Date(Number(result.createdAt)),
      updatedAt: new Date(Number(result.updatedAt))
    };
  } catch (error) {
    console.error('Error in getDeck:', error);
    throw error;
  }
}

export async function createDeck(userId: string, title: string, description: string): Promise<Deck> {
  const db = await createDbClient();
  const now = Date.now();  
  
  const newDeck = {
    id: crypto.randomUUID(),
    userId,
    title,
    description,
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    await db.insert(deck).values(newDeck);
    
    const created = await db.select()
      .from(deck)
      .where(eq(deck.id, newDeck.id))
      .get();
      
    if (!created) {
      throw new Error('Failed to create deck');
    }
    
    return {
      id: created.id,
      userId: created.userId,
      title: created.title,
      description: created.description || '',
      createdAt: new Date(Number(created.createdAt)),
      updatedAt: new Date(Number(created.updatedAt))
    };
  } catch (error) {
    console.error('Error in createDeck:', error);
    throw error;
  }
}

export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  const db = await createDbClient();
  
  try {
    const results = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.deckId, deckId))
      .execute();

    return results.map(card => ({
      ...card,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null,
      nextReview: card.nextReview ? new Date(card.nextReview) : null,
      easeFactor: Number(card.easeFactor),
      interval: Number(card.interval)
    }));
  } catch (error) {
    console.error('Error in getFlashcards:', error);
    throw error;
  }
}

export async function createStudySession(
  userId: string,
  cardsStudied: number,
  startTime: Date,
  endTime: Date
): Promise<void> {
  const db = await createDbClient();
  const session = {
    id: crypto.randomUUID(),
    userId,
    cardsStudied,
    startTime,
    endTime,
    createdAt: new Date(),
  };
  await db.insert(studySession).values(session);
}

async function calculateStreak(db: any, userId: string): Promise<number> {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  let currentDate = new Date(now);
  let continuousStreak = true;

  while (continuousStreak) {
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);
    dayEnd.setHours(23, 59, 59, 999);

    const hadActivity = await db
      .select({ count: sql<number>`count(*)` })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          sql`datetime(${studySession.startTime} / 1000, 'unixepoch') >= datetime(${dayStart.getTime() / 1000}, 'unixepoch')`,
          sql`datetime(${studySession.startTime} / 1000, 'unixepoch') <= datetime(${dayEnd.getTime() / 1000}, 'unixepoch')`
        )
      )
      .get();

    if (Number(hadActivity?.count) > 0) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      if (currentStreak === 0 && currentDate.getTime() === now.getTime()) {
        const todayActivity = await db
          .select({ count: sql<number>`count(*)` })
          .from(studySession)
          .where(
            and(
              eq(studySession.userId, userId),
              sql`datetime(${studySession.startTime} / 1000, 'unixepoch') >= datetime(${now.getTime() / 1000}, 'unixepoch')`
            )
          )
          .get();
        
        if (Number(todayActivity?.count) > 0) {
          currentStreak = 1;
        }
      }
      continuousStreak = false;
    }
  }

  return currentStreak;
}

export async function getStudyStats(userId: string): Promise<StudySessionStats> {
  const db = await createDbClient();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  thirtyDaysAgo.setHours(0, 0, 0, 0);

  const todayStart = sql`datetime(${today.getTime() / 1000}, 'unixepoch')`;
  const thirtyDaysAgoStart = sql`datetime(${thirtyDaysAgo.getTime() / 1000}, 'unixepoch')`;

  const todayStats = await db
    .select({
      cardsStudied: sql<number>`COALESCE(sum(${studySession.cardsStudied}), 0)`,
      totalTime: sql<number>`COALESCE(sum(
        CAST(
          (julianday(datetime(${studySession.endTime} / 1000, 'unixepoch')) - 
           julianday(datetime(${studySession.startTime} / 1000, 'unixepoch'))) * 86400 
        AS INTEGER)
      ), 0)`,
    })
    .from(studySession)
    .where(
      and(
        eq(studySession.userId, userId),
        sql`datetime(${studySession.startTime} / 1000, 'unixepoch') >= ${todayStart}`
      )
    )
    .get();

  const dailyStats = await db
    .select({
      date: sql<string>`date(${studySession.startTime} / 1000, 'unixepoch')`,
      count: sql<number>`COALESCE(sum(${studySession.cardsStudied}), 0)`,
    })
    .from(studySession)
    .where(
      and(
        eq(studySession.userId, userId),
        sql`datetime(${studySession.startTime} / 1000, 'unixepoch') >= ${thirtyDaysAgoStart}`
      )
    )
    .groupBy(sql`date(${studySession.startTime} / 1000, 'unixepoch')`)
    .execute();

  const streak = await calculateStreak(db, userId);
  const filledDailyStats: DailyStats[] = [];
  let currentDate = new Date(thirtyDaysAgo);

  while (currentDate <= today) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const existingStat = dailyStats.find(
      stat => new Date(stat.date).toISOString().split('T')[0] === dateStr
    );

    filledDailyStats.push({
      date: dateStr,
      count: existingStat ? Number(existingStat.count) : 0,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return {
    totalCardsToday: Number(todayStats?.cardsStudied || 0),
    studyTimeToday: Number(todayStats?.totalTime || 0),
    streak,
    lastThirtyDays: filledDailyStats,
  };
}

export async function updateFlashcard(
  id: string, 
  front: string, 
  back: string, 
  reviewData?: {
    lastReviewed: string | Date;
    nextReview: string | Date;
    easeFactor: number;
    interval: number;
  }
): Promise<Flashcard> {
  const db = await createDbClient();
  
  try {
    // Function to convert date to milliseconds
    const toMillis = (date: string | Date) => {
      if (typeof date === 'string') {
        return new Date(date).valueOf();
      }
      return date.valueOf();
    };

    const updateData = {
      front,
      back,
      updatedAt: Date.now(),
      ...(reviewData && {
        lastReviewed: toMillis(reviewData.lastReviewed),
        nextReview: toMillis(reviewData.nextReview),
        easeFactor: reviewData.easeFactor,
        interval: reviewData.interval
      })
    };

    await db.update(flashcard)
      .set(updateData)
      .where(eq(flashcard.id, id));

    const updatedCard = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.id, id))
      .get();

    if (!updatedCard) {
      throw new Error('Flashcard not found after update');
    }

    // Convert timestamps back to Date objects for the returned data
    return {
      ...updatedCard,
      createdAt: new Date(Number(updatedCard.createdAt)),
      updatedAt: new Date(Number(updatedCard.updatedAt)),
      lastReviewed: updatedCard.lastReviewed ? new Date(Number(updatedCard.lastReviewed)) : null,
      nextReview: updatedCard.nextReview ? new Date(Number(updatedCard.nextReview)) : null,
      easeFactor: Number(updatedCard.easeFactor),
      interval: Number(updatedCard.interval)
    };
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
}

export async function deleteFlashcard(id: string): Promise<void> {
  const db = await createDbClient();
  try {
    await db.delete(flashcard).where(eq(flashcard.id, id));
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
}

export async function createFlashcard(
  deckId: string,
  front: string,
  back: string
): Promise<Flashcard> {
  const db = await createDbClient();
  const now = Date.now();
  
  const newFlashcard = {
    id: crypto.randomUUID(),
    deckId,
    front,
    back,
    createdAt: now,
    updatedAt: now,
    lastReviewed: null,
    nextReview: null,
    easeFactor: 250,
    interval: 0
  };

  try {
    await db.insert(flashcard).values(newFlashcard);

    const created = await db.select()
      .from(flashcard)
      .where(eq(flashcard.id, newFlashcard.id))
      .get();

    if (!created) {
      throw new Error('Failed to create flashcard');
    }

    return {
      id: created.id,
      deckId: created.deckId,
      front: created.front,
      back: created.back,
      createdAt: new Date(Number(created.createdAt)),
      updatedAt: new Date(Number(created.updatedAt)),
      lastReviewed: created.lastReviewed ? new Date(Number(created.lastReviewed)) : null,
      nextReview: created.nextReview ? new Date(Number(created.nextReview)) : null,
      easeFactor: Number(created.easeFactor),
      interval: Number(created.interval)
    };
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
}