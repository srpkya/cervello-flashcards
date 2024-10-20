import { Session } from "next-auth"

export interface Deck {
  id: string;
  title: string;
  description: string | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Config = {
  schema: string;
  out: string;
  dialect: "sqlite";
  driver: "d1-http" | "expo" | "turso" | undefined; 
  dbCredentials: {
    url: string;
    authToken: string | undefined;
  };
};


export interface Flashcard {
  id: string;
  deckId: string;
  front: string;
  back: string;
  createdAt: Date;
  updatedAt: Date;
  lastReviewed: Date | null;
  nextReview: Date | null;
  easeFactor: number;
  interval: number;
}

export interface ExtendedUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface ExtendedSession extends Session {
  user: ExtendedUser;
}