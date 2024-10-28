import { drizzle } from 'drizzle-orm/libsql';
import { deck, flashcard } from './schema';
import * as schema from './schema';
import { createClient } from '@libsql/client';
import { studySession } from './schema';
import { and, eq, sql } from 'drizzle-orm';
import { StudyData } from './types';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

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

async function createDbClientWithRetry(attempt = 1) {
  try {
    const client = createClient({
      url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
      authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
    });
    await client.execute('SELECT 1');
    return drizzle(client, { schema, logger: false });
  } catch (error) {
    if (attempt < RETRY_ATTEMPTS) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * attempt));
      return createDbClientWithRetry(attempt + 1);
    }
    throw error;
  }
}

let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Cannot use database client in browser environment');
  }
  if (!dbInstance) {
    dbInstance = await createDbClientWithRetry();
  }
  return dbInstance;
}

export async function createDbClient() {
  return await createDbClientWithRetry();
}

export async function getDecks(userId: string) {
  let retries = 0;
  while (retries < RETRY_ATTEMPTS) {
    try {
      const db = await createDbClient();
      const results = await db.select().from(deck).where(eq(deck.userId, userId));
      return results.map(deck => ({
        ...deck,
        description: deck.description || '',
        createdAt: new Date(Number(deck.createdAt)),
        updatedAt: new Date(Number(deck.updatedAt))
      }));
    } catch (error) {
      retries++;
      if (retries === RETRY_ATTEMPTS) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
    }
  }
  throw new Error('Failed to fetch decks after multiple attempts');
}

export async function getDeck(id: string) {
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
    throw error;
  }
}

export async function createDeck(userId: string, title: string, description: string) {
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
    const created = await db.select().from(deck).where(eq(deck.id, newDeck.id)).get();
    if (!created) throw new Error('Failed to create deck');
    return {
      ...created,
      description: created.description || '',
      createdAt: new Date(Number(created.createdAt)),
      updatedAt: new Date(Number(created.updatedAt))
    };
  } catch (error) {
    throw error;
  }
}

export async function getFlashcards(deckId: string) {
  const db = await createDbClient();
  try {
    const results = await db.select().from(flashcard).where(eq(flashcard.deckId, deckId));
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
    throw error;
  }
}

export async function createStudySession(userId: string, cardsStudied: number, startTime: Date, endTime: Date) {
  let retries = 0;
  while (retries < RETRY_ATTEMPTS) {
    try {
      const db = await createDbClient();
      
      const startDate = startTime instanceof Date ? startTime : new Date(startTime);
      const endDate = endTime instanceof Date ? endTime : new Date(endTime);
      
      const session = {
        id: crypto.randomUUID(),
        userId,
        cardsStudied,
        startTime: startDate,
        endTime: endDate,
        createdAt: new Date()
      };

      console.log('Creating new study session:', {
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime.toISOString(),
        createdAt: session.createdAt.toISOString()
      });
      
      await db.insert(studySession).values(session);
      
      const createdSession = await db
        .select()
        .from(studySession)
        .where(eq(studySession.id, session.id))
        .get();
        
      console.log('Verified created session:', createdSession);
      
      return session;
    } catch (error) {
      console.error('Error creating study session:', error);
      retries++;
      if (retries === RETRY_ATTEMPTS) throw error;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
    }
  }
}

async function calculateStreak(db: any, userId: string): Promise<number> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  let currentStreak = 0;
  let currentDate = new Date(today);
  let continuousStreak = true;

  while (continuousStreak) {
    const dayStart = currentDate.getTime();
    const dayEnd = dayStart + (24 * 60 * 60 * 1000);

    const hadActivity = await db
      .select({ count: sql<number>`count(*)` })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          sql`${studySession.startTime} >= ${dayStart}`,
          sql`${studySession.startTime} < ${dayEnd}`
        )
      )
      .get();

    if (Number(hadActivity?.count) > 0) {
      currentStreak++;
      currentDate.setDate(currentDate.getDate() - 1);
    } else {
      if (currentStreak === 0 && currentDate.getTime() === today.getTime()) {
        const todayActivity = await db
          .select({ count: sql<number>`count(*)` })
          .from(studySession)
          .where(
            and(
              eq(studySession.userId, userId),
              sql`${studySession.startTime} >= ${today.getTime()}`
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
  
  const now = new Date();
  const utcMidnight = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  ));
  
  const todayStart = utcMidnight.getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000);

  const todayStats = await db
    .select({
      cardsStudied: sql<number>`COALESCE(sum(${studySession.cardsStudied}), 0)`,
      totalTime: sql<number>`COALESCE(
        ROUND(
          SUM(
            CAST(
              (${studySession.endTime} - ${studySession.startTime}) 
              AS FLOAT
            ) / 600.0
          ),
          2
        ),
        0
      )`,
    })
    .from(studySession)
    .where(
      and(
        eq(studySession.userId, userId),
        sql`${studySession.startTime} >= ${todayStart}`,
        sql`${studySession.startTime} < ${todayEnd}`
      )
    )
    .get();

  const thirtyDaysAgo = new Date(utcMidnight);
  thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 29);

  const sessions = await db
    .select({
      startTime: studySession.startTime,
      endTime: studySession.endTime,
      cardsStudied: studySession.cardsStudied,
    })
    .from(studySession)
    .where(
      and(
        eq(studySession.userId, userId),
        sql`${studySession.startTime} >= ${thirtyDaysAgo.getTime()}`
      )
    );

  const sessionsByDate = new Map<string, { count: number; studyTime: number }>();
  
  sessions.forEach(session => {
    const utcDate = new Date(Number(session.startTime));
    const dateKey = utcDate.toISOString().split('T')[0];
    
    const existing = sessionsByDate.get(dateKey) || { count: 0, studyTime: 0 };
    sessionsByDate.set(dateKey, {
      count: existing.count + Number(session.cardsStudied),
      studyTime: existing.studyTime + 
        (Number(session.endTime) - Number(session.startTime)) / 600
    });
  });

  const dailyStats: StudyData[] = [];
  for (let i = 0; i < 30; i++) {
    const date = new Date(thirtyDaysAgo);
    date.setUTCDate(thirtyDaysAgo.getUTCDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayStats = sessionsByDate.get(dateStr) || { count: 0, studyTime: 0 };
    dailyStats.push({
      date: dateStr,
      count: dayStats.count,
      studyTime: Math.round(dayStats.studyTime * 100) / 100
    });
  }

  let streak = 0;
  let currentDate = new Date(utcMidnight);
  let continuousStreak = true;

  while (continuousStreak) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayStats = sessionsByDate.get(dateStr);
    
    if (dayStats && dayStats.count > 0) {
      streak++;
      currentDate.setUTCDate(currentDate.getUTCDate() - 1);
    } else {
      if (streak === 0 && dateStr === utcMidnight.toISOString().split('T')[0]) {
        const todayStats = sessionsByDate.get(dateStr);
        if (todayStats && todayStats.count > 0) {
          streak = 1;
        }
      }
      continuousStreak = false;
    }
  }

  return {
    totalCardsToday: Number(todayStats?.cardsStudied || 0),
    studyTimeToday: Number(todayStats?.totalTime || 0),
    streak,
    lastThirtyDays: dailyStats
  };
}


export async function updateFlashcard(id: string, front: string, back: string, reviewData?: {
  lastReviewed: string | Date;
  nextReview: string | Date;
  easeFactor: number;
  interval: number;
}) {
  const db = await createDbClient();

  try {
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
    throw error;
  }
}

export async function deleteFlashcard(id: string) {
  const db = await createDbClient();
  try {
    await db.delete(flashcard).where(eq(flashcard.id, id));
  } catch (error) {
    throw error;
  }
}

export async function createFlashcard(deckId: string, front: string, back: string) {
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
      ...created,
      createdAt: new Date(Number(created.createdAt)),
      updatedAt: new Date(Number(created.updatedAt)),
      lastReviewed: created.lastReviewed ? new Date(Number(created.lastReviewed)) : null,
      nextReview: created.nextReview ? new Date(Number(created.nextReview)) : null,
      easeFactor: Number(created.easeFactor),
      interval: Number(created.interval)
    };
  } catch (error) {
    throw error;
  }
}