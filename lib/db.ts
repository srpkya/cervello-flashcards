import { drizzle } from 'drizzle-orm/libsql';
import { and, eq, gte, lt, sql } from 'drizzle-orm';
import { createClient } from '@libsql/client';
import * as schema from './schema';
import { 
  user, deck, flashcard, studySession, reviewLog,
  type User, type Deck, type Flashcard, 
  type StudySession, type ReviewLog,
  type CardState,
  deckLabel,
  label,
  sharedDeck,
  deckRating
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
    const db = await getDb();
    
    // Join with deck_label and label tables to get labels
    const decksWithLabels = await db
      .select({
        id: deck.id,
        userId: deck.userId,
        title: deck.title,
        description: deck.description,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        originalSharedDeckId: deck.originalSharedDeckId,
        labels: sql<string[]>`JSON_GROUP_ARRAY(DISTINCT CASE WHEN ${label.name} IS NULL THEN NULL ELSE ${label.name} END)`
      })
      .from(deck)
      .leftJoin(deckLabel, eq(deck.id, deckLabel.deckId))
      .leftJoin(label, eq(deckLabel.labelId, label.id))
      .where(eq(deck.userId, userId))
      .groupBy(deck.id);

    return decksWithLabels.map(deck => ({
      ...deck,
      labels: deck.labels[0] === null ? [] 
        : Array.from(new Set(JSON.parse(deck.labels.toString())))
    }));
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

export async function createDeck(
  userId: string, 
  title: string, 
  description: string,
  labels: string[] = []
) {
  const db = await getDb();
  const now = Date.now();
  
  try {
    const deckId = crypto.randomUUID();
    
    await db.transaction(async (tx) => {
      // Create the deck
      await tx.insert(deck).values({
        id: deckId,
        userId,
        title,
        description,
        createdAt: now,
        updatedAt: now,
      });

      // Handle labels
      for (const labelName of labels) {
        // Create or get existing label
        let labelId = crypto.randomUUID();
        const existingLabel = await tx
          .select()
          .from(label)
          .where(eq(label.name, labelName))
          .get();

        if (existingLabel) {
          labelId = existingLabel.id;
        } else {
          await tx.insert(label).values({
            id: labelId,
            name: labelName,
            createdAt: now,
          });
        }

        // Create deck-label association
        await tx.insert(deckLabel).values({
          id: crypto.randomUUID(),
          deckId: deckId,
          labelId: labelId,
        });
      }
    });

    return await getDeck(deckId);
  } catch (error) {
    console.error('Error creating deck:', error);
    throw error;
  }
}

export async function updateDeck(
  id: string, 
  title: string, 
  description: string,
  labels: string[] = []
) {
  const db = await getDb();
  
  try {
    await db.transaction(async (tx) => {
      // Update deck details
      await tx.update(deck)
        .set({
          title,
          description,
          updatedAt: Date.now()
        })
        .where(eq(deck.id, id));

      // Remove existing labels
      await tx.delete(deckLabel)
        .where(eq(deckLabel.deckId, id));

      // Add new labels
      for (const labelName of labels) {
        // Create or get existing label
        let labelId = crypto.randomUUID();
        const existingLabel = await tx
          .select()
          .from(label)
          .where(eq(label.name, labelName))
          .get();

        if (existingLabel) {
          labelId = existingLabel.id;
        } else {
          await tx.insert(label).values({
            id: labelId,
            name: labelName,
            createdAt: Date.now(),
          });
        }

        // Create deck-label association
        await tx.insert(deckLabel).values({
          id: crypto.randomUUID(),
          deckId: id,
          labelId: labelId,
        });
      }
    });

    return getDeck(id);
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
    lastReviewed: number;
    nextReview: number | null;  // Allow null here
    state?: 'new' | 'learning' | 'review' | 'relearning';
    stability?: number;
    difficulty?: number;
    elapsedDays?: number;
    scheduledDays?: number;
    reps?: number;
    lapses?: number;
  }
) {
  const db = await getDb();

  try {
    const updateData: Record<string, any> = {
      front,
      back,
      updatedAt: Date.now()
    };

    if (reviewData) {
      updateData.lastReviewed = reviewData.lastReviewed;
      updateData.nextReview = reviewData.nextReview;
      
      if (reviewData.state) updateData.state = reviewData.state;
      if (typeof reviewData.stability === 'number') updateData.stability = reviewData.stability;
      if (typeof reviewData.difficulty === 'number') updateData.difficulty = reviewData.difficulty;
      if (typeof reviewData.elapsedDays === 'number') updateData.elapsedDays = reviewData.elapsedDays;
      if (typeof reviewData.scheduledDays === 'number') updateData.scheduledDays = reviewData.scheduledDays;
      if (typeof reviewData.reps === 'number') updateData.reps = reviewData.reps;
      if (typeof reviewData.lapses === 'number') updateData.lapses = reviewData.lapses;
    }

    await db
      .update(flashcard)
      .set(updateData)
      .where(eq(flashcard.id, id));

    const updatedCard = await db
      .select()
      .from(flashcard)
      .where(eq(flashcard.id, id))
      .get();

    if (!updatedCard) {
      throw new Error('Failed to fetch updated flashcard');
    }

    // Convert the values to appropriate types
    return {
      ...updatedCard,
      createdAt: Number(updatedCard.createdAt),
      updatedAt: Number(updatedCard.updatedAt),
      lastReviewed: updatedCard.lastReviewed ? Number(updatedCard.lastReviewed) : null,
      nextReview: updatedCard.nextReview ? Number(updatedCard.nextReview) : null,
      stability: Number(updatedCard.stability),
      difficulty: Number(updatedCard.difficulty),
      elapsedDays: Number(updatedCard.elapsedDays),
      scheduledDays: Number(updatedCard.scheduledDays),
      reps: Number(updatedCard.reps),
      lapses: Number(updatedCard.lapses),
      interval: Number(updatedCard.interval),
      easeFactor: Number(updatedCard.easeFactor)
    };

  } catch (error) {
    console.error('Error in updateFlashcard:', error);
    throw new Error(`Failed to update flashcard: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
  const db = await createDbClient();

  try {
    // First verify the deck exists
    const deckExists = await db
      .select()
      .from(deck)
      .where(eq(deck.id, deckId))
      .get();

    if (!deckExists) {
      throw new Error('Deck not found');
    }

    // Use explicit casting in the SQL query to handle BigInt values
    const cards = await db
      .select({
        id: flashcard.id,
        deckId: flashcard.deckId,
        front: flashcard.front,
        back: flashcard.back,
        audio: flashcard.audio,
        createdAt: sql<string>`CAST(${flashcard.createdAt} AS TEXT)`,
        updatedAt: sql<string>`CAST(${flashcard.updatedAt} AS TEXT)`,
        lastReviewed: sql<string>`CAST(${flashcard.lastReviewed} AS TEXT)`,
        nextReview: sql<string>`CAST(${flashcard.nextReview} AS TEXT)`,
        state: flashcard.state,
        stability: sql<string>`CAST(${flashcard.stability} AS TEXT)`,
        difficulty: sql<string>`CAST(${flashcard.difficulty} AS TEXT)`,
        elapsedDays: sql<string>`CAST(${flashcard.elapsedDays} AS TEXT)`,
        scheduledDays: sql<string>`CAST(${flashcard.scheduledDays} AS TEXT)`,
        reps: sql<string>`CAST(${flashcard.reps} AS TEXT)`,
        lapses: sql<string>`CAST(${flashcard.lapses} AS TEXT)`,
        interval: sql<string>`CAST(${flashcard.interval} AS TEXT)`,
        easeFactor: sql<string>`CAST(${flashcard.easeFactor} AS TEXT)`
      })
      .from(flashcard)
      .where(eq(flashcard.deckId, deckId));

    // Convert the string values to appropriate JavaScript types
    return cards.map(card => ({
      ...card,
      createdAt: parseInt(card.createdAt, 10),
      updatedAt: parseInt(card.updatedAt, 10),
      lastReviewed: card.lastReviewed ? parseInt(card.lastReviewed, 10) : null,
      nextReview: card.nextReview ? parseInt(card.nextReview, 10) : null,
      stability: parseFloat(card.stability),
      difficulty: parseFloat(card.difficulty),
      elapsedDays: parseInt(card.elapsedDays, 10),
      scheduledDays: parseInt(card.scheduledDays, 10),
      reps: parseInt(card.reps, 10),
      lapses: parseInt(card.lapses, 10),
      interval: parseInt(card.interval, 10),
      easeFactor: parseInt(card.easeFactor, 10)
    }));

  } catch (error) {
    console.error('Database error in getFlashcards:', error);
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }
    
    throw new Error('Failed to fetch flashcards: Unknown error');
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
    // Ensure times are stored as milliseconds timestamps
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
    // Get today's study sessions with detailed time tracking
    const todaysSessions = await db
      .select({
        cardsStudied: studySession.cardsStudied,
        startTime: studySession.startTime,
        endTime: studySession.endTime,
        correctCount: studySession.correctCount,
        incorrectCount: studySession.incorrectCount
      })
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          gte(studySession.startTime, todayStart),
          lt(studySession.endTime, todayEnd)
        )
      );

    // Calculate total study time in minutes
    const todayStats = todaysSessions.reduce(
      (acc, session) => ({
        cardsStudied: acc.cardsStudied + session.cardsStudied,
        studyTime: acc.studyTime + (session.endTime - session.startTime),
        correctCount: acc.correctCount + session.correctCount,
        incorrectCount: acc.incorrectCount + session.incorrectCount,
      }),
      {
        cardsStudied: 0,
        studyTime: 0,
        correctCount: 0,
        incorrectCount: 0,
      }
    );

    const studyTimeMinutes = Math.round(todayStats.studyTime / (1000 * 60));

    // Get last 30 days of data
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const lastThirtyDaysSessions = await db
      .select()
      .from(studySession)
      .where(
        and(
          eq(studySession.userId, userId),
          gte(studySession.startTime, thirtyDaysAgo.getTime())
        )
      );

    // Process sessions into daily data
    const dailyData = new Map();
    
    // Initialize all dates in the last 30 days
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
    
    while (streak < 30) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayData = dailyData.get(dateStr);
      
      if (!dayData || (dayData.count === 0 && dateStr !== now.toISOString().split('T')[0])) {
        break;
      }
      
      if (dayData.count > 0) {
        streak++;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return {
      totalCardsToday: todayStats.cardsStudied,
      studyTimeToday: studyTimeMinutes,
      correctCount: todayStats.correctCount,
      incorrectCount: todayStats.incorrectCount,
      accuracy: todayStats.cardsStudied > 0 
        ? Math.round((todayStats.correctCount / todayStats.cardsStudied) * 100)
        : 0,
      streak,
      lastThirtyDays: Array.from(dailyData, ([date, data]) => ({
        date,
        count: data.count,
        studyTime: Math.round(data.studyTime / (1000 * 60)) // Convert to minutes
      })).sort((a, b) => a.date.localeCompare(b.date))
    };
  } catch (error) {
    console.error('Error fetching study stats:', error);
    throw error;
  }
}

export async function getMarketplaceDecks() {
  const db = await getDb();
  
  const decks = await db
    .select({
      id: sharedDeck.id,
      title: sharedDeck.title,
      description: sharedDeck.description,
      downloads: sharedDeck.downloads,
      createdAt: sharedDeck.createdAt,
      userId: sharedDeck.userId,
      user: {
        name: user.name,
        image: user.image,
      },
      averageRating: sql<number>`COALESCE(AVG(${deckRating.rating}), 0)`.as('averageRating'),
      ratingCount: sql<number>`COUNT(${deckRating.id})`.as('ratingCount'),
      labels: sql<string[]>`JSON_GROUP_ARRAY(DISTINCT CASE WHEN ${label.name} IS NULL THEN NULL ELSE ${label.name} END)`
    })
    .from(sharedDeck)
    .leftJoin(user, eq(sharedDeck.userId, user.id))
    .leftJoin(deckRating, eq(sharedDeck.id, deckRating.sharedDeckId))
    .leftJoin(deckLabel, eq(sharedDeck.id, deckLabel.deckId))
    .leftJoin(label, eq(deckLabel.labelId, label.id))
    .groupBy(sharedDeck.id, user.name, user.image);

  // Transform the results to handle empty labels and JSON parsing
  return decks.map(deck => ({
    ...deck,
    labels: deck.labels[0] === null ? [] 
      : Array.from(new Set(JSON.parse(deck.labels.toString())))
  }));
}