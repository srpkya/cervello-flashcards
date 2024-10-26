import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm/expressions';
import { decks, flashcards } from './schema';
import { Deck, Flashcard } from './types';
import * as schema from './schema';
import { createClient } from '@libsql/client';

let db: ReturnType<typeof drizzle<typeof schema>>;

// This is needed for NextAuth adapter
export async function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Cannot use database client in browser environment');
  }
  
  if (!db) {
    const client = createClient({
      url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
      authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
    });
    db = drizzle(client, { schema });
  }
  
  return db;
}

// Create a new client for each request
async function createDbClient() {
  const client = createClient({
    url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
    authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
  });
  return drizzle(client, { schema });
}

// Decks functions
export async function getDecks(userId: string): Promise<Deck[]> {
  const db = await createDbClient();
  try {
    const results = await db.select().from(decks).where(eq(decks.userId, userId));
    return results.map(deck => ({
      ...deck,
      createdAt: new Date(deck.createdAt),
      updatedAt: new Date(deck.updatedAt)
    }));
  } catch (error) {
    console.error('Error in getDecks:', error);
    throw error;
  }
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const db = await createDbClient();
  try {
    const result = await db.select().from(decks).where(eq(decks.id, id)).get();
    if (!result) return undefined;
    
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt)
    };
  } catch (error) {
    console.error('Error in getDeck:', error);
    throw error;
  }
}

export async function createDeck(userId: string, title: string, description: string): Promise<Deck> {
  const db = await createDbClient();
  const now = new Date();
  const newDeck = {
    id: crypto.randomUUID(),
    userId,
    title,
    description,
    createdAt: now,
    updatedAt: now,
  };
  
  try {
    await db.insert(decks).values(newDeck);
    
    const createdDeck = await getDeck(newDeck.id);
    if (!createdDeck) {
      throw new Error('Failed to create deck');
    }
    
    return createdDeck;
  } catch (error) {
    console.error('Error in createDeck:', error);
    throw error;
  }
}

export async function updateDeck(id: string, title: string, description: string): Promise<Deck> {
  const db = await createDbClient();
  const now = new Date();
  
  try {
    await db.update(decks)
      .set({ title, description, updatedAt: now })
      .where(eq(decks.id, id));
    
    const updatedDeck = await getDeck(id);
    if (!updatedDeck) {
      throw new Error('Deck not found after update');
    }
    return updatedDeck;
  } catch (error) {
    console.error('Error in updateDeck:', error);
    throw error;
  }
}

export async function deleteDeck(id: string): Promise<void> {
  const db = await createDbClient();
  try {
    await db.delete(decks).where(eq(decks.id, id));
  } catch (error) {
    console.error('Error in deleteDeck:', error);
    throw error;
  }
}

// Flashcards functions
export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  console.log('Getting fresh DB client for flashcards query');
  const db = await createDbClient();
  
  try {
    console.log('Executing flashcards query for deckId:', deckId);
    
    const results = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId))
      .execute();
    
    console.log('Raw query results:', results);

    if (!Array.isArray(results)) {
      console.error('Unexpected query results format:', results);
      return [];
    }

    const transformedResults = results.map(card => ({
      id: card.id,
      deckId: card.deckId,
      front: card.front,
      back: card.back,
      createdAt: new Date(card.createdAt),
      updatedAt: new Date(card.updatedAt),
      lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null,
      nextReview: card.nextReview ? new Date(card.nextReview) : null,
      easeFactor: Number(card.easeFactor),
      interval: Number(card.interval)
    }));

    console.log('Transformed results:', transformedResults);
    return transformedResults;
  } catch (error) {
    console.error('Error in getFlashcards:', error);
    throw error;
  }
}

export async function getFlashcard(id: string): Promise<Flashcard | undefined> {
  const db = await createDbClient();
  try {
    const result = await db.select()
      .from(flashcards)
      .where(eq(flashcards.id, id))
      .get();
    
    if (!result) return undefined;
    
    return {
      ...result,
      createdAt: new Date(result.createdAt),
      updatedAt: new Date(result.updatedAt),
      lastReviewed: result.lastReviewed ? new Date(result.lastReviewed) : null,
      nextReview: result.nextReview ? new Date(result.nextReview) : null,
      easeFactor: Number(result.easeFactor),
      interval: Number(result.interval)
    };
  } catch (error) {
    console.error('Error in getFlashcard:', error);
    throw error;
  }
}

export async function createFlashcard(deckId: string, front: string, back: string): Promise<Flashcard> {
  const db = await createDbClient();
  const now = new Date();
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
    await db.insert(flashcards).values(newFlashcard);

    const createdFlashcard = await getFlashcard(newFlashcard.id);
    if (!createdFlashcard) {
      throw new Error('Failed to create flashcard');
    }

    return createdFlashcard;
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
    lastReviewed?: Date;
    nextReview?: Date;
    easeFactor?: number;
    interval?: number;
  }
): Promise<Flashcard> {
  const db = await createDbClient();
  
  try {
    const updateData: any = { 
      front, 
      back, 
      updatedAt: new Date(),
    };

    if (reviewData) {
      if (reviewData.lastReviewed) updateData.lastReviewed = reviewData.lastReviewed;
      if (reviewData.nextReview) updateData.nextReview = reviewData.nextReview;
      if (reviewData.easeFactor !== undefined) updateData.easeFactor = reviewData.easeFactor;
      if (reviewData.interval !== undefined) updateData.interval = reviewData.interval;
    }

    await db.update(flashcards)
      .set(updateData)
      .where(eq(flashcards.id, id));

    const updatedCard = await getFlashcard(id);
    if (!updatedCard) {
      throw new Error('Flashcard not found after update');
    }

    return updatedCard;
  } catch (error) {
    console.error('Error updating flashcard:', error);
    throw error;
  }
}

export async function deleteFlashcard(id: string): Promise<void> {
  const db = await createDbClient();
  try {
    await db.delete(flashcards).where(eq(flashcards.id, id));
  } catch (error) {
    console.error('Error deleting flashcard:', error);
    throw error;
  }
}

// Review-specific functions
export async function getDueFlashcards(deckId: string): Promise<Flashcard[]> {
  const db = await createDbClient();
  const now = new Date();
  
  try {
    const results = await db
      .select()
      .from(flashcards)
      .where(eq(flashcards.deckId, deckId))
      .execute();

    return results
      .filter(card => !card.nextReview || new Date(card.nextReview) <= now)
      .map(card => ({
        ...card,
        createdAt: new Date(card.createdAt),
        updatedAt: new Date(card.updatedAt),
        lastReviewed: card.lastReviewed ? new Date(card.lastReviewed) : null,
        nextReview: card.nextReview ? new Date(card.nextReview) : null,
        easeFactor: Number(card.easeFactor),
        interval: Number(card.interval)
      }));
  } catch (error) {
    console.error('Error getting due flashcards:', error);
    throw error;
  }
}

export async function updateFlashcardReviewData(
  id: string,
  reviewData: {
    lastReviewed: Date;
    nextReview: Date;
    easeFactor: number;
    interval: number;
  }
): Promise<Flashcard> {
  const db = await createDbClient();
  
  try {
    await db.update(flashcards)
      .set({
        lastReviewed: reviewData.lastReviewed,
        nextReview: reviewData.nextReview,
        easeFactor: reviewData.easeFactor,
        interval: reviewData.interval,
        updatedAt: new Date()
      })
      .where(eq(flashcards.id, id));

    const updatedCard = await getFlashcard(id);
    if (!updatedCard) {
      throw new Error('Flashcard not found after review update');
    }

    return updatedCard;
  } catch (error) {
    console.error('Error updating flashcard review data:', error);
    throw error;
  }
}