import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm/expressions';
import { decks, flashcards } from './schema';
import { Deck, Flashcard } from './types';
import * as schema from './schema';

let db: ReturnType<typeof drizzle<typeof schema>>;

export async function getDb() {
  if (typeof window !== 'undefined') {
    throw new Error('Cannot use database client in browser environment');
  }
  
  if (!db) {
    const { createClient } = await import('@libsql/client');
    const client = createClient({
      url: process.env.NEXT_PUBLIC_TURSO_DATABASE_URL!,
      authToken: process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN,
    });
    db = drizzle(client, { schema });
  }
  
  return db;
}

export async function getDecks(userId: string): Promise<Deck[]> {
  const db = await getDb();
  return db.select().from(decks).where(eq(decks.userId, userId));
}

export async function getDeck(id: string): Promise<Deck | undefined> {
  const db = await getDb();
  return db.select().from(decks).where(eq(decks.id, id)).get();
}

export async function createDeck(userId: string, title: string, description: string): Promise<Deck> {
  const db = await getDb();
  const now = new Date();
  const newDeck = {
    id: crypto.randomUUID(),
    userId,
    title,
    description,
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(decks).values(newDeck);
  
  // Fetch the newly created deck
  const createdDeck = await db.select().from(decks).where(eq(decks.id, newDeck.id)).get();
  
  if (!createdDeck) {
    throw new Error('Failed to create deck');
  }
  
  return createdDeck;
}

export async function updateDeck(id: string, title: string, description: string): Promise<Deck> {
  const db = await getDb();
  const now = new Date();
  await db.update(decks)
    .set({ title, description, updatedAt: now })
    .where(eq(decks.id, id));
  
  const updatedDeck = await getDeck(id);
  if (!updatedDeck) {
    throw new Error('Deck not found after update');
  }
  return updatedDeck;
}

export async function deleteDeck(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(decks).where(eq(decks.id, id));
}

export async function getFlashcards(deckId: string): Promise<Flashcard[]> {
  const db = await getDb();
  return db.select().from(flashcards).where(eq(flashcards.deckId, deckId));
}

export async function createFlashcard(deckId: string, front: string, back: string) {
  const db = await getDb();
  const now = new Date();
  return db.insert(flashcards).values({
    id: crypto.randomUUID(),
    deckId,
    front,
    back,
    createdAt: now,
    updatedAt: now,
  });
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
) {
  const db = await getDb();
  const updateData: any = { 
    front, 
    back, 
    updatedAt: new Date(),
  };

  if (reviewData) {
    if (reviewData.lastReviewed) updateData.lastReviewed = reviewData.lastReviewed;
    if (reviewData.nextReview) updateData.nextReview = reviewData.nextReview;
    if (reviewData.easeFactor) updateData.easeFactor = reviewData.easeFactor;
    if (reviewData.interval) updateData.interval = reviewData.interval;
  }

  return db.update(flashcards)
    .set(updateData)
    .where(eq(flashcards.id, id));
}

export async function deleteFlashcard(id: string) {
  const db = await getDb();
  return db.delete(flashcards).where(eq(flashcards.id, id));
}