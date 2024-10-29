import { drizzle } from 'drizzle-orm/libsql';
import { and, eq, gte, lt } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { 
  user, deck, flashcard, studySession, reviewLog,
  type User, type Deck, type Flashcard, 
  type StudySession, type ReviewLog,
  type CardState
} from './schema';

const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000;

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
  try {
    const db = await createDbClient();
    const results = await db.select().from(deck).where(eq(deck.userId, userId));
    return results;
  } catch (error) {
    console.error('Error fetching decks:', error);
    throw error;
  }
}

export async function getDeck(id: string) {
  try {
    const db = await createDbClient();
    return await db.select().from(deck).where(eq(deck.id, id)).get();
  } catch (error) {
    console.error('Error fetching deck:', error);
    throw error;
  }
}

export async function createDeck(userId: string, title: string, description: string) {
  const db = await createDbClient();
  const now = Date.now();
  
  try {
    const newDeck = {
      id: crypto.randomUUID(),
      userId,
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(deck).values(newDeck);
    return newDeck;
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
}

export async function updateDeck(id: string, title: string, description: string) {
  const db = await createDbClient();
  
  try {
    await db.update(deck)
      .set({
        title,
        description,
        updatedAt: Date.now()
      })
      .where(eq(deck.id, id));

    return await getDeck(id);
  } catch (error) {
    console.error('Error updating deck:', error);
    throw error;
  }
}

export async function deleteDeck(id: string) {
  try {
    const db = await createDbClient();
    await db.delete(deck).where(eq(deck.id, id));
  } catch (error) {
    console.error('Error deleting deck:', error);
    throw error;
  }
}

export async function createFlashcard(
  deckId: string,
  front: string,
  back: string,
  audio?: string
) {
  const db = await createDbClient();
  const now = Date.now();

  try {
    const newFlashcard = {
      id: crypto.randomUUID(),
      deckId,
      front,
      back,
      audio,
      createdAt: now,
      updatedAt: now,
      lastReviewed: null,
      nextReview: null,
      state: 'new' as const,
      stability: 1,
      difficulty: 5,
      elapsedDays: 0,
      scheduledDays: 0,
      reps: 0,
      lapses: 0,
      interval: 0,
      easeFactor: 250,
    };

    await db.insert(flashcard).values(newFlashcard);
    return newFlashcard;
  } catch (error) {
    console.error('Error creating flashcard:', error);
    throw error;
  }
}

export async function updateFlashcard(
  id: string,
  front: string,
  back: string,
  reviewData?: {
    lastReviewed: number | string | Date;
    nextReview: number | string | Date;
    state?: schema.CardState;
    stability?: number;
    difficulty?: number;
    elapsedDays?: number;
    scheduledDays?: number;
    reps?: number;
    lapses?: number;
    interval?: number;
    easeFactor?: number;
  }
) {
  const db = await createDbClient();

  try {
    const updateData: Partial<Flashcard> = {
      front,
      back,
      updatedAt: Date.now()
    };

    if (reviewData) {
      updateData.lastReviewed = typeof reviewData.lastReviewed === 'number'
        ? reviewData.lastReviewed
        : new Date(reviewData.lastReviewed).getTime();

      updateData.nextReview = typeof reviewData.nextReview === 'number'
        ? reviewData.nextReview
        : new Date(reviewData.nextReview).getTime();

      if (reviewData.state) updateData.state = reviewData.state;
      if (reviewData.stability !== undefined) updateData.stability = reviewData.stability;
      if (reviewData.difficulty !== undefined) updateData.difficulty = reviewData.difficulty;
      if (reviewData.elapsedDays !== undefined) updateData.elapsedDays = reviewData.elapsedDays;
      if (reviewData.scheduledDays !== undefined) updateData.scheduledDays = reviewData.scheduledDays;
      if (reviewData.reps !== undefined) updateData.reps = reviewData.reps;
      if (reviewData.lapses !== undefined) updateData.lapses = reviewData.lapses;
      if (reviewData.interval !== undefined) updateData.interval = reviewData.interval;
      if (reviewData.easeFactor !== undefined) updateData.easeFactor = reviewData.easeFactor;
    }

    await db.update(flashcard)
      .set(updateData)
      .where(eq(flashcard.id, id));

    return await db.select()
      .from(flashcard)
      .where(eq(flashcard.id, id))
      .get();
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
}

export async function deleteFlashcard(id: string) {
  try {
    const db = await createDbClient();
    await db.delete(flashcard).where(eq(flashcard.id, id));
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
}

export async function getFlashcards(deckId: string) {
  try {
    const db = await createDbClient();
    return await db.select()
      .from(flashcard)
      .where(eq(flashcard.deckId, deckId));
  } catch (error) {
    console.error('Error fetching flashcards:', error);
    throw error;
  }
}

export async function createStudySession(
  userId: string,
  cardsStudied: number,
  startTime: Date,
  endTime: Date,
  correctCount: number = 0,
  incorrectCount: number = 0,
  averageTime: number = 0
) {
  const db = await createDbClient();

  try {
    const sessionData = {
      id: crypto.randomUUID(),
      userId,
      cardsStudied,
      startTime: startTime.getTime(),
      endTime: endTime.getTime(),
      createdAt: Date.now(),
      correctCount,
      incorrectCount,
      averageTime
    };

    await db.insert(studySession).values(sessionData);
    return sessionData;
  } catch (error) {
    console.error('Error creating study session:', error);
    throw error;
  }
}

export async function createReviewLog(
  userId: string,
  flashcardId: string,
  rating: number,
  reviewData: {
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    responseTime: number;
  }
) {
  const db = await createDbClient();

  try {
    const logEntry = {
      id: crypto.randomUUID(),
      userId,
      flashcardId,
      rating,
      reviewedAt: Date.now(),
      ...reviewData
    };

    await db.insert(reviewLog).values(logEntry);
    return logEntry;
  } catch (error) {
    console.error('Error creating review log:', error);
    throw error;
  }
}

export async function getStudyStats(userId: string) {
  const db = await createDbClient();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + (24 * 60 * 60 * 1000);

  try {
    // Get today's study sessions
    const todaysSessions = await db
      .select()
      .from(schema.studySession)
      .where(
        and(
          eq(schema.studySession.userId, userId),
          gte(schema.studySession.startTime, todayStart),
          lt(schema.studySession.startTime, todayEnd)
        )
      );

    // Calculate today's totals
    const todayStats = todaysSessions.reduce(
      (acc, session) => ({
        cardsStudied: acc.cardsStudied + session.cardsStudied,
        studyTime: acc.studyTime + (session.endTime - session.startTime),
        correctCount: acc.correctCount + (session.correctCount || 0),
        incorrectCount: acc.incorrectCount + (session.incorrectCount || 0),
      }),
      {
        cardsStudied: 0,
        studyTime: 0,
        correctCount: 0,
        incorrectCount: 0,
      }
    );

    // Get last 30 days of data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const lastThirtyDaysSessions = await db
      .select()
      .from(schema.studySession)
      .where(
        and(
          eq(schema.studySession.userId, userId),
          gte(schema.studySession.startTime, thirtyDaysAgo.getTime())
        )
      );

    // Process the sessions into daily data
    const dailyData = new Map();
    
    // Initialize all dates in the last 30 days with zero values
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData.set(dateStr, { count: 0, studyTime: 0 });
    }

    // Fill in actual study data
    lastThirtyDaysSessions.forEach(session => {
      const date = new Date(session.startTime).toISOString().split('T')[0];
      const existing = dailyData.get(date) || { count: 0, studyTime: 0 };
      dailyData.set(date, {
        count: existing.count + session.cardsStudied,
        studyTime: existing.studyTime + (session.endTime - session.startTime)
      });
    });

    // Calculate streak
    let streak = 0;
    let currentDate = new Date(now);
    currentDate.setHours(0, 0, 0, 0);
    
    while (streak < 30) { // Limit to 30 days to prevent infinite loop
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr);
      
      if (!dayData || dayData.count === 0) {
        // Stop counting streak if we find a day with no study activity
        // Unless it's today and we haven't studied yet
        if (streak > 0 || dateStr !== now.toISOString().split('T')[0]) {
          break;
        }
      }
      
      if (dayData?.count > 0) {
        streak++;
      }
      
      // Move to previous day
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      totalCardsToday: todayStats.cardsStudied,
      studyTimeToday: Math.floor(todayStats.studyTime / (1000 * 60)), // Convert to minutes
      correctCount: todayStats.correctCount,
      incorrectCount: todayStats.incorrectCount,
      accuracy: todayStats.cardsStudied > 0 
        ? Math.round((todayStats.correctCount / todayStats.cardsStudied) * 100)
        : 0,
      streak,
      lastThirtyDays: Array.from(dailyData, ([date, data]) => ({
        date,
        count: data.count,
        studyTime: Math.floor(data.studyTime / (1000 * 60))
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  } catch (error) {
    console.error('Error fetching study stats:', error);
    throw error;
  }
}